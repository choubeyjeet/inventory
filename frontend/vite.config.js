import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // important when deploying on static hosts
  build: {
    outDir: 'dist'
  }
})
