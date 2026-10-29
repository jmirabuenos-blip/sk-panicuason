const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1,
  webServer: process.env.SITE_URL ? undefined : { command: 'python -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
  use: { baseURL: process.env.SITE_URL || 'http://127.0.0.1:4173', channel: 'chrome', viewport: { width: 390, height: 844 } },
});
