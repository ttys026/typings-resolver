import { jest } from '@jest/globals';
import { Resolver, unpkgContentResolver, jsdelivrContentResolver, localContentResolver } from '..';
import fs from 'fs-extra';
import { dirname } from 'path';

jest.setTimeout(60000);

describe('resolve', () => {
  it('local fs', async () => {
    const resolver = new Resolver({ contentResolver: localContentResolver });
    const onAddFile = jest.fn();
    const onDoneResolve = jest.fn();
    resolver.emitter.on('add', onAddFile);
    resolver.emitter.on('done', onDoneResolve);
    await resolver.addPackage({ name: 'events' });
    const files = resolver.getFiles();

    expect(onAddFile).toHaveBeenCalledTimes(Object.keys(files).length);
    expect(onDoneResolve).toHaveBeenCalledTimes(1);
    expect(onDoneResolve).toHaveBeenCalledWith({ name: 'events' });
    expect(files).toMatchSnapshot();
  })

  it('unpkg', async () => {
    const resolver = new Resolver({ contentResolver: unpkgContentResolver });
    const onAddFile = jest.fn();
    const onDoneResolve = jest.fn();
    resolver.emitter.on('add', onAddFile);
    resolver.emitter.on('done', onDoneResolve);
    await resolver.addPackage({ name: 'events' });
    const files = resolver.getFiles();

    expect(onAddFile).toHaveBeenCalledTimes(Object.keys(files).length);
    expect(onDoneResolve).toHaveBeenCalledTimes(1);
    expect(onDoneResolve).toHaveBeenCalledWith({ name: 'events' });
    expect(files).toMatchSnapshot();

    Object.entries(files).forEach(([file, content]) => {
      fs.mkdirpSync(`./tmp/node_modules/${dirname(file)}`);
      fs.writeFileSync(`./tmp/node_modules/${file}`, content);
    });
  })

  it('jsdelivr', async () => {
    const resolver = new Resolver({ contentResolver: jsdelivrContentResolver });
    const onAddFile = jest.fn();
    const onDoneResolve = jest.fn();
    resolver.emitter.on('add', onAddFile);
    resolver.emitter.on('done', onDoneResolve);
    await resolver.addPackage({ name: 'events' });
    const files = resolver.getFiles();

    expect(onAddFile).toHaveBeenCalledTimes(Object.keys(files).length);
    expect(onDoneResolve).toHaveBeenCalledTimes(1);
    expect(onDoneResolve).toHaveBeenCalledWith({ name: 'events' });
    expect(files).toMatchSnapshot();
  })
})