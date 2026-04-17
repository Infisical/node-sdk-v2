import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: "cjs",
    outDir: "lib/cjs",
    target: "es2017",
    dts: true,
    sourcemap: true,
    treeshake: true,
    cjsInterop: true,
    splitting: false,
    clean: true,
  },
  {
    entry: ["src/index.ts"],
    format: "esm",
    outDir: "lib/esm",
    target: "es2022",
    dts: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    clean: true,
  },
]);
