import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('/src/data/regionalOSM.json')) return 'regional-map';
    if (id.includes('/src/data/taoyuanTerrain.json')) return 'regional-terrain';
    if (id.includes('/node_modules/three/')) return 'engine';
  } } }, chunkSizeWarningLimit: 700 }
});
