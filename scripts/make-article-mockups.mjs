// Article mockups (made-up data): the redesign article's before/after and four of the report-styles mockups.
// HTML rendered by Chromium at 1600 x 900, saved as .jpg and .webp next to the old files. Every text element is checked:
// nothing may overflow its box or the page (the script stops with the element if it does).
//
// Run from the repo root:
//   npm i --no-save playwright-core @fontsource/inter @fontsource/ibm-plex-sans-arabic @fontsource/roboto-condensed
//   node scripts/make-article-mockups.mjs                       (all)
//   node scripts/make-article-mockups.mjs redesign executive    (only some: redesign, executive, sales, marketing, service)
// Uses Chrome/Chromium: set CHROME_PATH if it is not found automatically.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const font = (pkg, file) => 'data:font/woff2;base64,' + fs.readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`)).toString('base64');
const FONTS = [400, 500, 600, 700, 800].map((w) => `@font-face{font-family:Inter;font-weight:${w};src:url(${font('inter', `inter-latin-${w}-normal.woff2`)})}`).join('')
  + [400, 500, 600, 700].map((w) => `@font-face{font-family:'Plex Arabic';font-weight:${w};src:url(${font('ibm-plex-sans-arabic', `ibm-plex-sans-arabic-arabic-${w}-normal.woff2`)});unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF,U+200C-200F}`).join('')
  + [400, 500, 700].map((w) => `@font-face{font-family:'Roboto Condensed';font-weight:${w};src:url(${font('roboto-condensed', `roboto-condensed-latin-${w}-normal.woff2`)})}`).join('');
const BASE = `${FONTS}*{box-sizing:border-box;margin:0;padding:0}html,body{width:1600px;height:900px;overflow:hidden}
body{font-family:Inter,'Plex Arabic',sans-serif;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
[dir=rtl] body,body[dir=rtl]{font-family:'Plex Arabic',Inter,sans-serif}
.num{font-family:Inter,sans-serif;direction:ltr;unicode-bidi:isolate}`;
const doc = (css, body, dir = 'ltr') => `<!doctype html><html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="utf-8"><style>${BASE}${css}</style></head><body dir="${dir}">${body}</body></html>`;

// ---------------------------------------------------------------------------------------------------------------
// 1. The redesign article: a leads report for Contoso, a made-up electronics retailer (Microsoft's own sample name).
//    Same numbers, visuals and lesson as before; only the business changed (owner 2026-10-03: nothing automotive).
// ---------------------------------------------------------------------------------------------------------------
const CAMPAIGNS = [   // name, leads, qualified, declined, never contacted
  ['Back to School · Laptops', 648, 91, 162, 142], ['Smart Home Week', 402, 31, 151, 104], ['4K TV Upgrade', 356, 47, 66, 88],
  ['Gaming Week', 271, 9, 133, 72], ['Phone Trade In', 188, 30, 41, 35], ['Wearables', 96, 10, 29, 16],
  ['Home Office Bundle', 74, 6, 22, 13], ['Contoso WhatsApp Campaign', 21, 4, 9, 0], ['4K TV Upgrade · form', 12, 0, 3, 2]];
const TOTAL = CAMPAIGNS.reduce((t, r) => [t[0] + r[1], t[1] + r[2], t[2] + r[3], t[3] + r[4]], [0, 0, 0, 0]);   // 2,068 / 228 / 616 / 472
const DECLINED = [['Invalid number', 301], ['Not interested', 139], ['Duplicate lead', 52], ["Customer didn't make the request", 38],
  ['Wrong number', 24], ['No answer', 21], ['Already has an enquiry', 17], ['Other', 24]];
const SOURCES = [['Instagram', 1188, [205, 210, 600, 173]], ['Facebook', 839, [120, 160, 395, 164]], ['Website', 25, [8, 6, 5, 6]], ['WhatsApp', 16, [3, 4, 5, 4]]];   // qualified, unqualified, declined, other (widths only)
const WAITING = [['3 Jul 2026', '214', 'Laptops English Short', 14], ['4 Jul 2026', '387', 'Laptops Arabic Short', 13], ['4 Jul 2026', '902', 'Laptops Arabic Short', 13],
  ['4 Jul 2026', '158', 'Laptops Arabic Short', 13], ['4 Jul 2026', '641', 'Laptops Arabic Short', 13], ['5 Jul 2026', '073', 'Laptops English Short', 12]];
const TABS = ['Overview', 'Campaigns', 'Agents', 'Journeys', 'Stores', 'Leads'];
const n = (v) => v.toLocaleString('en-US');
const pct = (a, b) => (b ? (100 * a / b) : 0).toFixed(1) + '%';
const rate = (r) => 100 * r[2] / r[1];
const decl = DECLINED.reduce((t, r) => t + r[1], 0);   // 616

const KPIS = [['Leads', n(TOTAL[0]), '▲ 4.2% vs June', 'up'], ['Qualified', n(TOTAL[1]), `▲ 0.8 pts · ${pct(TOTAL[1], TOTAL[0])} qualified`, 'up'],
  ['Declined', n(TOTAL[2]), `▲ 2.1 pts · ${pct(TOTAL[2], TOTAL[0])} of leads`, 'bad'], ['Never contacted', n(TOTAL[3]), `${pct(TOTAL[3], TOTAL[0])} of leads · call first`, 'bad2'],
  ['Sent to stores', '287', `${pct(287, TOTAL[0])} of all leads`, '']];

const BEFORE = (() => {
  const css = `body{background:#d5d9de;color:#1f2937;position:relative}
.box{position:absolute;background:#fff}
.logo{left:25px;top:18px;width:200px;height:40px;display:grid;place-items:center;border:1px solid #c5cad1;font:800 19px Inter;letter-spacing:.18em;color:#1683f0}
.logo small{display:none}
.title{left:583px;top:16px;width:700px;height:41px;border:1px solid #c5cad1;display:flex;align-items:baseline;gap:14px;padding:4px 0 0 2px}
.title b{font:700 28px Inter;color:#111}.title span{font-size:14px;color:#4b5563}
.filters{left:58px;top:80px;width:1234px;height:86px;border:1px solid #c5cad1}
.f{position:absolute;top:13px}.f label{display:block;font-size:11px;font-weight:600;color:#4b5563;letter-spacing:.02em;margin-bottom:5px;text-transform:uppercase}
.inp{height:32px;border:1px solid #d1d5db;border-radius:6px;display:flex;align-items:center;padding:0 12px;font-size:13px;font-weight:500;justify-content:space-between}
.inp i{font-style:normal;font-size:10px;color:#4b5563}
.seg{display:flex;gap:6px}.seg span{height:32px;display:grid;place-items:center;padding:0 11px;border-radius:6px;font-size:13px;font-weight:700;border:1px solid #d1d5db}
.seg .on{background:#1683f0;color:#fff;border-color:#1683f0}
.kpi{padding:17px 18px 0 18px}.kpi label{display:block;font-size:11px;font-weight:600;color:#4b5563;text-transform:uppercase;letter-spacing:.02em}
.kpi b{display:block;font:700 34px Inter;color:#1683f0;margin-top:6px;line-height:1.1}.kpi small{display:block;font-size:12.5px;margin-top:6px;color:#4b5563}
.kpi .up{color:#15803d}.kpi .bad{color:#dc2626}
.panel{border:1px solid #c5cad1}
h3{font:700 20px 'Roboto Condensed';text-align:center;color:#111;letter-spacing:.005em}
table{border-collapse:collapse;width:100%;font-size:13px}
th{font-size:10.5px;font-weight:600;color:#4b5563;text-transform:uppercase;text-align:right;padding:6px 6px;border-bottom:2px solid #1683f0}
th:first-child,td:first-child{text-align:left}
td{padding:0 6px;height:24.2px;line-height:15px;text-align:right;border-bottom:1px solid #eef0f3}
td.c{color:#fff;font-weight:700;text-align:right}
table.tw td{height:21.5px}tr.t td{font-weight:700;border-top:2px solid #9ca3af;border-bottom:0;height:26px}
.bar{display:inline-block;height:15px;background:#18249c;vertical-align:middle}
.hb{display:flex;align-items:center;gap:6px;height:33.3px;font-size:13px;white-space:nowrap}
.hb .lab{width:226px;text-align:right;color:#1f2937;padding-right:2px}
.hb .v{font-weight:700}.hb .p{color:#6b7280}
.tabs{position:absolute;left:532px;top:868px;display:flex;gap:6px;font-size:13px;color:#4b5563}
.tabs span{padding:5px 12px;border-radius:14px}.tabs .on{background:#1683f0;color:#fff;font-weight:600}`;
  const f = (x, label, inner) => `<div class="f" style="left:${x}px"><label>${label}</label>${inner}</div>`;
  const kcol = [['#fdf6d3', 25, 185, 275, 106], ['#e2effc', 310, 179, 329, 98], ['#fbe5ee', 651, 189, 250, 102], ['#e6f6e4', 913, 178, 310, 108], ['#efe6fb', 1237, 184, 350, 100]];
  const kpis = KPIS.map(([l, v, s, c], i) => { const [bg, x, y, w, h] = kcol[i];
    const sub = c === 'up' ? `<span class="up">${s.slice(0, s.indexOf(' ', 2))}</span>${s.slice(s.indexOf(' ', 2))}` : c === 'bad' ? `<span class="bad">${s.slice(0, s.indexOf('·'))}</span>${s.slice(s.indexOf('·') - 1)}` : c === 'bad2' ? `<span class="bad">${s.slice(0, s.indexOf('·'))}</span>${s.slice(s.indexOf('·') - 1)}` : s;
    return `<div class="box kpi" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${bg};border:1px solid #c5cad1"><label>${l}</label><b style="${i === 3 ? 'color:#dc2626' : ''}">${v}</b><small>${sub}</small></div>`; }).join('');
  const cellBg = (r) => r >= 12 ? '#16a34a' : r >= 8 ? '#fbbf24' : '#dc4a4a';
  const camp = `<div class="box panel" style="left:25px;top:310px;width:921px;height:337px;padding:18px 18px 0"><h3>Campaigns</h3>
    <table style="margin-top:8px"><tr><th style="width:250px">Campaign</th><th style="text-align:left;width:200px">Leads</th><th style="width:96px">Qualified</th><th style="width:100px">Qual. rate</th><th style="width:80px">Declined</th><th>Never contacted</th></tr>
    ${CAMPAIGNS.map((r) => `<tr><td style="font-weight:600">${r[0]}</td><td style="text-align:left"><span class="bar" style="width:${Math.max(3, Math.round(r[1] / 648 * 146))}px"></span><span style="float:right;font-weight:700">${r[1]}</span></td><td>${r[2]}</td><td class="c" style="background:${cellBg(rate(r))}">${rate(r).toFixed(1)}%</td><td>${r[3]}</td><td style="${r[4] >= 100 ? 'color:#dc2626' : ''}">${r[4]}</td></tr>`).join('')}
    <tr class="t"><td>Total</td><td style="text-align:right">${n(TOTAL[0])}</td><td>${TOTAL[1]}</td><td class="c" style="background:#fbbf24">${pct(TOTAL[1], TOTAL[0])}</td><td>${TOTAL[2]}</td><td style="color:#dc2626">${TOTAL[3]}</td></tr></table></div>`;
  const dColor = ['#1e90ff', '#e8703a'];
  const why = `<div class="box panel" style="left:960px;top:301px;width:625px;height:331px;padding:16px 20px 0"><h3>Why Leads Are Declined</h3><div style="margin-top:8px">
    ${DECLINED.map(([l, v], i) => `<div class="hb"><span class="lab">${l}</span><span class="bar" style="height:17px;width:${Math.round(v / 301 * 275)}px;background:${dColor[i] || '#18249c'}"></span><span class="v">${v}</span><span class="p">· ${pct(v, decl)}</span></div>`).join('')}</div></div>`;
  const sc = ['#1e90ff', '#18249c', '#e040a0', '#ffd400'];
  const src = `<div class="box panel" style="left:39px;top:667px;width:716px;height:200px;padding:16px 20px 0"><h3>Lead Sources</h3>
    <div style="position:absolute;right:20px;top:40px;display:flex;gap:10px;font-size:12px;color:#4b5563">${['Qualified', 'Unqualified', 'Declined', 'Other'].map((t, i) => `<span><i style="display:inline-block;width:9px;height:9px;background:${sc[i]};margin-right:3px"></i>${t}</span>`).join('')}</div>
    <div style="margin-top:20px">${SOURCES.map(([l, v, w]) => `<div style="display:flex;align-items:center;height:32px;font-size:13px"><span style="width:96px;text-align:right;font-weight:600;padding-right:6px">${l}</span>${w.map((x, i) => `<i style="display:inline-block;height:18px;width:${Math.round(x * 452 / 1188 * 1.0)}px;min-width:1px;background:${sc[i]}"></i>`).join('')}<b style="margin-left:9px">${n(v)}</b></div>`).join('')}</div></div>`;
  const wait = `<div class="box panel" style="left:771px;top:651px;width:815px;height:212px;padding:16px 18px 0"><h3>Never Contacted · Call First</h3>
    <table class="tw" style="margin-top:6px;font-size:13px"><tr><th style="width:160px">Received</th><th style="text-align:left;width:235px">Lead</th><th style="text-align:left">Source</th><th>Waiting</th></tr>
    ${WAITING.map(([d, p, s, w]) => `<tr><td>${d}</td><td style="text-align:left">971 5•• ••• ${p}</td><td style="text-align:left">${s}</td><td class="c" style="background:#dc4a4a;width:127px">${w} days</td></tr>`).join('')}</table></div>`;
  const body = `<div class="box logo">CONTOSO</div>
  <div class="box title"><b>Campaign performance</b><span>Contoso · 1–17 July 2026</span></div>
  <div class="box filters">${f(19, 'Date range', `<div style="display:flex;gap:8px"><div class="inp" style="width:146px">1 Jul 2026</div><div class="inp" style="width:146px">17 Jul 2026</div></div>`)}
  ${f(340, 'Store', `<div class="seg"><span class="on">ONLINE</span><span>MALLS</span></div>`)}
  ${f(506, 'Month', `<div class="inp" style="width:183px">Jul 2026<i>▼</i></div>`)}
  ${f(711, 'Platform', `<div class="inp" style="width:199px">All platforms<i>▼</i></div>`)}
  ${f(932, 'Lead status', `<div class="inp" style="width:199px">All statuses<i>▼</i></div>`)}</div>
  ${kpis}${camp}${why}${src}${wait}
  <div class="tabs">${TABS.map((t) => `<span class="${t === 'Campaigns' ? 'on' : ''}">${t}</span>`).join('')}</div>`;
  return doc(css, body);
})();

