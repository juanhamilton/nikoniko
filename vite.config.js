import { defineConfig } from 'vite'

export default defineConfig({
  base: '/nikoniko/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
