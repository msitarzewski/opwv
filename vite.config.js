import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3742,
    open: false,
    host: '127.0.0.1',
    allowedHosts: ['localhost', '127.0.0.1'],
    headers: securityHeaders()
  },
  preview: {
    host: '127.0.0.1',
    allowedHosts: ['localhost', '127.0.0.1'],
    headers: securityHeaders()
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'oxc',
    target: 'es2015',
    chunkSizeWarningLimit: 600
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: [
      'tests/unit/**/*.test.js',
      'tests/functional/**/*.test.js'
    ],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      // Browser-rendered entry/UI code is exercised by Playwright; this gate
      // measures deterministic unit and functional modules.
      exclude: ['src/main.js', 'src/ui/**'],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85
      }
    }
  }
})

function securityHeaders() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "worker-src 'self' blob:"
    ].join('; '),
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy': 'xr-spatial-tracking=(self), camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  }
}
