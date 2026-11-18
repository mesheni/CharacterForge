import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include:['tests/**/*.test.ts'] },
  build: { rollupOptions: { output: { manualChunks(id) {
    if(id.includes('/data/srd2014'))return 'srd-2014'
    if(id.includes('/data/srd2024'))return 'srd-2024'
    if(id.includes('/node_modules/@react-pdf/'))return 'react-pdf'
    return undefined
  } } } },
})
