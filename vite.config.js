import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * Toolchain note: package.json overrides rollup and esbuild with their
 * WebAssembly builds (@rollup/wasm-node, esbuild-wasm), so building needs no
 * native binaries — Windows Smart App Control blocks unsigned ones.
 *
 * In development the API is proxied, so the browser talks to one origin and
 * no CORS setup is needed. VITE_API_PROXY_TARGET points at the backend.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4000', changeOrigin: false },
      },
    },
    build: { sourcemap: false, chunkSizeWarningLimit: 600 },
  };
});