const AFTER = (() => {
  const navy = '#1d4a73';
  const css = `body{background:#f1f3f6;color:#1f2937;position:relative}
.hdr{position:absolute;left:0;top:0;width:1600px;height:68px;background:#fff;border-bottom:4px solid ${navy};display:flex;align-items:center;padding:0 30px}
.hdr b{font:700 26px Inter;color:#111;letter-spacing:-.01em}.hdr .sub{font-size:14px;color:#4b5563;margin-left:14px;margin-top:4px}
.tabs{position:absolute;left:800px;top:20px;display:flex;gap:4px;font-size:13px;color:#374151;font-weight:500}
.tabs span{padding:5px 12px;border-radius:14px}.tabs .on{background:${navy};color:#fff;font-weight:600}
.logo{position:absolute;right:32px;top:22px;font:800 19px Inter;letter-spacing:.2em;color:${navy}}
.card{position:absolute;background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.12)}
.f{position:absolute;top:12px}.f label{display:block;font-size:11px;font-weight:600;color:#4b5563;letter-spacing:.02em;margin-bottom:5px;text-transform:uppercase}
.inp{height:31px;border:1px solid #d1d5db;border-radius:6px;display:flex;align-items:center;padding:0 12px;font-size:13px;font-weight:500;justify-content:space-between}
.inp i{font-style:normal;font-size:10px;color:#4b5563}
.seg{display:flex;gap:4px}.seg span{height:31px;display:grid;place-items:center;padding:0 11px;border-radius:6px;font-size:13px;font-weight:700;border:1px solid #d1d5db}
.seg .on{background:${navy};color:#fff;border-color:${navy}}
.kpi{border-top:5px solid ${navy};padding:14px 18px 0}.kpi label{display:block;font-size:11px;font-weight:600;color:#4b5563;text-transform:uppercase;letter-spacing:.02em}
.kpi b{display:block;font:700 32px Inter;color:#1f2937;margin-top:4px;line-height:1.1}.kpi small{display:block;font-size:12.5px;margin-top:5px;color:#4b5563}
.up{color:#15803d}.bad{color:#b91c1c}.mid{color:#a16207}
h3{font:700 15.5px Inter;color:#111}.h3s{font-size:12px;color:#6b7280;margin-top:2px}
table{border-collapse:collapse;width:100%;font-size:13px}
th{font-size:10.5px;font-weight:600;color:#4b5563;text-transform:uppercase;text-align:right;padding:5px 6px;border-bottom:2px solid ${navy}}
th:first-child,td:first-child{text-align:left}
td{padding:0 6px;height:24.2px;line-height:15px;text-align:right;border-bottom:1px solid #eef0f3}
table.tw td{height:21.5px}tr.t td{font-weight:700;border-top:2px solid #9ca3af;border-bottom:0;height:26px}
.bar{display:inline-block;height:14px;background:#9dc3e6;vertical-align:middle}
.hb{display:flex;align-items:center;gap:7px;height:33.3px;font-size:13px;white-space:nowrap}
.hb .lab{width:222px;text-align:right;padding-right:2px}.hb .v{font-weight:700}.hb .p{color:#6b7280}`;
  const f = (x, label, inner) => `<div class="f" style="left:${x}px"><label>${label}</label>${inner}</div>`;
  const kpis = KPIS.map(([l, v, s, c], i) => { const x = 21 + i * 315;
    const sub = c === 'up' ? `<span class="up">${s.slice(0, s.indexOf(' ', 2))}</span>${s.slice(s.indexOf(' ', 2))}` : c ? `<span class="bad">${s.slice(0, s.indexOf('·'))}</span>${s.slice(s.indexOf('·') - 1)}` : s;
    return `<div class="card kpi" style="left:${x}px;top:177px;width:299px;height:100px"><label>${l}</label><b style="${i === 3 ? 'color:#b91c1c' : ''}">${v}</b><small>${sub}</small></div>`; }).join('');
  const rc = (r) => r >= 12 ? 'up' : r >= 8 ? 'mid' : 'bad';
  const camp = `<div class="card" style="left:21px;top:293px;width:955px;height:342px;padding:14px 18px 0"><h3>Campaigns</h3><div class="h3s">Sorted by leads · qualification rate: 12% or more is good, under 8% needs attention</div>
    <table style="margin-top:7px"><tr><th style="width:250px">Campaign</th><th style="text-align:left;width:212px">Leads</th><th style="width:97px">Qualified</th><th style="width:100px">Qual. rate</th><th style="width:80px">Declined</th><th>Never contacted</th></tr>
    ${CAMPAIGNS.map((r) => `<tr><td style="font-weight:500">${r[0]}</td><td style="text-align:left"><span class="bar" style="width:${Math.max(3, Math.round(r[1] / 648 * 146))}px"></span><span style="float:right;font-weight:700">${r[1]}</span></td><td>${r[2]}</td><td class="${rc(rate(r))}" style="font-weight:700">${rate(r).toFixed(1)}%</td><td>${r[3]}</td><td class="${r[4] >= 100 ? 'bad' : ''}" style="${r[4] >= 100 ? 'font-weight:700' : ''}">${r[4]}</td></tr>`).join('')}
    <tr class="t"><td>Total</td><td style="text-align:right">${n(TOTAL[0])}</td><td>${TOTAL[1]}</td><td class="mid">${pct(TOTAL[1], TOTAL[0])}</td><td>${TOTAL[2]}</td><td class="bad">${TOTAL[3]}</td></tr></table></div>`;
  const dShade = (i) => ['#1d4a73', '#2e74b5'][i] || '#9dc3e6';
  const why = `<div class="card" style="left:992px;top:293px;width:587px;height:342px;padding:14px 18px 0"><h3>Why leads are declined</h3><div class="h3s">${decl} declined leads</div><div style="margin-top:10px">
    ${DECLINED.map(([l, v], i) => `<div class="hb"><span class="lab">${l}</span><span class="bar" style="height:17px;width:${Math.round(v / 301 * 248)}px;background:${dShade(i)}"></span><span class="v">${v}</span><span class="p">· ${pct(v, decl)}</span></div>`).join('')}</div></div>`;
  const sc = [navy, '#9dc3e6', '#f4b183', '#e5e7eb'];
  const src = `<div class="card" style="left:21px;top:652px;width:771px;height:228px;padding:16px 18px 0"><h3>Lead sources</h3>
    <div style="position:absolute;right:18px;top:36px;display:flex;gap:10px;font-size:12px;color:#4b5563">${['Qualified', 'Unqualified', 'Declined', 'Other'].map((t, i) => `<span><i style="display:inline-block;width:9px;height:9px;background:${sc[i]};margin-right:3px"></i>${t}</span>`).join('')}</div>
    <div style="margin-top:26px">${SOURCES.map(([l, v, w]) => `<div style="display:flex;align-items:center;height:38px;font-size:13px"><span style="width:110px;text-align:right;font-weight:600;padding-right:6px">${l}</span>${w.map((x, i) => `<i style="display:inline-block;height:18px;width:${Math.round(x * 497 / 1188)}px;min-width:1px;background:${sc[i]}"></i>`).join('')}<b style="margin-left:9px">${n(v)}</b></div>`).join('')}</div></div>`;
  const wait = `<div class="card" style="left:808px;top:652px;width:771px;height:228px;padding:16px 18px 0"><h3>Never contacted · call first</h3><div class="h3s">${TOTAL[3]} leads waiting · oldest first</div>
    <table class="tw" style="margin-top:6px"><tr><th style="width:158px">Received</th><th style="text-align:left;width:222px">Lead</th><th style="text-align:left">Source</th><th>Waiting</th></tr>
    ${WAITING.map(([d, p, s, w]) => `<tr><td>${d}</td><td style="text-align:left">971 5•• ••• ${p}</td><td style="text-align:left">${s}</td><td class="bad" style="font-weight:700">${w} days</td></tr>`).join('')}</table></div>`;
  const body = `<div class="hdr"><b>Campaign performance</b><span class="sub">Contoso · 1–17 July 2026</span>
    <div class="tabs">${TABS.map((t) => `<span class="${t === 'Campaigns' ? 'on' : ''}">${t}</span>`).join('')}</div><div class="logo">CONTOSO</div></div>
  <div class="card" style="left:21px;top:88px;width:1558px;height:74px">${f(17, 'Date range', `<div style="display:flex;gap:7px"><div class="inp" style="width:146px">1 Jul 2026</div><div class="inp" style="width:146px">17 Jul 2026</div></div>`)}
  ${f(339, 'Store', `<div class="seg"><span class="on">ONLINE</span><span>MALLS</span></div>`)}
  ${f(505, 'Month', `<div class="inp" style="width:183px">Jul 2026<i>▼</i></div>`)}
  ${f(710, 'Platform', `<div class="inp" style="width:199px">All platforms<i>▼</i></div>`)}
  ${f(931, 'Lead status', `<div class="inp" style="width:199px">All statuses<i>▼</i></div>`)}</div>
  ${kpis}${camp}${why}${src}${wait}`;
  return doc(css, body);
})();

