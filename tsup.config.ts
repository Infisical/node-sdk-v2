import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    sourcemap: true,
    format: 'cjs',
    dts: true,
    treeshake: true,
    cjsInterop: true,
    outDir: 'lib/cjs',
    target: 'es2017'
  },
  {
    entry: ['src/index.ts'],
    sourcemap: true,
    external: ['ky'],
    format: 'esm',
    dts: true,
    treeshake: true,
    outDir: 'lib/esm',
    target: 'es2022'
  },
])
