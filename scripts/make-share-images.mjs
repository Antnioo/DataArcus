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
.shot .vp{max-height:440px;overflow:hidden}
.shot .url{margin-left:10px;font-size:13px;color:#94a3b8;font-weight:500;background:rgba(255,255,255,.05);border-radius:6px;padding:3px 10px}
.fan{position:relative;height:470px}
.fan .shot{position:absolute;width:560px}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.tile{display:flex;align-items:center;gap:14px;padding:16px 18px}
.tile svg{flex:none}
.tile b{font-size:18px;font-weight:700;display:block}
.tile small{font-size:14px;color:#94a3b8}
</style></head><body><div class="l">${logo}${left}<div class="f"><i></i>dataarcus.com</div></div><div class="r">${right}</div></body></html>`;

const textBlock = ({ kicker, title, sub, chips, size }) =>
  `<div class="k">${esc(kicker)}</div><h1${size ? ` style="font-size:${size}px"` : ''}>${esc(title)}</h1>` + (sub ? `<div class="s">${esc(sub)}</div>` : '') +
  (chips ? `<div class="chips">${chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : '');
const screenshot = (file, url, style) => `<div class="shot"${style ? ` style="${style}"` : ''}><div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>${url ? `<span class="url">${esc(url)}</span>` : ''}</div><div class="vp"><img src="${dataUrl(file)}"></div></div>`;

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

// ---------- tools: the tool itself, captured from the live page (assets/img/og/src) ----------
const TOOLS = [
  ['theme-generator', 'power-bi-theme-generator', 'Power BI Theme Generator', ['Brand colors', 'Live preview', 'Contrast check'], 'tool-theme.jpg'],
  ['calendar-generator', 'dax-calendar-table-generator', 'DAX Calendar Table Generator', ['Hijri dates', 'Ramadan & Eid', 'GCC weekends'], 'tool-calendar.jpg'],
  ['measure-builder', 'dax-measure-builder', 'DAX Measure Builder', ['YTD, MTD, YoY', 'Rolling months', 'Ramadan vs last year'], 'tool-measures.jpg'],
  ['licensing-calculator', 'power-bi-licensing-cost-calculator', 'Power BI Licensing Cost Calculator', ['Pro vs PPU vs Fabric', 'F64 break-even', 'USD, AED, SAR'], 'tool-licensing.jpg'],
  ['model-health-check', 'power-bi-model-health-check', 'Power BI Model Health Check', ['Unused columns', 'Slow DAX', 'Nothing uploaded'], 'tool-health.jpg'],
  ['dp-600', 'dp-600-practice-exam', 'DP-600 Practice Exam', ['220 questions', 'Timed mocks', 'Score out of 1000'], 'tool-dp600.jpg']
];
// small line icons for the tools hub
const icon = (d) => `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="background:rgba(0,212,255,.1);border-radius:12px;padding:8px">${d}</svg>`;
const HUB = [
  ['DP-600 exam', '220 practice questions', icon('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>')],
  ['Model health check', 'Score your model', icon('<path d="M3 12h4l3-8 4 16 3-8h4"/>')],
  ['Licensing calculator', 'Pro, PPU or Fabric', icon('<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>')],
  ['Theme generator', 'Brand colors to JSON', icon('<circle cx="8" cy="9" r="1.5"/><circle cx="12" cy="7" r="1.5"/><circle cx="16" cy="9" r="1.5"/><path d="M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1 3.7c.3.2.5.6.5 1 0 .7-.6 1.3-1.5 1.3z"/>')],
  ['DAX calendar', 'Hijri, Ramadan, Eid', icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>')],
  ['Measure builder', 'YTD, YoY, rolling DAX', icon('<path d="M17 5H7l6 7-6 7h10"/>')]
];

// ---------- articles with their own visual ----------
const kpiRows = [['CAC', 'Blended acquisition cost', 0.55, '#00d4ff'], ['MER', 'Marketing efficiency ratio', 0.78, '#40f3ff'], ['CLV', 'Customer lifetime value', 0.92, '#6c5ce7'], ['Repurchase rate', 'Customers who come back', 0.64, '#a29bfe'], ['Contribution margin', 'Profit per order', 0.71, '#00cec9']]
  .map(([n, d, w, c], i) => `<div class="card" style="display:flex;align-items:center;gap:16px;padding:14px 18px"><div style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:19px;color:#051018;background:${c}">${i + 1}</div><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:20px">${n}</div><div style="font-size:14px;color:#94a3b8;margin-top:2px">${d}</div><div style="height:6px;border-radius:4px;background:rgba(255,255,255,.08);margin-top:9px"><div style="height:6px;border-radius:4px;width:${w * 100}%;background:${c}"></div></div></div></div>`).join('');
const bars = (hs, c) => `<svg viewBox="0 0 120 54" width="100%" height="54">${hs.map((h, i) => `<rect x="${i * 17 + 2}" y="${54 - h}" width="11" height="${h}" rx="2" fill="${c}" opacity="${0.55 + i * 0.07}"/>`).join('')}</svg>`;
const line = (c) => `<svg viewBox="0 0 120 54" width="100%" height="54"><polyline points="2,44 20,38 38,41 56,28 74,30 92,16 118,8" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="118" cy="8" r="4" fill="#fff"/></svg>`;
const donut = `<svg viewBox="0 0 120 54" width="100%" height="54"><g transform="translate(60 27)"><circle r="21" fill="none" stroke="#6c5ce7" stroke-width="10" stroke-dasharray="66 132" transform="rotate(-90)"/><circle r="21" fill="none" stroke="#a29bfe" stroke-width="10" stroke-dasharray="40 132" stroke-dashoffset="-66" transform="rotate(-90)"/><circle r="21" fill="none" stroke="#00cec9" stroke-width="10" stroke-dasharray="26 132" stroke-dashoffset="-106" transform="rotate(-90)"/></g></svg>`;
const shopMods = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${[['Sales hub', bars([20, 28, 24, 36, 32, 44, 50], '#00d4ff')], ['Marketing ROI', line('#40f3ff')], ['Customers', donut], ['Inventory', bars([48, 40, 34, 26, 20, 14, 10], '#fd79a8')]]
  .map(([n, v], i) => `<div class="card" style="padding:16px 18px"><div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Module ${i + 1}</div><div style="font-weight:700;font-size:19px;margin:4px 0 12px">${n}</div>${v}</div>`).join('')}</div>`;

// ---------- portfolio, blog and articles: a visual of what the page is about ----------
const pill = (t, c) => `<span style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${c || '#00d4ff'}">${esc(t)}</span>`;
const mosaic = ['pulse', 'fintech', 'repeatiq', 'cfpb', 'call-center', 'adventureworks'].map((k) => `<div class="shot" style="border-radius:10px"><div class="vp" style="max-height:150px"><img src="${dataUrl('assets/img/portfolio/' + k + '-preview.jpg')}"></div></div>`);
const PORTFOLIO = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${mosaic.join('')}</div>`;
const BLOG = [['Case study', 'We Ran a Health Check on Our Own Power BI Model. It Scored 67.'], ['Ramadan · DAX', 'Compare This Ramadan With Last Ramadan'], ['Licensing', 'Pro, PPU or Fabric: Which License Do You Need?'], ['DAX pattern', 'Resolve Once, Hydrate Many']]
  .map(([t, n]) => `<div class="card" style="padding:16px 20px">${pill(t)}<div style="font-size:20px;font-weight:700;margin-top:4px;line-height:1.3">${esc(n)}</div></div>`).join('');
const CLV = `<div class="card" style="padding:22px 24px">${pill('Value of one customer over time')}<svg viewBox="0 0 560 300" width="100%" style="margin-top:10px">
  ${[0, 1, 2, 3].map((i) => `<line x1="40" x2="550" y1="${40 + i * 70}" y2="${40 + i * 70}" stroke="rgba(255,255,255,.07)"/>`).join('')}
  ${[34, 20, 26, 22, 30, 24, 28, 26, 32, 28].map((h, i) => `<rect x="${58 + i * 49}" y="${250 - h * 2}" width="26" height="${h * 2}" rx="4" fill="${i ? '#6c5ce7' : '#00d4ff'}" opacity="${i ? 0.75 : 1}"/>`).join('')}
  <polyline points="71,182 120,142 169,90 218,58 267,38 316,28 365,22 414,18 463,14 512,10" fill="none" stroke="#40f3ff" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" transform="translate(0,20)"/>
  <circle cx="512" cy="30" r="7" fill="#fff"/>
  <text x="58" y="285" fill="#00d4ff" font-size="17" font-weight="700" font-family="Inter">First order</text><text x="320" y="285" fill="#a29bfe" font-size="17" font-weight="700" font-family="Inter">Repeat orders</text>
  <text x="548" y="70" text-anchor="end" fill="#f8fafc" font-size="19" font-weight="800" font-family="Inter">Lifetime value</text></svg></div>`;
const col = (name, c, rows) => `<div class="card" style="padding:20px 22px;border-color:${c}55"><div style="font-size:24px;font-weight:800;color:${c}">${name}</div>${rows.map(([k, v]) => `<div style="margin-top:14px"><div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">${k}</div><div style="font-size:18px;font-weight:600;margin-top:2px">${v}</div></div>`).join('')}</div>`;
const ETL = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${col('ETL / ELT', '#00d4ff', [['Scale', 'Big volumes'], ['Latency', 'Near real-time'], ['Reuse', 'Shared tables'], ['Owner', 'Data engineering']])}${col('Power Query', '#a29bfe', [['Scale', 'Smaller, scoped data'], ['Latency', 'Scheduled refresh'], ['Reuse', 'Report-specific'], ['Owner', 'Analysts']])}</div><div class="card" style="padding:14px 20px;text-align:center;font-size:18px;font-weight:700">Best teams blend both: heavy lifting in ETL, last mile in Power Query</div>`;
const metric = (k, v, f, note, c) => `<div class="card" style="padding:20px 24px;display:flex;align-items:center;gap:22px"><div style="font-size:64px;font-weight:800;color:${c};line-height:1">${v}</div><div><div style="font-size:24px;font-weight:800">${k}</div><div style="font-size:16px;color:#94a3b8;margin-top:2px">${f}</div><div style="font-size:18px;font-weight:600;margin-top:8px">${note}</div></div></div>`;
const EVM = metric('CPI', '0.8', 'Earned value ÷ actual cost', 'Losing 20 cents on every dollar', '#f59e0b') + metric('SPI', '0.9', 'Earned value ÷ planned value', 'Working at 90% of planned speed', '#f59e0b') +
  `<div class="card" style="padding:14px 20px;font-size:18px;font-weight:700;text-align:center">Below 1.0 means over budget or late, before the status turns red</div>`;
const node = (t, c, w) => `<div style="padding:12px 14px;border-radius:12px;background:${c ? c : 'rgba(255,255,255,.05)'};border:1px solid ${c ? c : 'rgba(255,255,255,.12)'};font-weight:700;font-size:16px;color:${c ? '#051018' : '#f8fafc'};text-align:center;width:${w || 150}px">${t}</div>`;
const arrow = `<svg width="46" height="24" viewBox="0 0 46 24"><path d="M2 12h38M32 4l8 8-8 8" fill="none" stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const JOURNEY = `<div class="card" style="padding:26px 22px;display:flex;align-items:center;justify-content:space-between">
  <div style="display:flex;flex-direction:column;gap:10px">${node('Lead form')}${node('Calls')}${node('Statuses')}${node('Invoice')}</div>${arrow}
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">${pill('Resolve once')}${node('Matched<br>Journey Key', '#00d4ff', 140)}</div>${arrow}
  <div style="display:flex;flex-direction:column;align-items:center;gap:10px">${pill('Hydrate many', '#a29bfe')}${node('Status', 0, 120)}${node('Outcome', 0, 120)}${node('Agent', 0, 120)}</div></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${[['54,574', 'leads'], ['113,321', 'calls'], ['72,013', 'journeys']].map(([n, l]) => `<div class="card" style="padding:12px;text-align:center"><div style="font-size:26px;font-weight:800">${n}</div><div style="font-size:14px;color:#94a3b8">${l}</div></div>`).join('')}</div>`;
const price = (n, v, d, best) => `<div class="card" style="padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px${best ? ';border-color:#00d4ff;background:rgba(0,212,255,.08)' : ''}"><div><div style="font-size:22px;font-weight:800">${n}</div><div style="font-size:16px;color:#94a3b8;margin-top:3px">${d}</div></div><div style="font-size:30px;font-weight:800;color:${best ? '#00d4ff' : '#f8fafc'};white-space:nowrap">${v}</div></div>`;
const LICENSING = price('Pro', '$14', 'per user a month', 0) + price('Premium Per User', '$24', 'per user a month', 0) + price('Fabric F64', '~$5,004', 'a month reserved · viewers free', 1) +
  `<div class="card" style="padding:14px 20px;font-size:18px;font-weight:700;text-align:center">The number that decides it: how many people only view</div>`;
const ring = (score, c) => { const C = 2 * Math.PI * 70; return `<svg width="180" height="180" viewBox="0 0 180 180"><circle cx="90" cy="90" r="70" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="16"/><circle cx="90" cy="90" r="70" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C * score / 100} ${C}" transform="rotate(-90 90 90)"/><text x="90" y="100" text-anchor="middle" font-family="Inter" font-size="54" font-weight="800" fill="#f8fafc">${score}</text><text x="90" y="126" text-anchor="middle" font-family="Inter" font-size="13" font-weight="700" fill="#94a3b8" letter-spacing="2">OUT OF 100</text></svg>`; };
const HEALTH = `<div class="card" style="padding:22px;display:flex;align-items:center;gap:22px">${ring(67, '#f59e0b')}<div style="display:flex;flex-direction:column;gap:12px;flex:1">${[['41%', 'of columns never used (100 of 245)'], ['127', 'measures feed no visual'], ['23', 'visuals point at deleted fields'], ['15', 'measures FILTER a whole table']]
  .map(([n, t]) => `<div style="display:flex;align-items:baseline;gap:12px"><b style="font-size:26px;font-weight:800;color:#f59e0b;min-width:62px">${n}</b><span style="font-size:17px;font-weight:600">${t}</span></div>`).join('')}</div></div>
  <div class="card" style="padding:14px 20px;font-size:17px;font-weight:600;text-align:center;color:#cbd5e1">A real CRM model: 24 tables, 410 measures, 292 visuals</div>`;
const ramPts = (base, amp, ph) => Array.from({ length: 30 }, (_, i) => `${50 + i * 16.5},${Math.round(210 - (base + amp * Math.sin(i / 4.2 + ph) + i * 1.6))}`).join(' ');
const RAMADAN = `<div class="card" style="padding:22px 24px"><div style="display:flex;justify-content:space-between;align-items:center">${pill('Sales by Ramadan day')}<svg width="30" height="30" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="#fdcb6e"/></svg></div>
  <svg viewBox="0 0 560 250" width="100%" style="margin-top:8px">${[0, 1, 2, 3].map((i) => `<line x1="40" x2="550" y1="${30 + i * 60}" y2="${30 + i * 60}" stroke="rgba(255,255,255,.07)"/>`).join('')}
  <polyline points="${ramPts(70, 22, 0.6)}" fill="none" stroke="#6c5ce7" stroke-width="3" stroke-dasharray="7 6" stroke-linejoin="round"/>
  <polyline points="${ramPts(92, 26, 0.4)}" fill="none" stroke="#00d4ff" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
  ${[1, 10, 20, 30].map((d) => `<text x="${50 + (d - 1) * 16.5}" y="244" text-anchor="${d === 30 ? 'end' : d === 1 ? 'start' : 'middle'}" fill="#94a3b8" font-size="14" font-family="Inter">Day ${d}</text>`).join('')}</svg>
  <div style="display:flex;gap:22px;margin-top:6px;font-size:16px;font-weight:600"><span style="color:#00d4ff">━ This Ramadan</span><span style="color:#a29bfe">┅ Last Ramadan</span></div></div>`;

const PAGES = [
  ['portfolio', 'Power BI showcases', 'Dashboards Built for Real Business Problems', { chips: ['8 dashboards', 'Automotive to healthcare', 'Real models'] }, PORTFOLIO, '470px 1fr'],
  ['blog', 'Blog · Power BI & e-commerce', 'Power BI and E‑commerce Analytics Blog', { sub: 'Practical guides with real models, real DAX and real numbers.' }, BLOG, '500px 1fr'],
  ['clv', 'E-commerce · Power BI', 'Customer Lifetime Value: The Metric That Defines Growth', { sub: 'Why CLV, not revenue, is the north-star KPI, and how to track it in Power BI.', size: 46 }, CLV, '520px 1fr'],
  ['etl-vs-power-query', 'E-commerce data strategy', 'ETL vs Power Query: Where Should Your Data Work Happen?', { size: 46, sub: 'Scale and governance, or speed and analyst autonomy.' }, ETL, '480px 1fr'],
  ['evm', 'Project governance · Power BI', 'Beyond Traffic Lights: How EVM Predicts Project Risk', { size: 46, sub: 'Two numbers that forecast delays and overruns.' }, EVM, '480px 1fr'],
  ['journey-attribution', 'DAX pattern · Lead attribution', 'Resolve Once, Hydrate Many', { sub: 'Match each lead to its journey once, then reuse it everywhere so every report agrees.' }, JOURNEY, '470px 1fr'],
  ['licensing-guide', 'Power BI licensing · 2026', 'Pro, PPU or Fabric: Which License Do You Need?', { size: 46, sub: 'Real prices and the F64 break-even point.' }, LICENSING, '480px 1fr'],
  ['health-check-article', 'Case study · Power BI', 'We Ran a Health Check on Our Own Model. It Scored 67.', { size: 44, sub: 'What a real 410-measure model was hiding.' }, HEALTH, '470px 1fr'],
  ['ramadan-sales', 'Ramadan · DAX · Hijri calendar', 'Compare This Ramadan With Last Ramadan', { sub: 'SAMEPERIODLASTYEAR gets it wrong. A Hijri calendar and one DAX measure fix it.' }, RAMADAN, '470px 1fr']
];

const JOBS = [
  ...DASH.map(([id, kicker, title, chips, shot]) => ({ id, html: page(textBlock({ kicker, title, chips }), screenshot('assets/img/portfolio/' + shot), '430px 1fr') })),
  ...TOOLS.map(([id, slug, title, chips, shot]) => ({ id, html: page(textBlock({ kicker: 'Free tool · No sign-up', title, chips, size: title.length > 26 ? 46 : 52 }), screenshot('assets/img/og/src/' + shot, 'dataarcus.com/tools/' + slug + '.html'), '430px 1fr') })),
  { id: 'home', html: page(textBlock({ kicker: 'Power BI consulting · Dubai', title: 'From Scattered Business Data to Decisions You Can Trust', size: 42, chips: ['8 showcase dashboards', '6 free tools', 'English & Arabic'] }),
    `<div class="fan">${screenshot('assets/img/portfolio/fintech-preview.jpg', '', 'left:0;top:10px;transform:rotate(-5deg);opacity:.75')}${screenshot('assets/img/portfolio/repeatiq-preview.jpg', '', 'left:110px;top:0;transform:rotate(4deg);opacity:.85')}${screenshot('assets/img/portfolio/pulse-preview.jpg', '', 'left:40px;top:120px')}</div>`, '500px 1fr') },
  ...PAGES.map(([id, kicker, title, o, right, cols]) => ({ id, html: page(textBlock(Object.assign({ kicker, title }, o)), right, cols) })),
  { id: 'tools', html: page(textBlock({ kicker: 'Free · No sign-up · English & Arabic', title: 'Free Power BI Tools', sub: 'Six tools that save hours on real Power BI work. Nothing to install.' }),
    `<div class="tiles">${HUB.map(([n, d, ic]) => `<div class="card tile">${ic}<div><b>${esc(n)}</b><small>${esc(d)}</small></div></div>`).join('')}</div>`, '480px 1fr') },
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
  const fits = await tab.evaluate(() => [...document.querySelectorAll('h1,.card,.f,.chips,.shot:not(.fan .shot)')].every((e) => { const r = e.getBoundingClientRect(); return r.bottom <= 631 && r.right <= 1201; }));
  const file = path.join(OUT, job.id + '.jpg');
  let q = 88;
  do { await tab.screenshot({ path: file, type: 'jpeg', quality: q }); q -= 6; } while (fs.statSync(file).size > MAX_BYTES && q > 50);
  const kb = Math.round(fs.statSync(file).size / 1024);
  if (!fits || kb * 1024 > MAX_BYTES) failed++;
  console.log(`${job.id.padEnd(18)} ${kb} KB${fits ? '' : '  (text does not fit)'}`);
}
await browser.close();
process.exit(failed ? 1 : 0);
