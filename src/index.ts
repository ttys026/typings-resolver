import path from 'path-browserify';
import fetch from 'cross-fetch';
import { getTypePackageName, getOriginalPackageName } from './utils/transform';
import { getImports } from './utils/dependency';
import { EventEmitter } from 'events';

type File = { name: string, version?: string, path: string };
export interface ResolverOptions {
  resolutions?: Record<string, string>;
  contentResolver?: (params: File) => Promise<string>;
}

export const unpkgContentResolver = async (params: File) => {
  const key = `${params.name}@${params.version}/${params.path}`;
  const res = await fetch(`https://unpkg.com/${key}`);
  if (res.status !== 200) {
    return '';
  }
  return await res.text();
}

export const jsdelivrContentResolver = async (params: File) => {
  const key = `${params.name}@${params.version}/${params.path}`;
  const res = await fetch(`https://cdn.jsdelivr.net/npm/${key}`);
  if (res.status !== 200) {
    return '';
  }
  return await res.text();
}

export class Resolver {
  private files = new Map<string, string>();
  /** cached files that do not output */
  private cache = new Map<string, string>();
  private resolutions: Record<string, string> = {};
  private downloadCache: string[] = [];
  public emitter = new EventEmitter();
  private _contentResolver = unpkgContentResolver;

  private contentResolver = async (params: File) => {
    const { name, path = '' } = params;
    const version = this.resolutions[name] ?? params.version ?? '>=0';
    const key = `${name}@${version}/${path}`;
    if (this.downloadCache.includes(key)) {
      return '';
    }
    const content = await this._contentResolver({ name, path, version });
    this.downloadCache.push(key);
    return content;
  }

  constructor(options?: ResolverOptions) {
    if (options?.contentResolver) {
      this._contentResolver = options.contentResolver;
    }
    if (options?.resolutions) {
      this.resolutions = options.resolutions;
    }
  }

  private setFileContentAndEmit(name: string, content: string) {
    if (!this.files.get(name) && !this.cache.get(name)) {
      this.emitter.emit('add', { name: getOriginalPackageName(name), content });
      this.files.set(name, content);
    }
  }

  private async getPackageJson(params: { name: string, version?: string }) {
    const fileName = path.join(params.name, 'package.json');
    const cache = this.files.get(fileName) || this.cache.get(fileName);
    if (cache) {
      return JSON.parse(cache);
    }
    const text = await this.contentResolver({ name: params.name, version: params.version, path: 'package.json' });
    if (text) {
      const pkgJson = JSON.parse(text);
      if (pkgJson.typings || pkgJson.types) {
        this.setFileContentAndEmit(fileName, text);
      } else {
        this.cache.set(fileName, text);
      }
      return pkgJson;
    }
    return {};
  }

  private isBuiltinModules(name: string) {
    return $$builtinModules.some(ele => name.split('/')[0] === ele) || name.startsWith('node:');
  }

  private async getProperPackageName(params: { name: string, version?: string }) {
    const pkgJson = await this.getPackageJson(params);
    const typeEntry = pkgJson.typings || pkgJson.types;
    if (typeEntry) {
      return { name: params.name, version: pkgJson.version, path: 'package.json' };
    }
    if (!params.name.startsWith('@types/')) {
      const pkgJson = await this.getPackageJson({ ...params, name: getTypePackageName(params.name) });
      const typeEntry = pkgJson.typings || pkgJson.types;
      if (typeEntry) {
        return { name: pkgJson.name, version: pkgJson.version, path: 'package.json' };
      }
    }
    return false;
  }

  public async addFile(params: { name: string, version?: string, path: string }) {
    const content = await this.contentResolver(params);
    if (content) {
      const fileName = path.join(params.name, params.path);
      this.setFileContentAndEmit(fileName, content);
    }
    const imports = getImports(content);
    await Promise.all(imports.map(async (relImp) => {
      if (relImp.startsWith('.') || relImp.endsWith('.d.ts')) {
        const tasks: Promise<void>[] = [];
        const imp = path.join(path.dirname(params.path), relImp);
        if (imp.endsWith('.d.ts')) {
          tasks.push(this.addFile({ ...params, path: imp }));
        } else {
          tasks.push(
            this.addFile({ ...params, path: `${imp}.d.ts` }),
            this.addFile({ ...params, path: `${imp}/index.d.ts` }),
          );
        }
        await Promise.all(tasks);
      } else {
        const name = this.isBuiltinModules(relImp) ? '@types/node' : relImp;
        const pkg = await this.getPackageJson({ name, version: params.version });
        const addInfo = pkg.version ? { name, version: pkg.version } : { name };
        await this._addPackage(addInfo);
      }
    }))
  }

  private async _addPackage(params: { name: string, version?: string }) {
    let properParams = params;
    if (this.isBuiltinModules(params.name)) {
      properParams = { name: '@types/node', version: params.version || 'latest' };
    } else {
      properParams = (await this.getProperPackageName(params) || { name: '', version: '' });
    }

    const pkgJson = await this.getPackageJson(properParams);
    const typeEntry = pkgJson.typings || pkgJson.types;
    if (typeEntry) {
      const tasks: Promise<void>[] = [
        this.addFile({ ...properParams, path: typeEntry }),
      ];
      if (!typeEntry.endsWith('.d.ts')) {
        tasks.push(this.addFile({ ...properParams, path: `${typeEntry}.d.ts` }))
        tasks.push(this.addFile({ ...properParams, path: `${typeEntry}/index.d.ts` }))
      }
      await Promise.all(tasks)
    }
  }

  public async addPackage(params: { name: string, version?: string }) {
    await this._addPackage(params);
    this.emitter.emit('done', params);
  }

  public getFiles() {
    return [...this.files.entries()].reduce<Record<string, string>>((acc, ele) => {
      const [file, content] = ele;
      const filePath = getOriginalPackageName(file);
      if (filePath && content) {
        acc[filePath] = content;
      }
      return acc;
    }, {})
  }
}
