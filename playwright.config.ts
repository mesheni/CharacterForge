import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 80_000,
  workers: 2,
  use: {
    viewport:{width:1440,height:900},
    headless:true,
    acceptDownloads:true,
    launchOptions: process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {},
    baseURL:process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173',
  },
  webServer: process.env.PREVIEW_URL ? undefined : {
    command:'npm run dev -- --port 4173 --strictPort',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:true,
  },
})
