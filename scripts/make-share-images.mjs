// Link-preview images (WhatsApp, LinkedIn, X): 1200x630 JPGs in assets/img/og/.
// WhatsApp only shows a preview when the image is small (about 300 KB), so everything is JPG and checked for size.
//
// Run from the repo root:
//   npm i --no-save playwright-core @fontsource/inter
//   node scripts/make-share-images.mjs            (all images)
//   node scripts/make-share-images.mjs pulse kpi  (only some)
// Uses Chrome/Chromium: set CHROME_PATH if it is not found automatically.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'assets/img/og');
const MAX_BYTES = 280 * 1024;
const font = (w) => 'data:font/woff2;base64,' + fs.readFileSync(require.resolve('@fontsource/inter/files/inter-latin-' + w + '-normal.woff2')).toString('base64');
const dataUrl = (file) => {
  const buf = fs.readFileSync(path.join(ROOT, file));
  const type = buf[0] === 0x89 ? 'image/png' : 'image/jpeg'; // some .jpg files are really PNGs
  return 'data:' + type + ';base64,' + buf.toString('base64');
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const logo = fs.readFileSync(path.join(ROOT, 'assets/img/logo.svg'), 'utf8').replace(/width="190" height="40"/, 'width="228" height="48"');

const page = (left, right, cols) => `<!doctype html><html><head><style>
@font-face{font-family:Inter;font-weight:400;src:url(${font(400)})}
@font-face{font-family:Inter;font-weight:600;src:url(${font(600)})}
@font-face{font-family:Inter;font-weight:700;src:url(${font(700)})}
@font-face{font-family:Inter;font-weight:800;src:url(${font(800)})}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Inter,sans-serif;color:#f8fafc;
 background:radial-gradient(circle at 12% 18%,rgba(0,212,255,.16),transparent 42%),radial-gradient(circle at 88% 85%,rgba(108,92,231,.22),transparent 45%),#0a0f1c;
 display:grid;grid-template-columns:${cols};gap:40px;padding:56px 60px}
.l{display:flex;flex-direction:column;min-width:0}
.k{margin-top:46px;font-size:17px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#00d4ff}
h1{margin-top:16px;font-size:52px;line-height:1.08;font-weight:800;letter-spacing:-.02em}
.s{margin-top:22px;font-size:21px;line-height:1.45;color:#94a3b8;font-weight:500}
.chips{margin-top:26px;display:flex;flex-wrap:wrap;gap:10px}
.chips span{font-size:17px;font-weight:600;color:#e2e8f0;background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.35);border-radius:30px;padding:7px 15px}
.f{margin-top:auto;display:flex;align-items:center;gap:10px;font-size:19px;font-weight:600;color:#cbd5e1}
.f i{width:10px;height:10px;border-radius:50%;background:#00d4ff;display:block}
.r{display:flex;flex-direction:column;justify-content:center;gap:14px;min-width:0}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:18px}
.shot{border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 70px rgba(0,0,0,.55),0 0 0 6px rgba(255,255,255,.03);background:#111827}
.shot .bar{height:30px;display:flex;align-items:center;gap:7px;padding:0 14px;background:#1a1f2e;border-bottom:1px solid rgba(255,255,255,.08)}
.shot .bar i{width:10px;height:10px;border-radius:50%;display:block}
.shot img{display:block;width:100%;height:auto}
</style></head><body><div class="l">${logo}${left}<div class="f"><i></i>dataarcus.com</div></div><div class="r">${right}</div></body></html>`;

const textBlock = ({ kicker, title, sub, chips }) =>
  `<div class="k">${esc(kicker)}</div><h1>${esc(title)}</h1>` + (sub ? `<div class="s">${esc(sub)}</div>` : '') +
  (chips ? `<div class="chips">${chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : '');
const screenshot = (file) => `<div class="shot"><div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div><img src="${dataUrl(file)}"></div>`;

// ---------- dashboards: title, 3 facts from the page, the real screenshot ----------
const DASH = [
  ['adventureworks', 'Retail · Power BI dashboard', 'AdventureWorks Sales & Operations', ['6 pages', 'Sales, customers, products', 'What-if analysis'], 'adventureworks-preview.jpg'],
  ['call-center', 'E-commerce · Power BI dashboard', 'E-commerce Customer Service', ['Agent performance', 'Resolution rates', 'Satisfaction'], 'call-center-preview.jpg'],
  ['cfpb', 'Finance · Power BI dashboard', 'U.S. Consumer Financial Complaints', ['4 pages', '7 years of data', 'Company accountability'], 'cfpb-preview.jpg'],
  ['pulse', 'Automotive CRM · Anonymized', 'DataArcus Pulse: Automotive CRM', ['54K leads', '113K calls', '410 DAX measures'], 'pulse-preview.jpg'],
  ['er-health', 'Healthcare · Power BI dashboard', 'ER Health: Patient Flow Analytics', ['Patient flow', 'Wait times', 'Satisfaction'], 'er-health-preview.jpg'],
  ['fintech', 'Fintech · Power BI dashboard', 'Fintech Portfolio Risk Engine', ['72 projects', 'EVM risk signals', 'ZoomCharts'], 'fintech-preview.jpg'],
  ['maven-market', 'Retail · Power BI dashboard', 'Maven Market Retail Sales', ['Sales trends', 'Product performance', 'Customer behavior'], 'maven-market-preview.jpg'],
  ['repeatiq', 'Subscriptions · Power BI dashboard', 'RepeatIQ Subscription Analytics', ['5 pages', 'Retention cohorts', 'Churn risk'], 'repeatiq-preview.jpg']
];

// ---------- articles with their own visual ----------
const kpiRows = [['CAC', 'Blended acquisition cost', 0.55, '#00d4ff'], ['MER', 'Marketing efficiency ratio', 0.78, '#40f3ff'], ['CLV', 'Customer lifetime value', 0.92, '#6c5ce7'], ['Repurchase rate', 'Customers who come back', 0.64, '#a29bfe'], ['Contribution margin', 'Profit per order', 0.71, '#00cec9']]
  .map(([n, d, w, c], i) => `<div class="card" style="display:flex;align-items:center;gap:16px;padding:14px 18px"><div style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:19px;color:#051018;background:${c}">${i + 1}</div><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:20px">${n}</div><div style="font-size:14px;color:#94a3b8;margin-top:2px">${d}</div><div style="height:6px;border-radius:4px;background:rgba(255,255,255,.08);margin-top:9px"><div style="height:6px;border-radius:4px;width:${w * 100}%;background:${c}"></div></div></div></div>`).join('');
const bars = (hs, c) => `<svg viewBox="0 0 120 54" width="100%" height="54">${hs.map((h, i) => `<rect x="${i * 17 + 2}" y="${54 - h}" width="11" height="${h}" rx="2" fill="${c}" opacity="${0.55 + i * 0.07}"/>`).join('')}</svg>`;
const line = (c) => `<svg viewBox="0 0 120 54" width="100%" height="54"><polyline points="2,44 20,38 38,41 56,28 74,30 92,16 118,8" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="118" cy="8" r="4" fill="#fff"/></svg>`;
const donut = `<svg viewBox="0 0 120 54" width="100%" height="54"><g transform="translate(60 27)"><circle r="21" fill="none" stroke="#6c5ce7" stroke-width="10" stroke-dasharray="66 132" transform="rotate(-90)"/><circle r="21" fill="none" stroke="#a29bfe" stroke-width="10" stroke-dasharray="40 132" stroke-dashoffset="-66" transform="rotate(-90)"/><circle r="21" fill="none" stroke="#00cec9" stroke-width="10" stroke-dasharray="26 132" stroke-dashoffset="-106" transform="rotate(-90)"/></g></svg>`;
const shopMods = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${[['Sales hub', bars([20, 28, 24, 36, 32, 44, 50], '#00d4ff')], ['Marketing ROI', line('#40f3ff')], ['Customers', donut], ['Inventory', bars([48, 40, 34, 26, 20, 14, 10], '#fd79a8')]]
  .map(([n, v], i) => `<div class="card" style="padding:16px 18px"><div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Module ${i + 1}</div><div style="font-weight:700;font-size:19px;margin:4px 0 12px">${n}</div>${v}</div>`).join('')}</div>`;

const JOBS = [
  ...DASH.map(([id, kicker, title, chips, shot]) => ({ id, html: page(textBlock({ kicker, title, chips }), screenshot('assets/img/portfolio/' + shot), '430px 1fr') })),
  { id: 'kpi-playbook', html: page(textBlock({ kicker: 'E-commerce playbook · Power BI', title: 'The 5 Marketing KPIs Every E-commerce Leader Should Track', sub: 'Five numbers that decide profit, tracked in Power BI.' }), kpiRows, '600px 1fr') },
  { id: 'shopify-dashboard', html: page(textBlock({ kicker: 'Shopify · Power BI', title: 'Your Shopify Dashboard in Power BI', sub: 'Sales, marketing ROI, customers and inventory in one source of truth.' }), shopMods, '600px 1fr') }
];

const only = process.argv.slice(2);
const exe = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
let failed = 0;
for (const job of JOBS.filter((j) => !only.length || only.includes(j.id))) {
  await tab.setContent(job.html, { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  const fits = await tab.evaluate(() => [...document.querySelectorAll('h1,.card,.f,.shot,.chips')].every((e) => { const r = e.getBoundingClientRect(); return r.bottom <= 631 && r.right <= 1201; }));
  const file = path.join(OUT, job.id + '.jpg');
  let q = 88;
  do { await tab.screenshot({ path: file, type: 'jpeg', quality: q }); q -= 6; } while (fs.statSync(file).size > MAX_BYTES && q > 50);
  const kb = Math.round(fs.statSync(file).size / 1024);
  if (!fits || kb * 1024 > MAX_BYTES) failed++;
  console.log(`${job.id.padEnd(18)} ${kb} KB${fits ? '' : '  (text does not fit)'}`);
}
await browser.close();
process.exit(failed ? 1 : 0);
