import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,         // 👈 Use HTTPS default port
    // https: true,       // 👈 Enable SSL
    host: 'localhost', // 👈 Ensure binding to localhost
    // hmr: {
    //   host: 'localhost',
    //   protocol: 'wss', // 👈 use wss for https
    //   overlay: false
    // }
  },
  plugins: [
    react(), tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Memory optimization for large builds
    chunkSizeWarningLimit: 750,
    minify: 'esbuild',
    sourcemap: true,
    cssCodeSplit: true,
    target: 'es2015'
  },
  clearScreen: false
})
