import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import compression from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: "./src/main.tsx"
    },
    // cssCodeSplit: false
  },
  // cssInjectedByJsPlugin(),
  plugins: [react(), compression({
    algorithm: 'gzip', exclude: [/\.(br)$ /, /\.(gz)$/]
  })],
})
