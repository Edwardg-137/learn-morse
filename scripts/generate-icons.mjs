import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Rasterize our own vector icon for browsers that require PNG PWA icons.
const browser = await chromium.launch();
try {
  const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<style>body{margin:0}svg{width:100vw;height:100vh;display:block}</style>${svg}`);
    await page.screenshot({ path: `public/icon-${size}.png`, omitBackground: true });
    await page.close();
  }
} finally { await browser.close(); }
