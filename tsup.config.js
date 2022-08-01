import { defineConfig } from 'tsup';
import { builtinModules } from 'node:module';

export default defineConfig({
  entryPoints: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
  },
  define: {
    $$builtinModules: JSON.stringify(builtinModules),
  },
  treeshake: true,
  clean: true,
});