// ---------------------------------------------------------------------------------------------------------------
// 2. Report-styles mockups rebuilt to fix three glitches (2026-10-03): executive "Sep" clipped at the chart's edge,
//    sales "Proposal · 540" touching its box's edges, marketing "Customers · 612" overflowing its box (and its
//    legend below the card). Content, colours and numbers are the same as the originals, in English and Arabic.
// ---------------------------------------------------------------------------------------------------------------
const AR_MONTHS = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// a line/area chart in an SVG whose axis labels stay inside: first label starts at the left edge, last ends at the right
const lineChart = ({ w, h, series, months, rtl, dashed, grid = 4, max, min = 0, labelEvery = 1, padTop = 14, font }) => {
  const pl = 8, pr = 8, pb = 30, ih = h - padTop - pb, iw = w - pl - pr, cnt = series[0].pts.length;
  const X = (i) => { const x = pl + iw * i / (cnt - 1); return rtl ? w - x : x; };
  const Y = (v) => padTop + ih * (1 - (v - min) / (max - min));
  let s = '';
  for (let g = 0; g <= grid; g++) s += `<line x1="0" x2="${w}" y1="${(padTop + ih * g / grid).toFixed(1)}" y2="${(padTop + ih * g / grid).toFixed(1)}" stroke="#e5e7eb"/>`;
  if (dashed != null) s += `<line x1="0" x2="${w}" y1="${Y(dashed).toFixed(1)}" y2="${Y(dashed).toFixed(1)}" stroke="#6b7280" stroke-width="1.6" stroke-dasharray="6 5"/>`;
  for (const se of series) {
    const p = se.pts.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    if (se.fill) s += `<polygon points="${X(0).toFixed(1)},${Y(min)} ${p} ${X(cnt - 1).toFixed(1)},${Y(min)}" fill="${se.fill}"/>`;
    s += `<polyline points="${p}" fill="none" stroke="${se.color}" stroke-width="${se.width || 3}" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (se.dot) s += `<circle cx="${X(cnt - 1).toFixed(1)}" cy="${Y(se.pts[cnt - 1]).toFixed(1)}" r="5.5" fill="${se.color}"/>`;
  }
  months.forEach((m, i) => { if (i % labelEvery) return; const anchor = i === 0 ? (rtl ? 'end' : 'start') : i === cnt - 1 ? (rtl ? 'start' : 'end') : 'middle';
    s += `<text x="${X(i).toFixed(1)}" y="${h - 8}" text-anchor="${anchor}" font-size="13" fill="#6b7280" font-family="${font}">${m}</text>`; });
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;overflow:hidden;direction:ltr">${s}</svg>`;
};
const spark = (pts, color, w = 96, h = 34) => { const mx = Math.max(...pts), mn = Math.min(...pts);
  const P = pts.map((v, i) => [3 + (w - 9) * i / (pts.length - 1), 4 + (h - 10) * (1 - (v - mn) / (mx - mn || 1))]);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block"><polyline points="${P.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${P.at(-1)[0].toFixed(1)}" cy="${P.at(-1)[1].toFixed(1)}" r="4.5" fill="${color}"/></svg>`; };

const EXECUTIVE = (lang) => {
  const ar = lang === 'ar', dir = ar ? 'rtl' : 'ltr';
  const T = ar ? { title: 'أداء الشركة', meta: 'منذ بداية العام · تحديث اليوم 07:00', rev: 'الإيرادات', gm: 'هامش الربح', nc: 'عملاء جدد', cash: 'السيولة',
    d1: '<span class="num">+9.3%</span> عن العام الماضي', d2: '<span class="num">+1.1 pp</span> عن العام الماضي', d3: '<span class="num">−3.8%</span> عن العام الماضي', d4: '<span class="num">+2.1%</span> عن العام الماضي',
    chart: 'الإيرادات الشهرية (مليون درهم)', chartSub: 'هذا العام مقابل العام الماضي · الخط المتقطع: متوسط الموازنة الشهرية (5.2)',
    know: '3 أمور يجب معرفتها', knowSub: 'فقط ما تغيّر أو يحتاج قرارًا',
    k: [['قطاع التجزئة في الإمارات يتجاوز الخطة', '<span class="num">+2.1</span> مليون درهم عن الهدف هذا الربع'], ['العملاء الجدد في تراجع منذ 3 أشهر', 'القناة الإلكترونية <span class="num">−11%</span>؛ راجع مزيج الحملات'], ['مستحقات تجاوزت 90 يومًا: 1.4 مليون درهم', 'ثلاثة حسابات تمثل <span class="num">70%</span>']] }
    : { title: 'Company performance', meta: 'Year to date · updated today 07:00', rev: 'Revenue', gm: 'Gross margin', nc: 'New customers', cash: 'Cash position',
      d1: '+9.3% vs last year', d2: '+1.1 pp vs last year', d3: '−3.8% vs last year', d4: '+2.1% vs last year',
      chart: 'Monthly revenue (AED M)', chartSub: 'This year vs last year · dashed line: average monthly budget (5.2)',
      know: '3 things to know', knowSub: 'Only what changed or needs a decision',
      k: [['UAE retail ahead of plan', '+AED 2.1M vs target this quarter'], ['New customers down for 3 months', 'Online channel −11%; review campaign mix'], ['Receivables over 90 days: AED 1.4M', 'Three accounts make up 70%']] };
  const css = `body{background:#eff3f8;color:#0f172a}
.top{position:absolute;left:26px;right:26px;top:22px;display:flex;justify-content:space-between;align-items:flex-end}
h1{font:800 31px Inter;letter-spacing:-.01em}[dir=rtl] h1{font:700 30px 'Plex Arabic'}.meta{font-size:15px;color:#64748b;padding-bottom:4px}
.card{position:absolute;background:#fff;border-radius:16px;box-shadow:0 1px 2px rgba(15,23,42,.06)}
.kpi{top:80px;width:375px;height:170px;padding:24px 26px}.kpi label{font-size:15px;font-weight:600;color:#64748b}
.kpi .row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px}
.kpi b{font:800 41px Inter;letter-spacing:-.01em;line-height:1}.kpi small{display:block;margin-top:10px;font-size:15px;font-weight:700}
.g{color:#15803d}.r{color:#b91c1c}
h2{font:700 18px Inter}[dir=rtl] h2{font:700 18px 'Plex Arabic'}.h2s{font-size:14px;color:#64748b;margin-top:4px}
.item{display:flex;gap:22px;padding:16px 0;border-top:1px solid #e2e8f0}.item b{display:block;font-size:15px;font-weight:500}.item small{display:block;font-size:12.5px;color:#64748b;margin-top:5px}
.ic{flex:none;width:26px;display:grid;place-items:center;padding-top:6px}`;
  const kp = [[T.rev, 'AED 48.2M', T.d1, 'g', [3, 5, 4, 7, 8, 7.5, 10], '#15803d'], [T.gm, '34.0%', T.d2, 'g', [4, 6, 5, 6.5, 8, 8], '#15803d'], [T.nc, '1,284', T.d3, 'r', [9, 6, 9, 3, 5, 5, 2], '#b91c1c'], [T.cash, 'AED 12.6M', T.d4, 'g', [3, 5, 5, 7, 7, 7, 9], '#15803d']];
  const arrow = (c) => c === 'g' ? '▲' : '▼';
  const kpis = kp.map(([l, v, d, c, pts, col], i) => { const x = 26 + i * 391; const left = ar ? 1600 - 26 - 375 - i * 391 : x;
    return `<div class="card kpi" style="left:${left}px"><label>${l}</label><div class="row"><div><b class="num">${v}</b><small class="${c}">${arrow(c)} <span class="${ar ? '' : ''}">${d}</span></small></div>${spark(pts, col)}</div></div>`; }).join('');
  const chartW = 1000, chart = lineChart({ w: chartW, h: 432, rtl: false,   // time runs left to right in both languages, as in Power BI
    months: (ar ? AR_MONTHS : EN_MONTHS).slice(0, 9), dashed: 5.2, max: 7, min: 2.6, grid: 3, font: ar ? 'Plex Arabic' : 'Inter',
    series: [{ pts: [3.9, 4.0, 4.4, 4.2, 4.6, 4.7, 4.5, 4.9, 5.4].map((v) => v), color: '#cbd5e1', width: 2.2 }, { pts: [4.7, 5.2, 6.0, 5.6, 6.4, 6.6, 5.9, 6.4, 6.9], color: '#1d4ed8', fill: 'rgba(29,78,216,.10)', width: 3, dot: true }] });
  const cl = ar ? 522 : 26, kl = ar ? 26 : 1094;
  const icons = ['<svg width="22" height="20"><polygon points="11,1 21,19 1,19" fill="#15803d"/></svg>', '<svg width="22" height="20"><polygon points="1,1 21,1 11,19" fill="#b91c1c"/></svg>', '<svg width="22" height="22"><circle cx="11" cy="11" r="10" fill="#b45309"/></svg>'];
  const body = `<div class="top"><h1>${T.title}</h1><div class="meta">${T.meta}</div></div>${kpis}
  <div class="card" style="left:${cl}px;top:266px;width:1052px;height:560px;padding:24px 26px"><h2>${T.chart}</h2><div class="h2s">${T.chartSub}</div><div style="margin-top:18px">${chart}</div></div>
  <div class="card" style="left:${kl}px;top:266px;width:480px;height:560px;padding:24px 26px"><h2>${T.know}</h2><div class="h2s" style="margin-bottom:16px">${T.knowSub}</div>
  ${T.k.map(([a, b], i) => `<div class="item"><span class="ic">${icons[i]}</span><div><b>${a}</b><small>${b}</small></div></div>`).join('')}</div>`;
  return doc(css, body, dir);
};

const SALES = (lang) => {
  const ar = lang === 'ar', dir = ar ? 'rtl' : 'ltr';
  const T = ar ? { title: 'المبيعات · سبتمبر', upd: 'آخر تحديث قبل 10 دقائق', mtd: 'منذ بداية الشهر', mtdS: '<span class="num">92%</span> من هدف 10 ملايين', won: 'صفقات مكسوبة', wonS: '<span class="num">+18</span> عن نفس اليوم الشهر الماضي',
    wr: 'نسبة الفوز', wrS: 'المكسوبة ÷ العروض · الهدف <span class="num">30%</span>', dl: 'أيام متبقية', dlS: 'المطلوب 133 ألف درهم يوميًا', lb: 'لوحة الترتيب · الفعلي مقابل الهدف (درهم)',
    lbNote: 'الشريط: الفعلي · العلامة السوداء: الهدف · البرتقالي: متأخر عن الهدف', pipe: 'مسار الصفقات هذا الشهر', reg: 'المناطق مقابل الهدف',
    people: ['ليلى ح.', 'عمر س.', 'بريا ن.', 'دانيال ك.', 'كريم أ.', 'سارة م.', 'فاطمة ز.', 'يوسف ر.'], regions: ['دبي', 'أبوظبي', 'الشارقة', 'الشمالية'],
    funnel: ['عملاء محتملون', 'مؤهلون', 'عرض سعر', 'مكسوبة'] }
    : { title: 'Sales · September', upd: 'Updated 10 min ago', mtd: 'Month to date', mtdS: '92% of AED 10M target', won: 'Won deals', wonS: '+18 vs same day last month',
      wr: 'Win rate', wrS: 'Won ÷ proposals · target 30%', dl: 'Days left', dlS: 'Need AED 133K per day', lb: 'Leaderboard · actual vs target (AED)',
      lbNote: 'Bar: actual · black mark: target · orange: behind target', pipe: 'Pipeline this month', reg: 'Regions vs target',
      people: ['Layla H.', 'Omar S.', 'Priya N.', 'Daniel K.', 'Karim A.', 'Sara M.', 'Fatima Z.', 'Yousef R.'], regions: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Northern'],
      funnel: ['Leads', 'Qualified', 'Proposal', 'Won'] };
  const teal = '#0f7b83', orange = '#f97316', ink = '#0b1f33';
  const css = `body{background:#eef2f5;color:${ink}}
.top{position:absolute;left:26px;right:26px;top:22px;display:flex;justify-content:space-between;align-items:center}
h1{font:800 29px Inter}[dir=rtl] h1{font:700 29px 'Plex Arabic'}.pill{background:${ink};color:#fff;border-radius:18px;padding:8px 16px;font-size:14px;font-weight:700}
.card{position:absolute;background:#fff;border-radius:16px;box-shadow:0 1px 2px rgba(15,23,42,.06)}
.kpi{top:74px;width:375px;height:150px;padding:18px 22px}.kpi label{font-size:14px;font-weight:500;color:#475569}
.kpi b{display:block;font:800 40px Inter;margin-top:10px;line-height:1.1}.kpi small{display:block;margin-top:12px;font-size:12.5px;font-weight:600;color:#475569}
h2{font:700 17.5px Inter}[dir=rtl] h2{font:700 17.5px 'Plex Arabic'}
.lb{display:flex;align-items:center;height:57px;border-bottom:1px solid #e2e8f0;font-size:15.5px}
.track{position:relative;height:14px;background:#e2e8f0;border-radius:2px}.track i{position:absolute;top:0;height:14px;border-radius:2px}
.track u{position:absolute;top:-5px;width:3px;height:24px;background:${ink}}
.chip{font-size:12px;font-weight:700;padding:2px 7px;border-radius:5px}
.fn{display:flex;align-items:center;justify-content:center;height:48px;border-radius:7px;color:#fff;font-size:16px;font-weight:700;white-space:nowrap;padding:0 18px}
.fl{position:absolute;font-size:12px;font-weight:700;color:#334155;white-space:nowrap}`;
  const K = (i, l, v, s, extra = '') => `<div class="card kpi" style="left:${ar ? 1600 - 26 - 375 - i * 391 : 26 + i * 391}px"><label>${l}</label><b class="num">${v}</b><small>${s}</small>${extra}</div>`;
  const prog = `<div class="track" style="margin-top:6px;width:300px"><i style="${ar ? 'right' : 'left'}:0;width:240px;background:${teal}"></i><u style="${ar ? 'right' : 'left'}:260px"></u></div>`;
  const kpis = K(0, T.mtd, 'AED 9.2M', T.mtdS, prog).replace('<small>', '<small style="margin-top:8px">') + K(1, T.won, '146', T.wonS) + K(2, T.wr, '27%', T.wrS) + K(3, T.dl, '6', T.dlS);
  const rows = [[1.52, 113], [1.41, 104], [1.25, 100], [1.21, 97], [1.10, 88], [1.00, 83], [0.92, 77], [0.79, 69]];
  const medal = ['🥇', '🥈', '🥉'];
  const side = ar ? 'right' : 'left';
  const lb = rows.map(([v, p], i) => { const behind = p < 100; const markAt = 216; const w = Math.min(272, Math.round(markAt * p / 100));   // the black mark is each person's target
    return `<div class="lb"><span style="width:42px;font-weight:700;color:#475569;font-size:${i < 3 ? 16 : 15.5}px">${i < 3 ? medal[i] : i + 1}</span><span style="width:208px">${T.people[i]}</span>
      <div class="track" style="width:280px"><i style="${side}:0;width:${w}px;background:${behind ? orange : teal}"></i><u style="${side}:${markAt}px"></u></div>
      <span class="num" style="width:212px;text-align:center;font-weight:700">${v.toFixed(2)}M</span>
      <span style="flex:1;text-align:${ar ? 'left' : 'right'}"><span class="chip num" style="background:${behind ? '#ffedd5' : '#dcfce7'};color:${behind ? '#c2410c' : '#15803d'}">${p}%</span></span></div>`; }).join('');
  // the funnel: each box is as wide as its text needs, plus padding (fixes "Proposal · 540" touching its edges)
  const fw = [420, 190, 118, 118].map((w, i) => w);
  const fcol = [ink, '#1e4b72', teal, orange];
  const vals = ['2,480', '1,120', '540', '146'], drops = ['45%', '48%', '27%'];
  const funnel = fcol.map((c, i) => `<div class="fn" data-fn="${i}" style="background:${c};position:absolute;top:${50 + i * 58}px;${ar ? 'right' : 'left'}:var(--x${i});min-width:${fw[i]}px">${T.funnel[i]} · <span class="num" style="margin-${ar ? 'right' : 'left'}:.3em">${vals[i]}</span></div>`).join('')
    + drops.map((d, i) => `<span class="fl" data-fl="${i}" style="top:${50 + i * 58 + 48 + 1}px">↓ <span class="num">${d}</span></span>`).join('');
  const regs = [[0.84, 0.81, false], [0.81, 0.87, true], [0.86, 0.81, false], [0.71, 0.87, true]];
  const reg = regs.map(([w, t, b], i) => `<div style="display:flex;align-items:center;height:38px;font-size:14.5px;font-weight:600"><span style="width:104px">${T.regions[i]}</span>
    <div class="track" style="width:330px"><i style="${side}:0;width:${Math.round(330 * w)}px;background:${b ? orange : teal}"></i><u style="${side}:${Math.round(330 * t)}px"></u></div><span class="num" style="margin-${ar ? 'right' : 'left'}:12px;font-weight:700">${['3.9M', '2.8M', '1.6M', '0.9M'][i]}</span></div>`).join('');
  const L = ar ? 676 : 26, R = ar ? 26 : 941;
  const body = `<div class="top"><h1>${T.title}</h1><span class="pill">${T.upd}</span></div>${kpis}
  <div class="card" style="left:${L}px;top:240px;width:898px;height:600px;padding:18px 22px"><h2>${T.lb}</h2><div style="margin-top:8px">${lb}</div><div style="margin-top:14px;font-size:12.5px;color:#475569">${T.lbNote}</div></div>
  <div class="card" id="pipe" style="left:${R}px;top:240px;width:633px;height:292px;padding:18px 22px"><h2>${T.pipe}</h2>${funnel}</div>
  <div class="card" style="left:${R}px;top:548px;width:633px;height:292px;padding:18px 22px"><h2>${T.reg}</h2><div style="margin-top:12px">${reg}</div></div>`;
  return { html: doc(css, body, dir), after: async (page) => page.evaluate((ar) => {   // centre each funnel box under the first one, drop labels just outside the box
    const card = document.getElementById('pipe'), boxes = [...card.querySelectorAll('[data-fn]')];
    const cw = card.clientWidth - 44, w0 = boxes[0].offsetWidth;
    boxes.forEach((b, i) => { const x = 22 + Math.round((w0 - b.offsetWidth) / 2); b.style[ar ? 'right' : 'left'] = x + 'px'; });
    card.querySelectorAll('[data-fl]').forEach((l, i) => { const b = boxes[i + 1]; const edge = 22 + Math.round((w0 + b.offsetWidth) / 2) + 14; l.style[ar ? 'right' : 'left'] = edge + 'px'; l.style.top = (b.offsetTop + 14) + 'px'; });
    void cw; }, ar) };
};

const MARKETING = (lang) => {
  const ar = lang === 'ar', dir = ar ? 'rtl' : 'ltr';
  const T = ar ? { title: 'التسويق · من الوصول إلى العملاء', meta: 'آخر 30 يومًا · كل القنوات', spend: 'الإنفاق', spendS: '▲ <span class="num">8%</span> عن الشهر الماضي', leads: 'العملاء المحتملون', leadsS: '▲ <span class="num">14%</span>',
    cpl: 'تكلفة العميل المحتمل', cplS: '▼ <span class="num">5%</span> (أفضل)', roas: 'العائد على الإنفاق الإعلاني', roasS: 'الهدف <span class="num">4.0×</span>', journey: 'رحلة العميل', journeySub: 'نسبة التحويل بين كل خطوة',
    steps: ['الوصول', 'النقرات', 'محتملون', 'عملاء'], drop: '<b>أكبر تسرّب:</b> من الوصول إلى النقرات (<span class="num">3.5%</span>). جرّب إعلانات جديدة قبل زيادة الميزانية.',
    cplT: 'تكلفة العميل المحتمل حسب القناة (درهم)', ch: ['البريد الإلكتروني', 'بحث Google', 'إنستغرام', 'تيك توك', 'لينكدإن'], byM: 'العملاء المحتملون شهريًا', paid: 'مدفوع', org: 'مجاني' }
    : { title: 'Marketing · from reach to customers', meta: 'Last 30 days · all channels', spend: 'Spend', spendS: '▲ 8% vs last month', leads: 'Leads', leadsS: '▲ 14%',
      cpl: 'Cost per lead', cplS: '▼ 5% (better)', roas: 'Return on ad spend', roasS: 'Target 4.0×', journey: 'Customer journey', journeySub: 'Conversion between each step',
      steps: ['Reach', 'Clicks', 'Leads', 'Customers'], drop: '<b>Biggest drop:</b> reach to clicks (3.5%). Test new creatives before adding budget.',
      cplT: 'Cost per lead by channel (AED)', ch: ['Email', 'Google Search', 'Instagram', 'TikTok', 'LinkedIn'], byM: 'Leads by month', paid: 'Paid', org: 'Organic' };
  const ink = '#1e1033', purple = '#7c3aed';
  const css = `body{background:#f4f2f9;color:${ink}}
.top{position:absolute;left:26px;right:26px;top:20px;display:flex;justify-content:space-between;align-items:center}
h1{font:800 29px Inter}[dir=rtl] h1{font:700 29px 'Plex Arabic'}.meta{font-size:14.5px;color:#5b5470}
.card{position:absolute;background:#fff;border-radius:16px;box-shadow:0 1px 2px rgba(30,16,51,.06)}
.kpi{top:74px;width:375px;height:130px;padding:18px 22px}.kpi label{font-size:14.5px;font-weight:500;color:#5b5470}
.kpi b{display:block;font:800 37px Inter;margin-top:8px;line-height:1.1}.kpi small{display:block;margin-top:10px;font-size:12.5px;font-weight:700}
.g{color:#15803d}.mu{color:#5b5470}
h2{font:700 17.5px Inter}[dir=rtl] h2{font:700 17.5px 'Plex Arabic'}.h2s{font-size:13px;color:#5b5470;margin-top:4px}
.st{position:absolute;display:flex;align-items:center;justify-content:center;height:55px;border-radius:7px;color:#fff;font-size:16.5px;font-weight:700;white-space:nowrap;padding:0 18px}
.dl{position:absolute;font-size:12.5px;font-weight:700;color:#334155;white-space:nowrap}
.hb{display:flex;align-items:center;height:40px;font-size:14.5px}.hb .lab{width:132px;text-align:${ar ? 'left' : 'right'};padding-${ar ? 'left' : 'right'}:10px}
.hb i{display:inline-block;height:28px;border-radius:3px}.hb b{font-size:13px;margin-${ar ? 'right' : 'left'}:8px}
.note{background:#efe9fb;border-radius:12px;padding:15px 16px;font-size:14px}`;
  const K = (i, l, v, s, c) => `<div class="card kpi" style="left:${ar ? 1600 - 26 - 375 - i * 391 : 26 + i * 391}px"><label>${l}</label><b class="num">${v}</b><small class="${c}">${s}</small></div>`;
  const kpis = K(0, T.spend, 'AED 412K', T.spendS, 'mu') + K(1, T.leads, '3,860', T.leadsS, 'g') + K(2, T.cpl, 'AED 107', T.cplS, 'g') + K(3, T.roas, '4.6×', T.roasS, 'mu');
  const stc = [purple, '#8b5cf6', '#db2777', '#f59e0b'], sv = ['1,480,000', '52,300', '3,860', '612'], drops = ['3.5%', '7.4%', '15.9%'];
  const steps = stc.map((c, i) => `<div class="st" data-st="${i}" style="background:${c};top:${76 + i * 66}px;${i === 0 ? 'width:470px' : 'min-width:132px'}">${T.steps[i]} · <span class="num" style="margin-${ar ? 'right' : 'left'}:.3em">${sv[i]}</span></div>`).join('')
    + drops.map((d, i) => `<span class="dl" data-dl="${i}">↓ <span class="num">${d}</span></span>`).join('');
  const cplV = [31, 78, 96, 118, 164], cplC = ['#15803d', '#15803d', purple, purple, '#db2777'];
  const cpl = T.ch.map((c, i) => `<div class="hb"><span class="lab">${c}</span><i style="width:${Math.round(cplV[i] / 164 * 310)}px;background:${cplC[i]}"></i><b class="num">AED ${cplV[i]}</b></div>`).join('');
  const m12 = ar ? AR_MONTHS : EN_MONTHS;
  const chart = lineChart({ w: 760, h: 214, rtl: false, months: m12, labelEvery: 2, max: 1, min: 0, grid: 3, padTop: 10, font: ar ? 'Plex Arabic' : 'Inter',
    series: [{ pts: [.27, .38, .33, .48, .55, .5, .62, .69, .75, .73, .85, .95], color: purple, fill: 'rgba(124,58,237,.11)', width: 2.8, dot: true }, { pts: [.06, .09, .14, .11, .2, .25, .3, .27, .38, .44, .5, .56], color: '#db2777', width: 2.4 }] });
  const L = ar ? 869 : 26, R = ar ? 26 : 747;
  const body = `<div class="top"><h1>${T.title}</h1><div class="meta">${T.meta}</div></div>${kpis}
  <div class="card" id="jr" style="left:${L}px;top:220px;width:705px;height:620px;padding:20px 22px"><h2>${T.journey}</h2><div class="h2s">${T.journeySub}</div>${steps}
    <div class="note" style="position:absolute;left:22px;right:22px;top:378px">${T.drop}</div></div>
  <div class="card" style="left:${R}px;top:220px;width:827px;height:300px;padding:20px 22px"><h2>${T.cplT}</h2><div style="margin-top:16px">${cpl}</div></div>
  <div class="card" style="left:${R}px;top:536px;width:827px;height:304px;padding:20px 22px"><h2>${T.byM}</h2><div style="margin-top:12px">${chart}</div>
    <div style="display:flex;gap:18px;font-size:13px;color:#5b5470;margin-top:4px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${purple};margin-${ar ? 'left' : 'right'}:6px"></i>${T.paid}</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#db2777;margin-${ar ? 'left' : 'right'}:6px"></i>${T.org}</span></div></div>`;
  return { html: doc(css, body, dir), after: async (page) => page.evaluate((ar) => {   // steps centred under the first, each as wide as its text; drop labels beside the gap
    const card = document.getElementById('jr'), st = [...card.querySelectorAll('[data-st]')], w0 = st[0].offsetWidth, s = ar ? 'right' : 'left';
    const widest = Math.max(...st.slice(1).map((b) => b.offsetWidth)); st.slice(1).forEach((b) => { b.style.width = widest + 'px'; });
    st.forEach((b) => { b.style[s] = (22 + Math.round((w0 - b.offsetWidth) / 2)) + 'px'; });
    card.querySelectorAll('[data-dl]').forEach((l, i) => { const b = st[i + 1]; l.style[s] = (22 + Math.round((w0 + b.offsetWidth) / 2) + 14) + 'px'; l.style.top = (b.offsetTop + 19) + 'px'; });   // beside the step it leads to, as in the sales funnel
  }, ar) };
};

// Customer service, rebuilt from the published picture (2026-10-04: its source wasn't kept). Same layout, numbers
// and colours, in English and Arabic. Fixes the Arabic picture's numbers that ran the wrong way: "< 1 day" lost its
// 1, "1-3 days", "3-7 days" and "> 7 days" read backwards, and "target 85%" showed its % at the start of the line.
// The bar and table labels are HTML, so Arabic runs right to left; the numbers are isolated (.num).
const SERVICE = (lang) => {
  const ar = lang === 'ar', dir = ar ? 'rtl' : 'ltr', N = (v) => `<span class="num">${v}</span>`;
  const T = ar ? { title: 'خدمة العملاء · هل نفي بوعدنا؟', meta: 'اليوم · كل القنوات', sl: 'مستوى الخدمة', slS: `ضمن اتفاقية الخدمة · الهدف ${N('85%')}`,
    open: 'تذاكر مفتوحة', openS: `${N('+36')} اليوم`, fr: 'أول رد', frS: 'الهدف ساعتان', cs: 'رضا العملاء', csV: `${N('4.4')} من ${N('5')}`, csS: `${N('1,120')} تقييمًا`,
    age: 'التذاكر المفتوحة حسب العمر', ageS: 'العمود الأحمر هو الوعد الذي نخلفه', ages: ['أقل من يوم', `${N('1-3')} أيام`, `${N('3-7')} أيام`, `أكثر من ${N('7')} أيام`],
    frt: 'زمن أول رد (بالساعات) · الهدف ساعتان', agents: 'الموظفون اليوم', cols: ['الموظف', 'مغلقة', 'أول رد', 'التقييم'],
    people: ['نور ك.', 'علي م.', 'مريم س.', 'طارق ه.', 'رنا ت.', 'لينا ف.', 'حمزة ب.', 'زياد ن.'], note: 'اللون يوضح أول رد مقارنة بوعد الساعتين، وليس ترتيبًا للأشخاص.' }
    : { title: 'Customer service · are we keeping our promise?', meta: 'Today · all channels', sl: 'Service level', slS: 'answered within SLA · target 85%',
      open: 'Open tickets', openS: '+36 today', fr: 'First response', frS: 'Target 2h', cs: 'Customer satisfaction', csV: '4.4 / 5', csS: '1,120 ratings',
      age: 'Open tickets by age', ageS: 'The red bar is the promise we\'re breaking', ages: ['&lt; 1 day', '1-3 days', '3-7 days', '&gt; 7 days'],
      frt: 'First response time (hours) · target 2h', agents: 'Agents today', cols: ['Agent', 'Closed', 'First response', 'Rating'],
      people: ['Noor K.', 'Ali M.', 'Mariam S.', 'Tariq H.', 'Rana T.', 'Leena F.', 'Hamza B.', 'Ziad N.'], note: 'Colour shows the first response against the 2-hour promise, not a ranking of people.' };
  const top = ar ? 82 : 74, green = '#16a34a', ink = '#0f172a';
  const css = `body{background:#f4f7fc;color:${ink}}
.top{position:absolute;left:26px;right:26px;top:${ar ? 22 : 20}px;display:flex;justify-content:space-between;align-items:center}
h1{font:800 28.5px Inter;letter-spacing:-.01em}[dir=rtl] h1{font:700 28px 'Plex Arabic'}.meta{font-size:15px;color:#64748b}
.card{position:absolute;top:${top}px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:${ar ? 22 : 18}px 22px}
h2{font:700 18px Inter;line-height:22px}[dir=rtl] h2{font:700 18px 'Plex Arabic';line-height:24px}.h2s{font-size:13px;color:#64748b;margin-top:4px}
.big{position:absolute;width:300px;top:${ar ? 150 : 142}px;text-align:center;font:800 60px Inter;line-height:1}
.gs{position:absolute;width:300px;top:${ar ? 214 : 212}px;text-align:center;font-size:13px;color:#475569}
.stats{position:absolute;left:22px;right:22px;top:${ar ? 246 : 240}px}.kv{padding:${ar ? 12 : 11}px 0 ${ar ? 14 : 14}px;border-bottom:1px solid #e2e8f0}
.kv label{display:block;font-size:14.5px;font-weight:600;color:#475569}.kv b{display:block;text-align:${ar ? 'right' : 'left'};font:800 30px Inter;line-height:1.1;margin-top:${ar ? 6 : 2}px}.kv small{display:block;font-size:13px;color:#64748b;margin-top:${ar ? 8 : 4}px}
.bar{position:absolute;width:122px;border-radius:2px}.bv{position:absolute;width:122px;text-align:center;font-size:12.5px;font-weight:700;color:#475569}
.tx,.h2s{font-variant-numeric:normal}.bl{font-variant-numeric:normal;position:absolute;width:122px;text-align:center;font-size:12.5px;color:#64748b;white-space:nowrap}
.gl{position:absolute;left:22px;right:22px;height:1px;background:#e5e7eb}
.row{display:grid;grid-template-columns:133px 87px ${ar ? 145 : 159}px 1fr;align-items:center;height:${ar ? 56 : 53}px;border-bottom:1px solid #e2e8f0;font-size:15px}
.row>*{text-align:${ar ? 'right' : 'left'}}.row>:first-child{padding-${ar ? 'right' : 'left'}:6px}.hd{height:auto;padding-bottom:7px;margin-top:13px;font-size:13px;font-weight:600;color:#64748b;border-color:#cbd5e1}
.chip{justify-self:start;font-size:12px;font-weight:700;padding:2px 7px;border-radius:5px}`;
  const card = (x, w, h, inner, extra = '') => `<div class="card" style="${ar ? 'right' : 'left'}:${x}px;width:${w}px;height:${h}px${extra}">${inner}</div>`;
  // the gauge: a half circle, 87% of it green from the start
  const R = 140, cx = 150, cy = ar ? 205 : 200, side = ar ? 'right' : 'left', a = Math.PI * (1 - 0.87), ex = cx + R * Math.cos(a), ey = cy - R * Math.sin(a);
  const gauge = `<svg width="300" height="240" style="position:absolute;${side}:22px;top:0;direction:ltr"><path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy}" fill="none" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round"/>`
    + `<path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${green}" stroke-width="18" stroke-linecap="round"/></svg>`;
  const stats = [[T.open, '428', T.openS], [T.fr, '1h 42m', T.frS], [T.cs, T.csV, T.csS]].map(([l, v, s]) => `<div class="kv"><label>${l}</label><b${v.includes('span') ? '' : ' class="num"'}>${v}</b><small>${s}</small></div>`).join('');
  const sl = card(26, 410, 790, `<h2>${T.sl}</h2>${gauge}<div class="big num" style="${side}:22px">87%</div><div class="gs" style="${side}:22px">${T.slS}</div><div class="stats">${stats}</div>`);
  // open tickets by age: 1.2 px per ticket, bars on a left-to-right age axis in both languages (as in Power BI)
  const base = ar ? 336 : 328, bars = [[190, green], [142, '#2563eb'], [64, '#d97706'], [32, '#dc2626']];
  const ages = [0, 1, 2, 3].map((g) => `<div class="gl" style="top:${base - 256 + g * 85.3}px"></div>`).join('')
    + bars.map(([v, c], i) => { const x = 36 + i * 136.7, h = Math.round(v * 1.2);
      return `<div class="bar" style="left:${x}px;top:${base - h}px;height:${h}px;background:${c}"></div><div class="bv num" style="left:${x}px;top:${base - h - 19}px">${v}</div><div class="bl" style="left:${x}px;top:${base + 8}px">${T.ages[i]}</div>`; }).join('');
  const age = card(452, 606, 387, `<h2>${T.age}</h2><div class="h2s">${T.ageS}</div>${ages}`);
  const chart = lineChart({ w: 560, h: 311, rtl: false, months: ar ? AR_MONTHS : EN_MONTHS, labelEvery: 2, max: 2.73, min: 1.53, grid: 3, dashed: 2, padTop: 10, font: ar ? 'Plex Arabic' : 'Inter',
    series: [{ pts: [2.6, 2.4, 2.5, 2.2, 2.1, 2.3, 1.9, 1.8, 1.9, 1.7, 1.8, 1.7], color: '#2563eb', width: 2.6, dot: true }] });   // December 1.7 h = 1h 42m
  const frt = card(452, 606, 387, `<h2>${T.frt}</h2><div style="position:absolute;left:22px;top:${ar ? 49 : 44}px">${chart}</div>`, `;top:${top + 403}px`);
  const chip = (m) => { const c = m <= 120 ? ['#dcfce7', green] : m <= 180 ? ['#ffedd5', '#d97706'] : ['#fee2e2', '#dc2626'];
    return `<span class="chip num" style="background:${c[0]};color:${c[1]}">${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m</span>`; };
  const AG = [[64, 72, '4.7'], [58, 90, '4.5'], [61, 101, '4.6'], [55, 115, '4.4'], [71, 138, '4.1'], [47, 152, '4.2'], [49, 185, '3.8'], [38, 220, '3.6']];
  const rows = AG.map(([c, m, r], i) => `<div class="row"><span>${T.people[i]}</span><span class="num">${c}</span>${chip(m)}<span class="num">${r}</span></div>`).join('');
  const agents = card(1074, 500, 790, `<h2>${T.agents}</h2><div class="row hd">${T.cols.map((c) => `<span>${c}</span>`).join('')}</div>${rows}<p class="tx" style="margin-top:16px;font-size:13px;line-height:20px;color:#64748b">${T.note}</p>`);
  return doc(css, `<div class="top"><h1>${T.title}</h1><div class="meta">${T.meta}</div></div>${sl}${age}${frt}${agents}`, dir);
};

// HR, rebuilt from the published picture (2026-10-04: its source wasn't kept): the same cards, bars, numbers and
// colours, measured from the pixels. Joiners and leavers are drawn at their published heights (px).
const HR = (lang) => {
  const ar = lang === 'ar', dir = ar ? 'rtl' : 'ltr', dy = ar ? 8 : 0;
  const T = ar ? { title: 'الموارد البشرية · نظرة على القوى العاملة', meta: 'حتى 30 سبتمبر · المجموعات الأقل من 5 أشخاص مخفية',
    k: [['عدد الموظفين', '1,246', '+49 هذا الربع'], ['نسبة ترك العمل (12 شهرًا)', '13.2%', 'غادر 164 · متوسط القطاع 14%'], ['متوسط مدة الخدمة', '4.3 سنة', 'الوسيط 3.1'], ['وظائف شاغرة', '42', 'متوسط 34 يومًا للتعيين']],
    flow: 'المنضمون والمغادرون شهريًا', flowS: 'الفرق بين الأعمدة هو صافي النمو', joined: '▲ انضموا', left: '▼ غادروا', months: AR_MONTHS,
    why: '<b>لماذا يغادر الموظفون (مقابلات الخروج):</b> التطور الوظيفي 38%، الراتب 27%، المدير 19%، أخرى 16%',
    attr: 'ترك العمل حسب القسم (12 شهرًا)', depts: ['المبيعات', 'خدمة العملاء', 'العمليات', 'المالية', 'تقنية المعلومات'], gold: 'الذهبي: أعلى من متوسط القطاع 14%', years: 'سنوات الخدمة' }
    : { title: 'People · workforce overview', meta: 'As of 30 September · groups under 5 people are hidden',
      k: [['Headcount', '1,246', '+49 this quarter'], ['Attrition (12 months)', '13.2%', '164 left · industry 14%'], ['Avg. tenure', '4.3 yrs', 'Median 3.1'], ['Open roles', '42', 'Avg. 34 days to fill']],
      flow: 'People joining and leaving, by month', flowS: 'The gap between the bars is net growth', joined: '▲ Joined', left: '▼ Left', months: EN_MONTHS,
      why: '<b>Why people leave (exit interviews):</b> career growth 38%, pay 27%, manager 19%, other 16%',
      attr: 'Attrition by department (12 months)', depts: ['Sales', 'Customer service', 'Operations', 'Finance', 'IT'], gold: 'Gold: above the 14% industry average', years: 'Years of service' };
  const green = '#2e855a', gold = '#d69e2f', ink = '#16211c', mute = '#5b6660';
  const css = `body{background:#f4f6f5;color:${ink}}
.top{position:absolute;left:26px;right:26px;top:${ar ? 22 : 21}px;display:flex;justify-content:space-between;align-items:center}
h1{font:800 28.5px Inter;letter-spacing:-.01em}[dir=rtl] h1{font:700 28px 'Plex Arabic'}.meta{font-size:14px;color:${mute};margin-top:5px}[dir=rtl] .meta{font-size:13.8px;margin-top:3px}
.card{position:absolute;background:#fff;border-radius:16px}
.kpi{top:${74 + dy}px;width:375px;height:130px;padding:18px 22px}.kpi label{display:block;font-size:14.5px;font-weight:500;color:${mute}}
.kpi b{display:block;text-align:${ar ? 'right' : 'left'};font:800 ${ar ? 35 : 36}px Inter;margin-top:${ar ? 13 : 9}px;line-height:1.1}[dir=rtl] .kpi b{font-family:Inter,'Plex Arabic'}.kpi small{display:block;margin-top:${ar ? 16 : 10}px;font-size:13px;font-weight:600;color:${mute}}
h2{font:700 17px Inter;line-height:22px;margin-top:-3px}[dir=rtl] h2{font:700 17px 'Plex Arabic';line-height:26px}.h2s{font-size:12px;color:${mute};margin-top:5px}
.ab{position:absolute}.lab{position:absolute;font-size:12.5px;color:${mute};text-align:center;width:60px}
.tag{position:absolute;font-size:12px;font-weight:700;direction:ltr}`;
  const side = ar ? 'right' : 'left';
  const kpis = T.k.map(([l, v, s], i) => `<div class="card kpi" style="${side}:${26 + i * 391}px"><label>${l}</label><b class="${v.includes('سنة') ? '' : 'num'}">${v}</b><small>${s}</small></div>`).join('');
  // joiners (up) and leavers (down) from the axis; time runs left to right in both languages
  const J = [99, 81, 113, 135, 85, 76, 126, 154, 117, 94, 108, 131], Lv = [67, 53, 62, 49, 72, 90, 58, 53, 62, 44, 53, 67];
  const fx = ar ? 844 - 718 : 80 - 26, axis = ar ? 498 - 228 : 482 - 220;   // first bar's x and the axis' y inside the card
  const bars = J.map((h, i) => { const x = fx + Math.round(i * 59.82);
    return `<div class="ab" style="left:${x}px;top:${axis - h}px;width:26px;height:${h}px;background:${green}"></div><div class="ab" style="left:${x}px;top:${axis + 2}px;width:26px;height:${Lv[i]}px;background:${gold}"></div><div class="lab" style="left:${x - 17}px;top:${ar ? 442 : 436}px">${T.months[i]}</div>`; }).join('');
  const ax0 = ar ? 812 - 718 : 48 - 26;
  const flow = `<h2>${T.flow}</h2><div class="h2s">${T.flowS}</div><div class="tag" style="left:${ar ? 96 : 24}px;top:${ar ? 84 : 77}px;color:${green}">${T.joined}</div>
    <div class="ab" style="left:${ax0}px;top:${axis}px;width:740px;height:2px;background:#929493"></div>${bars}
    <div class="tag" style="left:${ar ? 96 : 24}px;top:${ar ? 424 : 417}px;color:${gold}">${T.left}</div>
    <div class="ab" style="left:22px;right:22px;top:${ar ? 490 : 480}px;height:${ar ? 49 : 47}px;border-radius:10px;background:#f0f6f2;padding:15px 16px;font-size:${ar ? 13.65 : 13.8}px">${T.why}</div>`;
  const attrV = [18.4, 16.1, 10.2, 6.3, 5.1], attrW = [340, 297, 188, 116, 94];   // bar widths as published (18.48 px per %)
  const attr = `<h2>${T.attr}</h2>${attrV.map((v, i) => { const y = (ar ? 287 - 228 : 274 - 220) + i * 38, bx = ar ? 270 - 26 : 1070 - 898, w = attrW[i];
    return `<div class="ab" style="left:0;width:${bx}px;top:${y}px;height:26px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:14.5px;box-sizing:border-box;direction:ltr"><span dir="${dir}">${T.depts[i]}</span></div>
      <div class="ab" style="left:${bx}px;top:${y}px;width:${w}px;height:26px;background:${v > 14 ? gold : green}"></div>
      <div class="ab num" style="left:${bx + w + 8}px;top:${y + 5}px;font-size:12.5px;font-weight:700">${v}%</div>`; }).join('')}
    <div class="ab" style="${side}:22px;top:${ar ? 258 : 251}px;font-size:${ar ? 11.8 : 12}px;color:${mute}">${T.gold}</div>`;
  const Y = [190, 260, 310, 280, 130, 76], cats = ['<1', '1-2', '2-4', '4-7', '7-10', '10+'];
  const yx = ar ? 134 - 26 : 934 - 898, base = ar ? 825 - 556 : 812 - 548;
  const years = `<h2>${T.years}</h2>${[0, 1, 2, 3].map((g) => `<div class="ab" style="left:${yx - 14}px;width:560px;top:${base - 215 + g * 71.7}px;height:1px;background:#eceeed"></div>`).join('')}
    ${Y.map((v, i) => { const h = Math.round(v * 0.6226), x = yx + i * 91;
      return `<div class="ab" style="left:${x}px;top:${base - h}px;width:77px;height:${h}px;background:${green}"></div><div class="ab num" style="left:${x}px;width:77px;text-align:center;top:${base - h - 18}px;font-size:11px;font-weight:700;color:#555f5a">${v}</div><div class="ab num" style="left:${x}px;width:77px;text-align:center;top:${base + 6}px;font-size:11.5px;color:${mute}">${cats[i].replace('<', '&lt;')}</div>`; }).join('')}`;
  const body = `<div class="top"><h1>${T.title}</h1><div class="meta">${T.meta}</div></div>${kpis}
  <div class="card" style="left:${ar ? 718 : 26}px;top:${220 + dy}px;width:856px;height:640px;padding:20px 22px">${flow}</div>
  <div class="card" style="left:${ar ? 26 : 898}px;top:${220 + dy}px;width:676px;height:312px;padding:20px 22px">${attr}</div>
  <div class="card" style="left:${ar ? 26 : 898}px;top:${548 + dy}px;width:676px;height:312px;padding:20px 22px">${years}</div>`;
  return doc(css, body, dir);
};

// Finance, rebuilt from the published picture (2026-10-04: its source wasn't kept): the P&L table, the budget-to-actual
// bridge (28.47 px per AED million; 7.2 +1.4 +0.8 -0.5 -1.6 = 7.3) and monthly revenue against budget (bars at their
// published heights), measured from the pixels. The Arabic picture keeps its layout as published (the charts run left
// to right, signs after the numbers).
const FINANCE = (lang) => {
  const ar = lang === 'ar', dir = ar ? 'rtl' : 'ltr';
  const G = ar ? { rule: 71, head: 124, row0: 125, pitch: 39, dbl: 514, tblL: 726, tblW: 844, dbarR: 1011, wfX: 159, wfBase: 423, mX: 173, mBase: 732, box: [722, 568, 852, 93] }
    : { rule: 63, head: 113, row0: 114, pitch: 36, dbl: 473, tblL: 26, tblW: 851, dbarL: 597, wfX: 905, wfBase: 412, mX: 919, mBase: 715, box: [26, 524, 851, 110] };
  const T = ar ? { title: 'الأرباح والخسائر · حتى سبتمبر 2026', meta: 'غير مدققة · مليون درهم · الأرقام بين قوسين تكاليف',
    cols: ['مليون درهم، منذ بداية العام', 'الفعلي', 'الموازنة', 'Δ الموازنة', 'Δ %', 'العام السابق'],
    rows: ['الإيرادات', 'مبيعات المنتجات', 'الخدمات', 'تكلفة المبيعات', 'إجمالي الربح', 'المصاريف التشغيلية', 'الرواتب', 'التسويق', 'الإيجار وأخرى', 'صافي الربح'],
    legend: ['الفعلي', 'الموازنة', 'أفضل من الموازنة', 'أسوأ من الموازنة'], com: 'التعليق',
    comT: 'صافي الربح أعلى من الموازنة بـ 0.1 مليون درهم: الحجم (+1.4) والسعر (+0.8) غطّيا ضعف المزيج وتكاليف أعلى بـ 1.6 مليون، منها زيادة إنفاق تسويقي بـ 0.4 مليون (حملة الخريف قُدّمت من الربع الرابع). الخدمات أقل من الموازنة بـ 1.7% بسبب عقدين متأخرين.',
    bridge: 'جسر صافي الربح: من الموازنة إلى الفعلي', steps: ['الموازنة', 'الحجم', 'السعر', 'المزيج', 'التكاليف', 'الفعلي'], month: 'الإيرادات شهريًا: الفعلي مقابل الموازنة', months: AR_MONTHS }
    : { title: 'Profit & loss · YTD September 2026', meta: 'Unaudited · AED million · figures in brackets are costs',
      cols: ['AED million, year to date', 'Actual', 'Budget', 'Δ Budget', 'Δ %', 'Prior year'],
      rows: ['Revenue', 'Product sales', 'Services', 'Cost of sales', 'Gross profit', 'Operating expenses', 'Salaries', 'Marketing', 'Rent & other', 'Net profit'],
      legend: ['Actual', 'Budget', 'Better than budget', 'Worse than budget'], com: 'Commentary',
      comT: 'Net profit AED 0.1M above budget: volume (+1.4) and price (+0.8) covered a weaker mix and AED 1.6M of higher costs, including a AED 0.4M marketing overspend (autumn campaign moved from Q4). Services 1.7% below budget on two delayed contracts.',
      bridge: 'Net profit bridge: budget to actual', steps: ['Budget', 'Volume', 'Price', 'Mix', 'Costs', 'Actual'], month: 'Revenue by month: actual vs budget', months: EN_MONTHS };
  const green = '#2e7d32', red = '#c62828', ink = '#111', dark = '#404040';
  // label, actual, budget, Δ budget, Δ %, prior year, bold, Δ% bar width (px, as published), better than budget
  const R = [[0, '48.2', '46.5', '+1.7', '+3.7%', '44.1', 1, 22, 1], [1, '36.9', '35.0', '+1.9', '+5.4%', '33.8', 0, 33, 1], [2, '11.3', '11.5', '−0.2', '−1.7%', '10.3', 0, 10, 0],
    [3, '(31.8)', '(30.7)', '−1.1', '−3.6%', '(29.6)', 1, 21, 0], [4, '16.4', '15.8', '+0.6', '+3.8%', '14.5', 1, 23, 1], [5, '(9.1)', '(8.6)', '−0.5', '−5.8%', '(8.4)', 1, 35, 0],
    [6, '(5.6)', '(5.4)', '−0.2', '−3.7%', '(5.2)', 0, 21, 0], [7, '(1.9)', '(1.5)', '−0.4', '−26.7%', '(1.6)', 0, 59, 0], [8, '(1.6)', '(1.7)', '+0.1', '+5.9%', '(1.6)', 0, 35, 1], [9, '7.3', '7.2', '+0.1', '+1.4%', '6.1', 1, 8, 1]];
  const css = `body{background:#fff;color:${ink}}
.top{position:absolute;left:26px;right:26px;top:${ar ? 26 : 17}px;display:flex;justify-content:space-between;align-items:flex-end;height:36px}
h1{font:800 26.25px Inter;letter-spacing:-.01em}[dir=rtl] h1{font:700 25.7px 'Plex Arabic',Inter}.meta{font-size:14px;color:#555;padding-bottom:2px}
.ab{position:absolute}.c{position:absolute;white-space:nowrap}
.hd{font-size:12.5px;font-weight:600;color:#555}.hd0{font-size:13px}.rw{font-size:15px}.b{font-weight:700}
.h3{position:absolute;font:700 14.5px Inter;letter-spacing:.058em;text-transform:uppercase}[dir=rtl] .h3{font:700 15px 'Plex Arabic';letter-spacing:0;margin-top:-2px}
.lg{position:absolute;font-size:13px;color:#555;display:flex;gap:20.67px;align-items:center}.lg i{display:inline-block;width:12px;height:10px;margin-${ar ? 'left' : 'right'}:6px;vertical-align:-1px}`;
  const S = ar ? 'right' : 'left', X = (x, w = 0) => ar ? `right:${1600 - x - w}px` : `left:${x}px`;   // x as measured on the English picture's side
  // the table: right edges of the number columns, measured (EN from the left; AR mirrored)
  const colR = ar ? [1564, 1236, 1140, 1031, 1011, 733] : [36, 366, 462, 577, 597, 866];   // AR: the numbers' left edges, as published
  const cell = (txt, i, y, cls, color) => {
    if (i === 0) return `<div class="c ${cls}" style="${ar ? `right:${1600 - colR[0]}px` : `left:${colR[0]}px`};top:${y}px">${txt}</div>`;
    if (i === 4) return '';
    const right = ar ? colR[i] : colR[i];
    return ar ? `<div class="c ${cls}" style="left:${right}px;top:${y}px;${color ? `color:${color}` : ''}">${txt}</div>` : `<div class="c ${cls}" style="right:${1600 - right}px;top:${y}px;${color ? `color:${color}` : ''}">${txt}</div>`;
  };
  let tbl = `<div class="ab" style="left:${G.tblL}px;width:${G.tblW}px;top:${G.head}px;height:1px;background:#141414"></div>`;
  tbl += T.cols.map((c, i) => i === 0 ? cell(c, 0, G.head - (ar ? 26 : 22), 'hd hd0') : i === 4 ? `<div class="c hd" style="${ar ? `right:${1600 - G.dbarR}px` : `left:${G.dbarL}px`};top:${G.head - 22}px">${c}</div>` : cell(c, i, G.head - (ar ? 27 : 22), 'hd')).join('');
  R.forEach(([li, a, bu, d, p, py, bold, bw, good], k) => {
    const y = G.row0 + k * G.pitch, ty = y + (G.pitch - 20) / 2, col = good ? green : red, cls = 'rw' + (bold ? ' b' : '');
    tbl += cell(`<span style="${!bold ? `margin-${S}:16px` : ''}">${T.rows[li]}</span>`, 0, ty - (ar ? 2 : 0), cls) + cell(a, 1, ty, cls) + cell(bu, 2, ty, cls) + cell(d, 3, ty, cls + ' b', col) + cell(py, 5, ty, cls, '#555');
    const by = y + Math.round((G.pitch - 12) / 2);
    tbl += `<div class="ab" style="${ar ? `left:${G.dbarR - bw}px` : `left:${G.dbarL}px`};top:${by}px;width:${bw}px;height:12px;background:${col}"></div>`
      + `<div class="c b" style="${ar ? `right:${1600 - (G.dbarR - bw - 6)}px` : `left:${G.dbarL + bw + 6}px`};top:${by - 2}px;font-size:12.5px;color:${col}">${p}</div>`;
    if (k < 9) tbl += `<div class="ab" style="left:${G.tblL}px;width:${G.tblW}px;top:${y + G.pitch - 1}px;height:1px;background:#ddd"></div>`;
  });
  tbl += `<div class="ab" style="left:${G.tblL}px;width:${G.tblW}px;top:${G.dbl}px;height:1px;background:#141414"></div><div class="ab" style="left:${G.tblL + (ar ? 2 : 6)}px;width:${G.tblW - (ar ? 0 : 8)}px;top:${G.dbl + 2}px;height:1px;background:#131313"></div>`;
  const lgc = [dark, '#fff', green, red];
  tbl += `<div class="lg" style="${S}:26px;top:${G.dbl + (ar ? 15 : 14)}px">${T.legend.map((l, i) => `<span><i style="background:${lgc[i]};${i === 1 ? 'outline:1px solid #222;outline-offset:-1px' : ''}"></i>${l}</span>`).join('')}</div>`;
  const [bxL, bxT, bxW, bxH] = G.box;
  tbl += `<div class="ab" style="left:${bxL}px;top:${bxT}px;width:${bxW}px;height:${bxH}px;background:#f6f6f6;border-${S}:4px solid #111;padding:${ar ? '11px 16px' : '8px 16px'};font-size:${ar ? 13.7 : 13.82}px;line-height:22.5px;color:#333"><b style="color:${ink};display:block;margin-bottom:2px">${T.com}</b>${T.comT}</div>`;
  // the bridge, left to right in both languages
  const k = 28.47, wf = [[0, 7.2, dark, '7.2'], [7.2, 8.6, green, '+1.4'], [8.6, 9.4, green, '+0.8'], [9.4, 8.9, red, '-0.5'], [8.9, 7.3, red, '-1.6'], [0, 7.3, dark, '7.3']];
  const wfPx = [[205, 205], [245, 39], [268, 23], [268, 14], [253, 45], [208, 208]];   // [top above the base, height] as published
  let ch = `<div class="h3" style="${S}:${ar ? 893 : 893}px;top:${ar ? 92 : 84}px">${T.bridge}</div>`;
  const cx0 = G.wfX - 12;
  [0, 1, 2, 3].forEach((g) => { ch += `<div class="ab" style="left:${cx0}px;width:560px;top:${G.wfBase - 300 + g * 100}px;height:1px;background:${g === 3 ? '#ddd' : '#eee'}"></div>`; });
  wf.forEach(([from, to, c, lab], i) => { const x = G.wfX + Math.round(i * 91.4), top = G.wfBase - wfPx[i][0], h = wfPx[i][1];
    ch += `<div class="ab" style="left:${x}px;top:${top}px;width:79px;height:${h}px;background:${c}"></div><div class="c" style="left:${x}px;width:79px;text-align:center;top:${top - 18}px;font:700 11.5px Inter;direction:ltr">${lab}</div>`
      + `<div class="c" style="left:${x - 6}px;width:91px;text-align:center;top:${G.wfBase + (ar ? 6 : 8)}px;font-size:12.5px;color:#333">${T.steps[i]}</div>`;
    if (i < 5) { const y = G.wfBase - Math.round(to * k); ch += `<div class="ab" style="left:${x + 79}px;width:12px;top:${y}px;border-top:1.5px dotted #888"></div>`; } });
  ch += `<div class="h3" style="${S}:${ar ? 893 : 893}px;top:${ar ? 478 : 463}px">${T.month}</div>`;
  const act = [169, 176, 186, 179, 190, 193, 183, 190, 196], bud = [170, 173, 177, 177, 180, 184, 180, 184, 187];
  act.forEach((h, i) => { const x = G.mX + Math.round(i * 60.375);
    ch += `<div class="ab" style="left:${x + 11}px;top:${G.mBase - bud[i]}px;width:24px;height:${bud[i]}px;border:2px solid #222;background:#fff;box-sizing:border-box"></div><div class="ab" style="left:${x}px;top:${G.mBase - h}px;width:22px;height:${h}px;background:${dark}"></div>`
      + `<div class="c" style="left:${x - (ar ? 12 : 14)}px;width:50px;text-align:center;top:${G.mBase + (ar ? 4 : 6)}px;font-size:12.5px;color:#555">${T.months[i]}</div>`; });
  const body = `<div class="top"><h1>${T.title}</h1><div class="meta">${T.meta}</div></div><div class="ab" style="left:26px;right:26px;top:${G.rule}px;height:2px;background:#111"></div>${tbl}${ch}`;
  return doc(css, body, dir);
};

// Operations, rebuilt from the published picture (2026-10-04: its source wasn't kept): the KPI tiles with their limit
// colours, the queue line (y at each hour as published), the 48 heatmap cells (colours sampled from the picture) and
// the action list, measured from the pixels.
// the Arabic operations picture was drawn with IBM Plex Sans Arabic's own Latin digits and letters
const PLEX_LATIN = [400, 700].map((w) => `@font-face{font-family:'Plex Latin';font-weight:${w};src:url(${font('ibm-plex-sans-arabic', `ibm-plex-sans-arabic-latin-${w}-normal.woff2`)})}`).join('');
const OPERATIONS = (lang) => {
  const ar = lang === 'ar', dir = ar ? 'rtl' : 'ltr', dy = ar ? 7 : 0;
  const T = ar ? { title: 'المستودع والتوصيل · مباشر', live: 'مباشر · تحديث 08:42:10',
    k: [['طلبات في الانتظار', '312', 'الحد 400'], ['شحنات متأخرة', '27', 'الحد 15'], ['الإرسال في الوقت', '93.8%', 'الهدف 95%'], ['معدل التجهيز/ساعة', '1,140', 'الهدف 1,000'], ['شاحنات على الطريق', '46', 'من 52'], ['حوادث مفتوحة', '3', '1 حرجة']],
    queue: 'الطلبات في الانتظار اليوم · الحد 400', heat: 'نشاط التحميل حسب الرصيف والساعة', dock: (n) => `رصيف ${n}`, act: 'يحتاج إجراء الآن', foot: 'مرتبة حسب التأخير · فقط ما تجاوز حدّه',
    items: ['عطل شاحنة، القوز', 'فات الموعد، العميل مغلق', 'بانتظار المخزون', 'العنوان غير موجود', 'تأخير تحميل، رصيف 3', 'العميل طلب تغيير الموعد', 'السائق تجاوز ساعات الوردية', 'فاتورة ناقصة'], min: (m) => `${m} د` }
    : { title: 'Warehouse & delivery · live', live: 'Live · refreshed 08:42:10',
      k: [['Orders in queue', '312', 'limit 400'], ['Late shipments', '27', 'limit 15'], ['On-time dispatch', '93.8%', 'target 95%'], ['Pick rate / hour', '1,140', 'target 1,000'], ['Trucks on road', '46', 'of 52'], ['Open incidents', '3', '1 critical']],
      queue: 'Orders in queue today · limit 400', heat: 'Loading activity by dock and hour', dock: (n) => `Dock ${n}`, act: 'Needs action now', foot: 'Sorted by delay · only items over their limit',
      items: ['Truck breakdown, Al Quoz', 'Missed slot, customer closed', 'Waiting for stock', 'Address not found', 'Loading delay, dock 3', 'Customer asked to reschedule', 'Driver over shift hours', 'Missing invoice'], min: (m) => `${m} min` };
  const G = '#2ebe67', Rd = '#e5484d', A = '#f59e0b', bg = '#0a111b', card = '#141c27', line = '#38bdf8', mute = '#9ca6b5';
  const css = `${ar ? PLEX_LATIN : ''}body{background:${bg};color:#f3f6f9}
.top{position:absolute;left:26px;right:26px;top:22px;display:flex;justify-content:space-between;align-items:center}
h1{font:700 24px Inter}[dir=rtl] h1{font:700 24px 'Plex Arabic',Inter}.live{font-size:14px;font-weight:700;color:#22c55e;display:flex;align-items:center;gap:7px}.live i{width:8px;height:8px;border-radius:50%;background:#22c55e}
.card{position:absolute;background:${card};border:1px solid #232c39;border-radius:8px}
.kpi{top:${64 + dy}px;width:248px;height:118px;padding:16px 14px;overflow:hidden}.kpi::before{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:var(--c)}
.kpi label{display:block;font-size:13px;font-weight:600;color:#9aa8bd;font-variant-numeric:normal}.kpi b{display:block;font:800 34px Inter;color:#eff7fd;margin-top:6px;line-height:1.1}.kpi small{display:block;margin-top:10px;font-size:11.5px;color:${mute}}
[dir=rtl] .kpi b{text-align:right;font:700 34px/1.1 'Plex Latin';margin-top:12px}[dir=rtl] .kpi small{margin-top:15px}
.hh{position:absolute;font:700 12.6px Inter;letter-spacing:.08em;text-transform:uppercase;color:#9ba4af}[dir=rtl] .hh{font:700 13px 'Plex Arabic';letter-spacing:0}
.ab{position:absolute}[dir=rtl] .pl,[dir=rtl] .live{font-family:'Plex Latin','Plex Arabic'}.t{position:absolute;white-space:nowrap}`;
  const side = ar ? 'right' : 'left';
  const kc = [G, Rd, A, G, G, Rd];
  const kpis = T.k.map(([l, v, s], i) => `<div class="card kpi" style="${side}:${26 + i * 260}px;--c:${kc[i]}"><label>${l}</label><b class="num">${v}</b><small>${s}</small></div>`).join('');
  // the queue line: hourly from 06 to 23, y as published (the picture's pixels)
  const ys = ar ? [331, 376.5, 410, 431, 397.5, 352, 295.5, 274.5, 319.5, 342.5, 364.5, 386.5, 410, 432.5, 443, 449, 452.5, 465.5] : [320.5, 365.5, 399, 421, 388.5, 342.5, 286.5, 264.5, 308.5, 331.5, 354.5, 376.5, 399.5, 421.5, 433, 438.5, 442.5, 456];
  const lx = ar ? 757 : 48, ly = ar ? 10 : 0;
  const pts = ys.map((y, i) => `${(lx + i * 46.765).toFixed(1)},${y}`).join(' ');
  let svg = `<svg class="ab" style="left:0;top:0;overflow:visible" width="1600" height="900">`;
  [238, 322, 406, 490].forEach((y) => { svg += `<line x1="${lx - 7}" x2="${lx + 803}" y1="${y + ly + 0.5}" y2="${y + ly + 0.5}" stroke="#1f2836"/>`; });
  svg += `<line x1="${lx - (ar ? 8 : 7)}" x2="${lx + (ar ? 802 : 803)}" y1="${343 + ly}" y2="${343 + ly}" stroke="#8a94a3" stroke-width="1.3" stroke-dasharray="6 5"/>`;
  svg += `<polyline points="${pts}" fill="none" stroke="${line}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${(lx + 17 * 46.765).toFixed(1)}" cy="${ys[17]}" r="4.6" fill="${line}"/></svg>`;
  const hours = ['06', '09', '12', '15', '18', '21'].map((h, i) => `<div class="t num" style="left:${lx - 20 + i * 140.3}px;width:40px;text-align:center;top:${496 + ly}px;font-size:11.5px;color:${mute}">${h}</div>`).join('');
  // heatmap: 12 hours x 4 docks, colours and cell edges as published
  const HC = [['#1c4968', '#1e5979', '#257097', '#2d8fbe', '#32a5db', '#2b88b4', '#2678a0', '#23688f', '#287fac', '#2e97c7', '#2678a0', '#1e5979'],
    ['#1a415e', '#1e5071', '#2678a0', '#309ed1', '#38bdf8', '#35aee5', '#2d8fbe', '#2678a0', '#2b88b4', '#32a5db', '#287fac', '#215f84'],
    ['#1c4968', '#215f84', '#23688f', '#2b88b4', '#309ed1', '#2d8fbe', '#287fac', '#257097', '#2678a0', '#2d8fbe', '#257097', '#1e5071'],
    ['#183a55', '#1c4968', '#215f84', '#2678a0', '#2d8fbe', '#287fac', '#257097', '#23688f', '#257097', '#287fac', '#23688f', '#1c4968']];
  const hx = ar ? 810 : 102, hy = ar ? 615 : 605;
  let heat = '';
  HC.forEach((row, j) => row.forEach((c, i) => { heat += `<div class="ab" style="left:${Math.floor(hx + i * 62.5)}px;top:${Math.round(hy + j * 59.3)}px;width:61px;height:58px;border-radius:2px;background:${c}"></div>`; }));
  ['08', '10', '12', '14', '16', '18'].forEach((h, i) => { heat += `<div class="t num" style="left:${hx + i * 125}px;width:61px;text-align:center;top:${hy - 19}px;font-size:11.5px;color:${mute}">${h}</div>`; });
  [1, 2, 3, 4].forEach((n, j) => { heat += `<div class="t" style="left:${hx - 90}px;width:${ar ? 80 : 81}px;text-align:right;top:${Math.round(hy + j * 59.3) + 22}px;font-size:11.5px;color:${mute}">${T.dock(n)}</div>`; });
  // the action list
  const codes = ['DXB-4471', 'AUH-2210', 'SHJ-0934', 'DXB-4502', 'DXB-4519', 'AUH-2231', 'SHJ-0951', 'DXB-4533'], mins = [52, 38, 24, 19, 12, 11, 9, 7];
  const ax = ar ? 41 : 893, aw = 665, ay0 = ar ? 242 : 232;
  let acts = '';
  codes.forEach((c, k) => { const y = ay0 + k * (ar ? 51 : 48), col = mins[k] >= 30 ? Rd : A;
    acts += `<div class="ab" style="left:${ax}px;width:${aw}px;top:${y}px;height:${ar ? 51 : 48}px;border-bottom:1px solid #222b38;display:flex;align-items:center;font-size:15px;direction:${dir}">`
      + `<i style="width:11px;height:11px;border-radius:50%;background:${col};margin-${ar ? 'left' : 'right'}:${ar ? 4 : 7}px;margin-${ar ? 'right' : 'left'}:5px"></i><span class="num pl" style="width:${ar ? 203 : 158}px;color:#edf2f7;font-variant-numeric:normal;text-align:${ar ? 'right' : 'left'}">${c}</span>`
      + `<span style="flex:1;color:#97a2b1">${T.items[k]}</span><b class="num pl" style="color:${col};font-size:15px;font-variant-numeric:normal;direction:${dir};margin-${ar ? 'left' : 'right'}:${ar ? 7 : 5}px">${T.min(mins[k])}</b></div>`; });
  const body = `<div class="top"><h1>${T.title}</h1><div class="live"><i></i>${T.live}</div></div>${kpis}
  <div class="card" style="left:${ar ? 735 : 26}px;top:${194 + (ar ? 9 : 0)}px;width:${ar ? 838 : 840}px;height:${ar ? 336 : 339}px"><div class="hh" style="${side}:14px;top:${ar ? 11 : 14}px">${T.queue}</div></div>
  <div class="card" style="left:${ar ? 735 : 26}px;top:${545 + (ar ? 8 : 0)}px;width:${ar ? 838 : 840}px;height:${ar ? 310 : 311}px"><div class="hh" style="${side}:14px;top:11px">${T.heat}</div></div>
  <div class="card" style="left:${ar ? 26 : 878}px;top:${194 + (ar ? 9 : 0)}px;width:${ar ? 696 : 698}px;height:${ar ? 661 : 663}px"><div class="hh" style="${side}:14px;top:${ar ? 11 : 14}px">${T.act}</div></div>
  ${svg}${hours}${heat}${acts}<div class="t" style="${side}:${ar ? 893 : 893}px;top:${ar ? 660 : 626}px;font-size:12px;color:${mute}">${T.foot}</div>`;
  return doc(css, body, dir);
};

// ---------------------------------------------------------------------------------------------------------------
const JOBS = [
  { id: 'redesign', out: 'assets/img/articles/power-bi-redesign-before', html: BEFORE },
  { id: 'redesign', out: 'assets/img/articles/power-bi-redesign-after', html: AFTER },
  ...['en', 'ar'].flatMap((l) => [
    { id: 'executive', out: `assets/img/articles/styles/executive-${l}`, html: EXECUTIVE(l) },
    { id: 'sales', out: `assets/img/articles/styles/sales-${l}`, ...SALES(l) },
    { id: 'marketing', out: `assets/img/articles/styles/marketing-${l}`, ...MARKETING(l) },
    { id: 'service', out: `assets/img/articles/styles/service-${l}`, html: SERVICE(l) },
    { id: 'hr', out: `assets/img/articles/styles/hr-${l}`, html: HR(l) },
    { id: 'finance', out: `assets/img/articles/styles/finance-${l}`, html: FINANCE(l) },
    { id: 'operations', out: `assets/img/articles/styles/operations-${l}`, html: OPERATIONS(l) }])];

const only = process.argv.slice(2);
const exe = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
let failed = 0;
for (const job of JOBS.filter((j) => !only.length || only.includes(j.id))) {
  await page.setContent(job.html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (job.after) await job.after(page);
  // every text-bearing element must sit inside its card and the page; a text box must not be narrower than its text
  const bad = await page.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll('body *')) {
      if (['svg', 'polyline', 'polygon', 'line', 'circle', 'text', 'i', 'u', 'style'].includes(e.tagName.toLowerCase())) continue;
      const r = e.getBoundingClientRect(); if (!r.width) continue;
      if (r.right > 1600.5 || r.bottom > 900.5 || r.left < -0.5) out.push('off page: ' + e.outerHTML.slice(0, 90));
      if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') out.push('clipped: ' + e.outerHTML.slice(0, 90));
      if (e.scrollWidth > e.clientWidth + 1 && e.children.length === 0) out.push('text wider than its box: ' + e.outerHTML.slice(0, 90));
      const card = e.parentElement && e.closest('.card,.box');
      if (card && card !== e) { const c = card.getBoundingClientRect();
        if (r.right > c.right + .5 || r.left < c.left - .5 || r.bottom > c.bottom + .5) out.push('outside its card: ' + e.outerHTML.slice(0, 90)); }
      if (e.matches('.fn,.st')) { const range = document.createRange(); range.selectNodeContents(e); const t = range.getBoundingClientRect();
        if (t.left - r.left < 12 || r.right - t.right < 12) out.push('text too close to its box edge: ' + e.textContent); }
    }
    for (const t of document.querySelectorAll('svg text')) { const r = t.getBoundingClientRect(), s = t.ownerSVGElement.getBoundingClientRect();
      if (r.left < s.left - .5 || r.right > s.right + .5) out.push('axis label clipped: ' + t.textContent); }
    return out;
  });
  if (bad.length) { failed++; console.log(job.out, 'PROBLEMS:\n  ' + bad.join('\n  ')); }
  const jpg = path.join(ROOT, job.out + '.jpg');
  await page.screenshot({ path: jpg, type: 'jpeg', quality: 90 });
  // .webp from the same pixels, encoded by Chromium
  const webp = await page.evaluate(async (src) => { const im = new Image(); im.src = src; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0);
    return c.toDataURL('image/webp', 0.86).split(',')[1]; }, 'data:image/jpeg;base64,' + fs.readFileSync(jpg).toString('base64'));
  fs.writeFileSync(path.join(ROOT, job.out + '.webp'), Buffer.from(webp, 'base64'));
  console.log(`${job.out.padEnd(48)} ${Math.round(fs.statSync(jpg).size / 1024)} KB jpg, ${Math.round(fs.statSync(path.join(ROOT, job.out + '.webp')).size / 1024)} KB webp`);
}
await browser.close();
process.exit(failed ? 1 : 0);
