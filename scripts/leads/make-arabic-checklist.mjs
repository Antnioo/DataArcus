// Writes the Arabic-ready checklist (LEAD1) from scripts/leads/arabic-checklist.mjs, English and Arabic:
//   assets/downloads/arabic-report-checklist-<lang>.pdf  the download (Chromium's page.pdf of the printable page, A4,
//                                                        one page)
//   assets/img/leads/arabic-report-checklist-<lang>.jpg  its picture on the sign-up page
//   assets/img/og/arabic-report-checklist.jpg            the link preview (1200x630, under 280 KB as the others)
//   scripts/leads/arabic-checklist.built.json            the SHA-256 of each printable page the PDFs were made from
// The printable page itself is not committed (every committed .html is a site page to the suites): --html <folder>
// writes it there, to open or print in a browser.
// Fonts come from Google Fonts (Inter, IBM Plex Sans Arabic, as the site), so it needs the network. Run it again after
// any change to the checklist; scripts/test-leads.mjs fails while the PDFs were made from another version of it.
//   node scripts/leads/make-arabic-checklist.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { html, TEXT } from './arabic-checklist.mjs';
import { launch } from '../tests/lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const put = (f, data) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), data); console.log(`wrote ${f} (${Math.round(Buffer.byteLength(data) / 1024)} KB)`); };
const hi = process.argv.indexOf('--html'), out = hi > 0 ? path.resolve(process.argv[hi + 1] || '.') : null;
const built = {};
const browser = await launch();
try {
  for (const lang of ['en', 'ar']) {
    const page = html(lang);
    built[lang] = crypto.createHash('sha256').update(page).digest('hex');
    if (out) { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, `arabic-report-checklist-${lang}.html`), page); }
    const pg = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await pg.setContent(page, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    put(`assets/downloads/arabic-report-checklist-${lang}.pdf`, await pg.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true }));
    await pg.emulateMedia({ media: 'print' });
    put(`assets/img/leads/arabic-report-checklist-${lang}.jpg`, await pg.screenshot({ fullPage: true, type: 'jpeg', quality: 78 }));
    await pg.close();
  }
  put('scripts/leads/arabic-checklist.built.json', JSON.stringify(built, null, 2) + '\n');
  // the link preview: the title, and the English checklist's top half
  const shot = fs.readFileSync(path.join(ROOT, 'assets/img/leads/arabic-report-checklist-en.jpg')).toString('base64');
  const logo = fs.readFileSync(path.join(ROOT, 'assets/img/logo.svg'), 'utf8').replace(/width="[\d.]+" height="40"/, 'width="208" height="48"');
  const og = `<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap"><style>
    body{margin:0;width:1200px;height:630px;overflow:hidden;background:#0a0f1c;font-family:Inter,sans-serif;color:#fff;display:flex}
    .l{width:600px;padding:64px 0 0 64px;box-sizing:border-box}
    h1{font-size:50px;line-height:1.1;font-weight:800;margin:40px 0 24px}
    p{font-size:24px;line-height:1.4;color:#94a3b8;margin:0}
    .r{flex:1;position:relative}
    .r img{position:absolute;top:56px;left:40px;width:520px;border-radius:10px;box-shadow:0 20px 60px rgba(0,212,255,.25);transform:rotate(-2.5deg)}
  </style></head><body><div class="l">${logo}<h1>${TEXT.en.title.replace(/\? /, '?<br>')}</h1><p>English and Arabic, one printable page each.</p></div><div class="r"><img src="data:image/jpeg;base64,${shot}"></div></body></html>`;
  const pg = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await pg.setContent(og, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  const jpg = await pg.screenshot({ type: 'jpeg', quality: 82 });
  if (jpg.length > 280 * 1024) throw new Error(`the link preview is ${Math.round(jpg.length / 1024)} KB (WhatsApp shows previews up to about 300 KB)`);
  put('assets/img/og/arabic-report-checklist.jpg', jpg);
} finally { await browser.close(); }
