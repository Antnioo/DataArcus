// Regenerates assets/img/favicon-48/96/192/512.png from assets/img/favicon.svg at their exact sizes (LG3, D-1122-06).
//   node scripts/make-favicons.mjs          (needs Chromium: playwright, or playwright-core with CHROME_PATH)
// The wider mark PNGs (apple-touch-icon, logo-square, dataarcus-og-logo) are not made here: they already carry the wordmark's geometry.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('playwright-core'); }
const IMG = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets/img');
const svg = fs.readFileSync(path.join(IMG, 'favicon.svg'), 'utf8').replace(/ width="32" height="32"/, ' width="100%" height="100%"');
const browser = await pw.chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
for (const n of [48, 96, 192, 512]) {
  const page = await browser.newPage({ viewport: { width: n, height: n }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${n}px;height:${n}px}</style>${svg}`);
  await page.screenshot({ path: path.join(IMG, `favicon-${n}.png`), omitBackground: true, clip: { x: 0, y: 0, width: n, height: n } });
  await page.close();
}
await browser.close();
console.log('wrote favicon-48/96/192/512.png');
