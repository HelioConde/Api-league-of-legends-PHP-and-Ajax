import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = path.basename(fileURLToPath(new URL('.', import.meta.url)));
export default defineConfig({ base: '/' + repo + '/', build: { outDir: 'dist', emptyOutDir: true } });
