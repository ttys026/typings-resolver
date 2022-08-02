declare module 'path-browserify' {
  export = (await import('path')).default;
}

declare const $$builtinModules: string[];
