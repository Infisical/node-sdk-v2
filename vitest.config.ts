import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["sink/**/*.test.ts"],
		// The build's tsconfig leaves sink out, so this is the only check that the tests compile against the SDK's types.
		typecheck: {
			enabled: true,
			include: ["sink/**/*.test.ts"],
			tsconfig: "./tsconfig.test.json",
		},
	},
});
