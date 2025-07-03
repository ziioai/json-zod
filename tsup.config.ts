import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['lib/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
	sourcemap: true,
	outDir: 'dist',
	external: ['zod', 'lodash', 'json5', 'axios', 'openai'],
});
