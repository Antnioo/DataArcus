// Screenshots for the PR of 0.3.0 step 6 (theme from a logo): two logos dropped on the Theme Generator, English and
// Arabic, the Colors step at full size. node scripts/tests/capture-theme-logo.mjs <folder> (the PNGs live on the
// branch shots/theme-logo, not in the site)
import { serve, launch, visitor } from './lib.mjs';
const out = process.argv[2];
const server = await serve(), browser = await launch();
const logos = [
  ['navy-orange', 'brand.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" width="240" height="120"><rect x="10" y="20" width="130" height="80" rx="10" fill="#1b3a6b"/><circle cx="185" cy="60" r="40" fill="#f28c28"/></svg>', 'Corporate', 'en'],
  ['teal-gold', 'gulf.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><circle cx="100" cy="100" r="80" fill="#00897b"/><path d="M60 120 L100 50 L140 120 Z" fill="#ffd84a"/></svg>', 'Desert Gulf', 'ar'],
];
for (const [id, name, mime, svg, preset, lang] of logos) {
  const v = await visitor(browser, { viewport: [1440, 1600] });
  await v.pg.goto(`${server.url}/tools/power-bi-theme-generator.html?lang=${lang}`, { waitUntil: 'networkidle' });
  await v.pg.click(`#presets [data-p="${preset}"]`);
  await v.pg.setInputFiles('#logoFile', { name, mimeType: mime, buffer: Buffer.from(svg) });
  await v.pg.waitForFunction(() => !document.getElementById('logoOut').hidden);
  await v.pg.waitForTimeout(500);
  const box = await v.pg.evaluate(() => { const a = document.getElementById('colors').getBoundingClientRect(); return { x: a.x, y: a.y + scrollY, width: a.width, height: a.height }; });
  await v.pg.screenshot({ path: `${out}/theme-logo-${id}-${lang}.png`, clip: box, fullPage: true });
  await v.ctx.close();
}
await browser.close(); server.close();
