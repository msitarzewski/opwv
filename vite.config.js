import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    open: true
    // Note: Safari requires HTTPS for WebXR
    // For production, deploy to HTTPS hosting
    // For local testing, consider using ngrok or similar tunneling service
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2015'
  }
})
