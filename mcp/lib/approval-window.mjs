// DataArcus's own approval window (A-01 of the outside review of rc.14; the owner's rc.16 test in Claude Desktop: the
// app has no MCP elicitation, so approve_plan answered approvedBy "assistant-reported", the assistant's word for the
// person's go). The owner's decision of 14 Oct: the person approves a plan by a click in a page of their own browser,
// which DataArcus opens on their machine; the assistant's reply approves nothing.
// How it holds: the page is served on 127.0.0.1 only, at a link with a one-time secret that is given to the browser
// and never to the assistant (no tool answer holds it); a click is taken only from that page itself (the Host and Origin
// are checked, so another site or a rebound name can't send it); the page shows what the plan writes, every model name
// as plain text. What it can't do: another program on the person's computer (one that controls their browser or mouse,
// or another tool of the AI app that runs commands or reads the browser's history) could click it too.
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { writesNote } from './answers.mjs';   // (R5, F04: the answers file DataArcus wrote is replaced, and said)
import { E } from './design.mjs';             // (D6: the written colour's own contrast, by the engine's rule)

// (0.3.0 step 1, "Preview before Approve": the planned pages drawn by the shared renderer, the lab page's too)
const Preview = createRequire(import.meta.url)('../../assets/js/page-preview.js');
// (D7) a right-to-left waterfall's switch, in the person's words
const Gallery = createRequire(import.meta.url)('../../assets/js/visual-gallery.js');
const wfRtlSaid = (v) => (Gallery.waterfallRtlOf(v) === 'native' ? `native: ${Gallery.WF_WHAT.native} (Power BI's own waterfall, as in English)` : 'mirror: a stacked column chart drawn as a waterfall, read from the right; no Total column, no legend, the base shown in the tooltip');

const windows = new Map();          // planId -> { secret, plan, show, decided: null | 'approve' | 'decline', waiters, opened, seen }
const bySecret = new Map();         // secret -> planId
let server = null, port = 0, starting = null;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cut = (s, n) => { const t = String(s); return t.length > n ? t.slice(0, n) + '…' : t; };

/** The program that opens the page: the system's default browser, or DATAARCUS_BROWSER (a program's path, or a JSON
 *  array of a program and its first arguments; the tests use it for a browser of their own). */
function browserCommand(url) {
  const own = process.env.DATAARCUS_BROWSER;
  if (own) {
    let cmd = own, args = [];
    if (/^\s*\[/.test(own)) { const v = JSON.parse(own); if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== 'string')) throw new Error('DATAARCUS_BROWSER must be a program\'s path or a JSON array of strings'); [cmd, ...args] = v; }
    return [cmd, args.concat(url)];
  }
  // (no shell: the link goes to the program as one argument, never through cmd's parsing of & and ^)
  if (process.platform === 'win32') return ['rundll32.exe', ['url.dll,FileProtocolHandler', url]];
  if (process.platform === 'darwin') return ['open', [url]];
  return ['xdg-open', [url]];
}
function launch(url) {
  return new Promise((resolve) => {
    let child;
    try { const [cmd, args] = browserCommand(url); child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }); }
    catch (e) { resolve(String(e && e.message || e)); return; }
    let done = false; const end = (v) => { if (!done) { done = true; resolve(v); } };
    child.once('error', (e) => end(String(e && e.message || e)));
    child.once('spawn', () => { child.unref(); end(null); });
  });
}

const STYLE = `:root{color-scheme:light dark;--bg:#f4f6fa;--card:#fff;--ink:#14213d;--soft:#5b6478;--line:#dde3ee;--accent:#0f7c90;--accent-ink:#fff;--warn:#8a5a00}
@media (prefers-color-scheme:dark){:root{--bg:#0d1424;--card:#16203a;--ink:#e8edf7;--soft:#a7b1c8;--line:#2a3756;--accent:#33c3d8;--accent-ink:#06202a;--warn:#f0c060}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 "Segoe UI",system-ui,-apple-system,sans-serif}
main{max-width:860px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px;color:var(--soft);text-transform:uppercase;letter-spacing:.04em}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}.lead{color:var(--soft);margin:0 0 16px}
table{width:100%;border-collapse:collapse}td{padding:6px 8px;border-top:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}tr:first-child td{border-top:0}td.k{width:34%;color:var(--soft)}
ul{margin:0;padding-inline-start:20px}li{overflow-wrap:anywhere}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}form{margin:0}
button{font:inherit;font-weight:600;padding:10px 22px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
button.go{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}.note{color:var(--soft);font-size:13px;margin-top:18px}.warn{color:var(--warn)}
.done{font-size:18px;font-weight:600}.sw-i{display:inline-flex;align-items:center;gap:4px;margin:0 10px 4px 0;white-space:nowrap}.sw{display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid var(--line)}
.preview figure{margin:0 0 14px}.preview svg{display:block;width:100%;height:auto;border-radius:6px}.preview figcaption{color:var(--soft);font-size:13px;margin-top:6px}`;

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="same-origin"><title>${esc(title)}</title><style>${STYLE}</style></head><body><main>${body}</main></body></html>`;
}
// (rc.22, B-135: the colours were shown as raw JSON) a value { swatches: [[name, hex]] } is drawn as colour swatches, each
// hex checked to be a colour (no other text reaches the style)
const HEX = /^#[0-9a-f]{6}$/i;
const swatches = (list) => list.filter(([, c]) => HEX.test(String(c))).map(([n, c]) => `<span class="sw-i"><span class="sw" style="background:${c}"></span>${esc(n ? n + ' ' : '')}${esc(c)}</span>`).join(' ');
const rows = (list) => `<div class="card"><table>${list.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td dir="auto">${v && v.swatches ? swatches(v.swatches) : Array.isArray(v) ? `<ul>${v.map((x) => `<li dir="auto">${esc(x)}</li>`).join('')}</ul>` : esc(v)}</td></tr>`).join('')}</table></div>`;

// (R6, the outside audit of 19 Oct, F09 c: the page named the report, not every file) every file a plan writes, by kind,
// counted, each path folded under its group (no script: <details> opens without one)
const GROUPS = [['Bookmarks', /(^|\/)bookmarks\//], ['Pages', /\/page\.json$/], ['Visuals', /\/visual\.json$/], ['Phone layouts', /\/mobile\.json$/], ['Theme', /RegisteredResources\/[^/]+\.json$/i],
  ['Images', /\.(png|jpe?g|gif|svg)$/i], ['Custom visual packages', /(^|\/)CustomVisuals\//], ['Format script', /\.tmdl$/i], ['Project file', /\.pbip$/i], ['Report settings', /./]];
// own: a plan kind's groups, tried first (D6: the twin's month script, the theme file)
export function groupFiles(paths, own) {
  const G = (own || []).concat(GROUPS), out = G.map(([label]) => ({ label, paths: [] }));
  (paths || []).forEach((f) => { const i = G.findIndex(([, re]) => re.test(String(f))); out[i].paths.push(String(f)); });
  return out.filter((g) => g.paths.length);
}
// (0.3.0 S1, B-183: the app's own prompt showed the writes and the overwrite sentence only) the same as the approval page
// says, in short, for the app's prompt (MCP elicitation): the files counted per group, and each colour the plan writes
// other than the one approved. At most PROMPT_SUMMARY_CAP characters: groups past it are counted, never cut mid-word
export const PROMPT_SUMMARY_CAP = 600;
export function promptSummary(kind, data) {
  const d = data || {}, groups = summary(kind, d).files || [], lines = [];
  if (groups.length) {
    const n = groups.reduce((a, g) => a + g.paths.length, 0), parts = groups.map((g) => `${g.label} (${g.paths.length})`);
    let line = `${n} file${n === 1 ? '' : 's'}: `, k = 0;
    while (k < parts.length && line.length + parts[k].length + 40 <= PROMPT_SUMMARY_CAP / 2) { line += (k ? ', ' : '') + parts[k]; k++; }
    if (k < parts.length) line += `${k ? ', ' : ''}and ${parts.length - k} more group${parts.length - k === 1 ? '' : 's'}`;
    lines.push(line + '.');
  }
  const cc = kind === 'report' && d.colours && Array.isArray(d.colours.changed) ? d.colours.changed.filter((c) => HEX.test(String(c.from)) && HEX.test(String(c.to))) : [];
  const card = d.colours && HEX.test(String(d.colours.card)) ? ` against ${d.colours.card}` : '';
  cc.forEach((c) => { const l = `Colour: approved colour ${c.from} -> written colour ${c.to} (contrast ${Number(c.contrast) || '?'}:1${card}, needs 3:1).`; if (lines.join('\n').length + l.length + 1 <= PROMPT_SUMMARY_CAP) lines.push(l); });
  return lines.join('\n');
}
const filesHtml = (groups) => (groups && groups.length ? `<p>${groups.reduce((n, g) => n + g.paths.length, 0)} files:</p><ul>${groups.map((g) => `<li><details><summary>${esc(g.label)} (${g.paths.length})</summary><ul>${g.paths.map((f) => `<li dir="auto">${esc(f)}</li>`).join('')}</ul></details></li>`).join('')}</ul>` : '');

function askPage(w) {
  const s = w.show;
  const sections = s.sections.filter((x) => x.rows.length).map((x) => `<h2>${esc(x.heading)}</h2>${rows(x.rows)}`).join('');
  // (the pictures: SVG markup from the shared renderer, which escapes every name in it; drawn from the plan, never a value)
  const pv = s.previews && s.previews.pages && s.previews.pages.length ? `<h2>What the report will look like</h2><div class="card preview">${s.previews.pages.map((p, i) => {
    const fl = Preview.check(p).concat(p.flags || []).filter((f, k, all) => all.findIndex((g) => g.i === f.i && g.kind === f.kind) === k);
    return `<figure>${Preview.render(p, { lang: s.previews.lang, width: 800 })}<figcaption dir="auto">Page ${i + 1}: ${esc(cut(p.name, 80))}${fl.length ? ` <span class="warn">(${fl.length} to check: ${esc([...new Set(fl.map((f) => Preview.WORDS.en[f.kind]))].join(', '))})</span>` : ''}</figcaption></figure>`; }).join('')}<p class="note">A preview drawn from the plan: where each visual goes, its type and its title. The grey shapes are placeholders, not your data: DataArcus reads files on your machine to check and fingerprint them, and never returns data values to Claude.</p></div>` : '';
  // (0.3.0 step 2: the check of the planned pages, before Approve: what Power BI Desktop would show; every text escaped)
  const ck = s.previews && s.previews.check, ckHtml = ck ? `<h2>Checked before writing</h2><div class="card"><p class="${ck.desktop ? 'warn' : ''}"><strong>${esc(ck.summary)}</strong></p>${ck.problems && ck.problems.length ? `<ul>${ck.problems.map((f) => `<li dir="auto">${esc(f.page ? `Page ${f.page}: ` : '')}${esc(f.visual || '')}${f.visual ? ': ' : ''}${esc(f.what)}. <span class="note">${esc(f.fix)}</span></li>`).join('')}</ul>` : ''}<p class="note">The measured rules of what Power BI Desktop draws and the layout check, run on the planned pages (structure only, never data). The report is checked again when it is written.</p></div>` : '';
  return page('Approve: ' + s.title, `<h1>${esc(s.title)}</h1><p class="lead">DataArcus asks before it writes anything. Nothing has been written yet. Check the plan, then approve it or not.</p>
${pv}${ckHtml}<h2>Files that will be written</h2><div class="card"><ul>${w.plan.writes.map((x) => `<li dir="auto">${esc(s.name ? String(x).split('<name>').join(s.name) : x)}</li>`).join('')}</ul>${s.lostNote ? `<p><strong>${esc(s.lostNote)}</strong></p>` : ''}${filesHtml(s.files)}<p class="note">${esc(writesNote(w.plan.writes))}</p></div>
${sections}
<div class="actions"><form method="post"><input type="hidden" name="decision" value="approve"><button class="go" type="submit">Approve</button></form>
<form method="post"><input type="hidden" name="decision" value="decline"><button type="submit">Not now</button></form></div>
<p class="note">Plan ${esc(w.plan.id)}. Only a click here approves it: what is typed in the chat does not. Approve only a plan you asked for.</p>`);
}
const donePage = (w) => page(w.decided === 'approve' ? 'Approved' : 'Not approved', w.decided === 'approve'
  ? `<p class="done">Approved.</p><p>Go back to Claude: it can now write the files of plan ${esc(w.plan.id)}. You can close this tab.</p>`
  : `<p class="done">Not approved.</p><p>Nothing will be written for plan ${esc(w.plan.id)}. Tell Claude what to change. You can close this tab.</p>`);
const gonePage = () => page('Not available', '<p class="done">This approval link is no longer valid.</p><p>It was used, or its plan expired or was made in another session of DataArcus. Ask Claude to make the plan again.</p>');

function headers(res, code, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" });
}

function onRequest(req, res, decide) {
  const here = `127.0.0.1:${port}`;
  // (DNS rebinding: a page of another name that resolves to 127.0.0.1 sends its own Host)
  if (req.headers.host !== here) { headers(res, 421, 'text/plain; charset=utf-8'); res.end('Wrong host'); return; }
  const m = /^\/approve\/([A-Za-z0-9_-]{20,64})$/.exec((req.url || '').split('?')[0]);
  const id = m && bySecret.get(m[1]), w = id && windows.get(id);
  if (!w || (w.expires && Date.now() > w.expires)) { headers(res, 404); res.end(gonePage()); return; }
  if (req.method === 'GET') { w.seen = true; headers(res, 200); res.end(w.decided ? donePage(w) : askPage(w)); return; }
  if (req.method !== 'POST') { headers(res, 405, 'text/plain; charset=utf-8'); res.end('Method not allowed'); return; }
  // (a click comes only from the page itself: its Origin, or, when a browser sends none or "null", Sec-Fetch-Site
  // same-origin, which a web page can't set. The referrer policy is same-origin, not no-referrer: with no-referrer
  // Chromium sends Origin "null" on the form's POST, found by a real click in Chromium, 14 Oct)
  const origin = req.headers.origin, site = req.headers['sec-fetch-site'];
  if (!(origin === 'http://' + here || ((!origin || origin === 'null') && site === 'same-origin'))) { headers(res, 403, 'text/plain; charset=utf-8'); res.end('Refused: the click must come from the DataArcus page itself.'); return; }
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (c) => { body += c; if (body.length > 1000) req.destroy(); });
  req.on('end', () => {
    const d = new URLSearchParams(body).get('decision');
    if (!w.decided && (d === 'approve' || d === 'decline')) decide(w, d);
    headers(res, w.decided ? 200 : 400); res.end(w.decided ? donePage(w) : gonePage());
  });
}

async function listen(decide) {
  if (server) return;
  if (!starting) starting = new Promise((resolve, reject) => {
    const s = http.createServer((req, res) => { try { onRequest(req, res, decide); } catch (e) { try { headers(res, 500, 'text/plain; charset=utf-8'); res.end('Error'); } catch (x) { /* closed */ } } });
    s.once('error', (e) => { starting = null; reject(e); });
    s.listen(0, '127.0.0.1', () => { server = s; port = s.address().port; s.unref(); resolve(); });
  });
  await starting;
}

/** Opens (or, with reopen, opens again) the approval window of a plan. plan: { id, kind, writes }; show: { title,
 *  sections: [{ heading, rows: [[label, value | [values]]] }] }; expires: when the plan expires (ms); onDecide(id,
 *  decision): called once, on the click. Returns { opened: true } or { opened: false, why }. */
export async function open(plan, show, expires, onDecide, reopen) {
  await listen((w, d) => { w.decided = d; try { onDecide(w.plan.id, d); } catch (e) { w.decided = null; return; } w.waiters.splice(0).forEach((f) => f(d)); });
  let w = windows.get(plan.id);
  if (w && w.decided) return { opened: false, why: 'decided' };
  if (!w) {
    const secret = crypto.randomBytes(24).toString('base64url');
    w = { secret, plan: { id: plan.id, kind: plan.kind, writes: plan.writes.slice() }, show, expires, decided: null, waiters: [], opened: false, seen: false };
    windows.set(plan.id, w); bySecret.set(secret, plan.id);
  } else if (w.opened && !reopen) return { opened: true, again: false };
  const why = await launch(`http://127.0.0.1:${port}/approve/${w.secret}`);
  if (why) return { opened: false, why };
  w.opened = true;
  return { opened: true, again: !!reopen };
}

/** Waits up to ms for the click on a plan's window: 'approve', 'decline', or null (no click yet). */
export function wait(id, ms) {
  const w = windows.get(id);
  if (!w) return Promise.resolve(null);
  if (w.decided) return Promise.resolve(w.decided);
  return new Promise((resolve) => {
    const f = (d) => { clearTimeout(t); resolve(d); };
    const t = setTimeout(() => { const i = w.waiters.indexOf(f); if (i >= 0) w.waiters.splice(i, 1); resolve(null); }, Math.max(0, ms));
    w.waiters.push(f);
  });
}

/** What the window of a plan knows: null (none), or { opened, seen, decided }. */
export function state(id) { const w = windows.get(id); return w ? { opened: w.opened, seen: w.seen, decided: w.decided } : null; }

/** Forgets a plan's window (its link answers "no longer valid" from then on). */
export function close(id) { const w = windows.get(id); if (w) { bySecret.delete(w.secret); windows.delete(id); w.waiters.splice(0).forEach((f) => f(null)); } }

const KIND_NAME = { bar: 'Bar chart', column: 'Column chart', line: 'Line chart', donut: 'Donut chart', table: 'Table' };
const KIND_A = { bar: 'a bar chart', column: 'a column chart', line: 'a line chart', donut: 'a donut chart', table: 'a table' };
/** The plan as the window shows it: every input the plan pins, by name, as plain text (A-01: the person sees what the
 *  click approves). kind: the plan's kind; data: the plan's data (its pins, the twin's labels). */
export function summary(kind, data) {
  const d = data || {}, pins = d.pins || {}, sections = [];
  // (R6, F09 f: a long value was cut at 600 characters) every value in full
  const val = (v) => (v == null ? '' : typeof v === 'string' ? v : typeof v === 'boolean' ? (v ? 'yes' : 'no') : JSON.stringify(v));
  const files = Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Metric switcher script', / - metric switcher\.tmdl$/i]]) : null;   // (L3: the switch's own script)
  if (kind === 'report') {
    const p = pins.create_report || {}, L = (p.design && p.design.layout) || {};
    const T = { title: 'Report' + (p.name ? ` "${cut(p.name, 80)}"` : ''), name: p.name || null, previews: d.preview && Array.isArray(d.preview.pages) ? d.preview : null, files };
    sections.push({ heading: 'Report', rows: [['Name', p.name], ['Title', p.title || (p.name ? '(the report\'s name)' : '')], ['Language', p.lang === 'ar' ? 'Arabic (right to left)' : 'English'],
      ['Page size', p.page ? val(p.page) : L.page || (p.pages ? '' : '1920x1080')], p.customVisualsFrom != null ? ['Copy of the report', p.customVisualsFrom] : null].filter((r) => r && r[1] !== undefined && r[1] !== '').map(([k, v]) => [k, val(v)]) });
    // (rc.24, B-140: the page said "Column chart by" for the chart written as a bar chart) the kind each chart is written
    // as, with the reason when the writer changed it (the plan's data: kinds [{ role, from, to }], plan_layout's lint)
    const kinds = Array.isArray(d.kinds) ? d.kinds : [], changeOf = (from) => kinds.find((k) => k && k.from === from);
    // (R6, F09 d) the lint's own measured why when the plan holds it (#64), else the general reason
    const why = (k) => `planned as ${KIND_A[k.from] || 'another kind'}: ${k.why ? String(k.why) : k.to === 'donut' ? 'its category has two values' : 'the names would slant or be cut'}`;
    if (p.design) sections.push({ heading: 'Layout', rows: [['Layout', { exec: 'Executive summary', analysis: 'Analysis', ops: 'Operations monitor', focus: 'Single focus' }[L.preset] || L.preset], ['KPI cards', L.kpis], ['Filters', L.filters ? String(L.filters) : 'none'], ['Header', L.header === false ? 'no' : 'yes'], ['Second page', p.secondPage === false ? 'no' : 'yes, with page buttons']].filter((r) => r[1] !== undefined).map(([k, v]) => [k, val(v)])
      .concat(kinds.length ? [['Written as another kind', kinds.map((k) => `${k.role || 'A chart'}: ${KIND_NAME[k.to] || 'another kind'} (${why(k)})`)]] : []) });
    // category is the bar chart's field, category2 the column chart's
    const F = p.fields || {}, FL = { kpis: 'KPI cards', measure: 'Charts\' measure', timeAxis: 'Trend axis', category: 'Bar chart by', category2: 'Column chart by', table: 'Table', slicers: 'Slicers' }, PLANNED = { category: 'bar', category2: 'column' };
    const fr = Object.keys(FL).filter((k) => F[k] !== undefined).map((k) => { const v = Array.isArray(F[k]) ? F[k].map(String) : String(F[k]), c = PLANNED[k] && changeOf(PLANNED[k]);
      return c ? [`${KIND_NAME[c.to] || 'Chart'} by`, `${v} (${why(c)})`] : [FL[k], v]; });
    sections.push({ heading: 'Fields', rows: fr.length ? fr.concat(Object.keys(F).length < Object.keys(FL).length ? [['Other visuals', 'chosen by DataArcus from the model']] : []) : [['All visuals', 'chosen by DataArcus from the model' + (p.focus ? ` (focus: ${val(p.focus)})` : '') + (p.tables ? ` (tables: ${val(p.tables)})` : '')]] });
    if (p.pages) sections.push({ heading: 'Pages', rows: p.pages.map((pg, i) => [`Page ${i + 1}: ${cut(pg.name, 80)}`, (pg.slots || []).map((s) => `${s.kind}${s.title ? `: ${s.title}` : ''}${s.text ? ` "${cut(s.text, 120)}"` : ''}`).concat(pg.background ? [`background: ${pg.background}`] : [])]) });
    if (p.displayNames && Object.keys(p.displayNames).length) sections.push({ heading: 'Names shown in the report', rows: Object.entries(p.displayNames).map(([k, v]) => [k, String(v)]) });
    // (0.3.0 R2: an Arabic report's texts are Arabic, or listed here with why before the go) the fields kept in English
    if (Array.isArray(d.notTranslated) && d.notTranslated.length) sections.push({ heading: `Shown in English (${d.notTranslated.length}, no Arabic name)`, rows: d.notTranslated.map((x) => [String(x.field), String(x.why || '')]) });
    // (D1) a right-to-left report's waterfalls: what each is written as, before the click
    if (Array.isArray(d.waterfallRtl) && d.waterfallRtl.length) sections.push({ heading: `Waterfalls, right to left (${d.waterfallRtl.length})`, rows: d.waterfallRtl.map((x) => [`${cut(String(x.page || ''), 60)}${x.title ? `: ${cut(String(x.title), 80)}` : ''}`, `${String(x.written || '')}: ${String(x.what || '')}${x.why ? ` (${String(x.why)})` : ''}`]) });
    // (0.3.0 L4) the flip cards: which cards, what their back says, the bookmarks, the model change, before the click
    const FC = d.flipCards && Array.isArray(d.flipCards.cards) ? d.flipCards : null;
    if (FC && FC.cards.length) sections.push({ heading: `Flip cards (${FC.cards.length})`, rows: FC.cards.map((c) => [`${cut(String(c.page || ''), 60)}: card ${c.card}`, `${cut(String(c.title || ''), 80)}: the front shows its title and value; the back shows the measure's name and one line: ${String((c.back || {}).description || '')}; ${String((c.back || {}).value || '')}; year on year: ${String((c.back || {}).yearOnYear || '')}`])
      .concat([['Bookmarks', `${FC.bookmarks} display-only bookmarks (two a card: one shows the back, one the front); they touch no slicer or filter`],
        ['Model change', `${FC.newMeasures} new measures (the pictures) in the script "${String(FC.scriptAfterGo || '')}" next to the project. The model is not changed by DataArcus: apply the script first, in TMDL view (Preview, then Apply); until then the cards are empty pictures`],
        ['How it turns', 'a click turns the card (Ctrl+click while editing in Desktop), in 0.3 s; the backdrop in the card colour stays behind both faces']],
      (FC.notFlipped || []).map((x) => [`Card ${x.card}`, `not flipped: ${String(x.why || '')}`])) });
    // (the options by their names in the report's words; a bar colour left out is the default the plan says)
    const LK = { gallery: 'Visual gallery', theme: 'Theme file', logo: 'Logo', colors: 'Colours', chartColors: 'Bar colours', chartAxes: 'Chart axes', kpiValues: 'KPI values', noDataMessage: 'Message when there is no data', slidePanel: 'Filters in a slide-in panel', smoothLines: 'Smooth lines', slicerStyle: 'Slicer style', grid: 'Gridlines', flipCards: 'Flip cards', waterfallRtl: 'Waterfall, right to left', font: 'Font', rtl: 'Right to left', dir: 'Reading direction' };
    const bars = p.chartColors !== undefined && p.chartColors !== null ? p.chartColors : p.pages ? 'solid' : p.design ? 'gradient' : null;
    const look = Object.keys(LK).filter((k) => k !== 'chartColors' && p[k] !== undefined && p[k] !== null && (k !== 'waterfallRtl' || p.lang === 'ar' || p.dir === 'rtl' || p.rtl === true)).map((k) => [LK[k], k === 'waterfallRtl' ? wfRtlSaid(p[k]) : k === 'kpiValues' && p[k] === 'auto' ? 'auto (short, like 28.01M, when the number is long)' : k === 'smoothLines' ? (p[k] === false ? 'no: straight lines, no dots' : 'yes: smooth curves that never swing past the data, a dot on each point') : k === 'gallery' ? (p[k] === true ? 'yes: every kind whose fields fit' : p[k] === false ? 'no' : `yes: ${[].concat(p[k]).join(', ')}`) : k === 'slicerStyle' ? (p[k] === 'pills' ? 'pills: rounded buttons for a field of 2-6 values known from the model; a rounded dropdown for the others' : 'dropdown, rounded') : k === 'grid' ? ({ solid: 'solid, quiet', dotted: 'dotted, light grey', none: 'none' })[p[k]] || val(p[k]) : k === 'flipCards' ? (p[k] === true ? 'yes: every KPI card' : Array.isArray(p[k]) ? `yes: card${p[k].length === 1 ? '' : 's'} ${p[k].join(', ')}` : 'no') : k === 'colors' && typeof p[k] === 'object' ? { swatches: Object.entries(p[k]).map(([n, c]) => [n, String(c)]) } : val(p[k])]);
    // the report's real data colours, as the theme will have them (the plan's design)
    // (R6, F13: the accessibility step changed a colour after the go, and said so only after the write) the colour the
    // report is written with, from the plan's own build, and why, before the click
    const cc = d.colours && Array.isArray(d.colours.changed) ? d.colours.changed : [];
    // (D6, the laptop proof of rc.2: the swatch showed the approved colour beside the line saying another is written) the
    // swatches are the written colours; the line names the approved one
    const written = (c, i) => { const x = i === 0 && cc.find((k) => String(k.from).toLowerCase() === String(c).toLowerCase()); return x ? String(x.to) : String(c); };
    const dc = p.design && Array.isArray(p.design.data) ? p.design.data : null;
    if (dc) look.push(['Data colours', { swatches: dc.map((c, i) => ['', written(c, i)]) }]);
    const own = (c) => (HEX.test(String(c.to)) && HEX.test(String(d.colours.card)) ? `; the written colour's own contrast: ${E.contrast(String(c.to), String(d.colours.card)).toFixed(2)}:1` : '');
    cc.forEach((c) => look.push(['The first data colour, made readable', `approved colour ${String(c.from)} -> written colour ${String(c.to)}: contrast ${c.contrast}:1 against the visuals' background ${String(d.colours.card || '')}, needs 3:1 for a data colour${own(c)} (Power BI's accessibility basics; the hue is kept)`]));
    if (bars) look.unshift([LK.chartColors, bars === 'gradient' ? 'each bar fades by its value; a chart by a second category field gets a second colour, the same on every page' : 'one colour for every bar']);
    sections.push({ heading: 'Look and options', rows: look });
    // (L3) the metric switcher: the measures and their labels, the charts that switch, and the model change it needs
    const ms = d.metricSwitcher && typeof d.metricSwitcher === 'object' ? d.metricSwitcher : null;
    const CK = { bar: 'Bar chart', line: 'Line chart' };
    if (ms) sections.push({ heading: 'Metric switcher', rows: [['Page', String(ms.page || '')]]
      .concat((Array.isArray(ms.measures) ? ms.measures : []).map((x, i) => [`Metric ${i + 1}: ${cut(String(x.field), 120)}`, `shown as "${cut(String(x.label), 100)}"`]))
      .concat([['Charts that switch', (Array.isArray(ms.charts) ? ms.charts : []).map((c) => `${CK[c.kind] || 'Chart'} by ${String(c.by)}`)]], (ms.notSwitched || []).length ? [['Not on the page', ms.notSwitched.map(String)]] : [],
        [['Title with nothing chosen', String(ms.fallbackTitle || '')], ['Model change', String(ms.modelChange || '')], ['Script file', String(ms.script || '')], ['Before the script is applied', String(ms.beforeApplied || '')], ['Saved selection', String(ms.savedSelection || '')]]) });
    // (0.3.0 D2) each gallery visual the user asked for: what is written and why (the writer's rule on the fields), and
    // how the preview draws it
    const GN = { combo: 'Combo (line and clustered column)', waterfall: 'Waterfall', smallMultiples: 'Small multiples' };
    const gl = Array.isArray(d.gallery) ? d.gallery : [];
    if (gl.length) sections.push({ heading: 'Visual gallery', rows: gl.map((g) => [`${GN[g.kind] || 'A gallery visual'}${g.title ? `: ${cut(g.title, 80)}` : ''}`, `written as ${g.written === g.kind ? (GN[g.kind] || g.kind).toLowerCase() : String(g.written)}: ${String(g.why || '')}`])
      .concat([['Preview', 'the preview draws a waterfall and small multiples as a column-chart placeholder, a combo as a line-chart placeholder']]) });
    const other = ['pageFilters', 'text', 'subtitles', 'svgColumns', 'svgCards'].filter((k) => p[k] !== undefined && p[k] !== null);
    if (other.length) sections.push({ heading: 'More', rows: other.map((k) => [k, val(p[k])]) });
    // (R6, F09 a: the replacements were shown as JSON cut at 600 characters) each replacement and everything it loses
    if (Array.isArray(d.customVisualsShown)) sections.push({ heading: `Custom visuals replaced (${d.customVisualsShown.length})`, rows: d.customVisualsShown.map((x) => [String(x.line), (x.lost || []).length ? (x.lost || []).map((l) => 'loses ' + String(l)) : ['loses nothing it shows']]) });
    else if (d.customVisuals) sections.push({ heading: 'Custom visuals replaced', rows: [['Replacements', val(d.customVisuals)]] });
    // (J14, the owner's decision of 19 Oct) what the check before writing could not cover, said before the click
    const NC = { validator: 'Microsoft\'s validator', references: 'Fields against the model', rules: 'Measured rules', lint: 'Layout check' };
    const nc = d.exact && Array.isArray(d.exact.notChecked) ? d.exact.notChecked : [];
    if (nc.length) sections.unshift({ heading: 'Not checked before writing', rows: nc.map((n) => [NC[n.check] || 'A check', `not run: ${String(n.why || '')}. The rest of the report was checked (all ${d.exact.pages || 'its'} pages).`]) });
    return Object.assign(T, { sections });
  }
  // (0.3, J13 redesign step 2; the laptop's PROOF-rc24 block 2 (b): step 1's page showed the plan's fields, not what was
  // dropped) a redesign's page lists every change (page, visual, from, to), every visual not changed with why, and what
  // is copied as it is
  if (kind === 'redesign') {
    const S = d.shown || {}, pages = Array.isArray(S.pages) ? S.pages : [], K = S.keptAsIs || {};
    const at = (b) => (b ? `${b.x}, ${b.y}, ${b.w} x ${b.h}` : '');
    // (R6, F08: a visual by its kind, fields and place, never its title text)
    const of = (c) => `${cut(c.type, 40)}${Array.isArray(c.fields) && c.fields.length ? ` of ${c.fields.join(', ')}` : ''}${c.place ? ` at ${c.place}` : ''}`;
    // (0.3.0 D4) a unit on one line: the visuals laid on it, each by its kind and fields, and where it goes with it
    const overlaid = (c) => (Array.isArray(c.overlays) && c.overlays.length ? `with what lies on it, ${c.from || c.overlays.some((o) => o.from) ? 'moved' : 'kept'} with it: ${c.overlays.map((o) => `${cut(o.visual, 60)} (${of(Object.assign({}, o, { place: null }))})${o.from ? ` to ${at(o.to)}` : ''}`).join('; ')}` : null);
    const changes = pages.flatMap((p) => (p.changes || []).map((c) => [`${cut(p.page, 60)}: ${cut(c.visual, 60)} (${of(c)})`,
      [c.from ? `moves from ${at(c.from)} to ${at(c.to)}` : null, c.narrower ? cut(c.narrower, 200) : null, c.title && typeof c.title === 'object' ? `its title becomes "${String(c.title.to)}"` : null, overlaid(c)].filter(Boolean).join('; ')]));
    if (S.theme && S.theme.tokens) Object.entries(S.theme.tokens).forEach(([k, v]) => changes.push([`Theme ${cut(S.theme.file, 60)}: ${k}`, Array.isArray(v) ? { swatches: v.map((c) => ['', String(c)]) } : /^#[0-9a-f]{6}$/i.test(String(v)) ? { swatches: [['', String(v)]] } : val(v)]));
    const notChanged = pages.flatMap((p) => (p.why ? [[`${cut(p.page, 60)} (the whole page)`, cut(p.why, 200)]] : []).concat((p.notChanged || []).filter((x) => !(p.why && /tooltip page/.test(x.why))).map((x) => [`${cut(p.page, 60)}: ${cut(x.visual, 60)} (${of(x)})`, [cut(x.why, 200), overlaid(x)].filter(Boolean).join('; ')])));
    const n = (k, one, many) => (K[k] ? [[many[0].toUpperCase() + many.slice(1), `${K[k]} ${K[k] === 1 ? one : many}`]] : []);
    sections.push({ heading: 'Report', rows: [['Original', S.original || ''], ['New report', S.newReport || ''], ['Method', 'a copy of the original, file for file, with only the changes below']].map(([k, v]) => [k, val(v)]) });
    sections.push({ heading: `Changes (${changes.length})`, rows: changes });
    sections.push({ heading: `Not changed (${notChanged.length})`, rows: notChanged });
    sections.push({ heading: 'Kept as it is', rows: [].concat(n('pages', 'page', 'pages'), n('bookmarks', 'bookmark', 'bookmarks'), n('buttons', 'button', 'buttons'), n('reportFilters', 'report filter', 'report filters'), n('pageFilters', 'page filter', 'page filters'),
      n('visualFilters', 'visual filter', 'visual filters'), n('slicerSelections', 'slicer selection', 'slicer selections'), n('tooltipLinks', 'tooltip link', 'tooltip links'), n('tooltipPages', 'tooltip page', 'tooltip pages'), n('drillthroughPages', 'drillthrough page', 'drillthrough pages'),
      n('interactions', 'visual interaction', 'visual interactions'), n('groups', 'group', 'groups'), n('customVisuals', 'custom visual', 'custom visuals'), n('phoneLayouts', 'phone layout', 'phone layouts'), n('resources', 'resource file', 'resource files'),
      [['How', 'copied as they are: their contents (filter values, slicer selections, bookmark states) are not read']]) });
    return { title: 'Redesign of a report', sections, files, lostNote: d.copied ? `Nothing is left out: all ${d.copied} files of the original are copied, with only the changes below (the copy is checked before it is written, and a missing file stops the write). The redesign writes no format script and no theme file of its own.` : null };
  }
  if (kind === 'twin') {
    const labels = Object.entries(d.labels || {});
    sections.push({ heading: 'Options', rows: [['Time axis right to left', val(d.timeRightToLeft)], ['Arabic month column', val(d.arabicMonth)], ['Mirror picture pages', val(d.mirrorPicturePages)], ['Waterfall, right to left', wfRtlSaid(d.waterfallRtl)]] });
    sections.push({ heading: `Arabic texts (${labels.length})`, rows: labels.map(([k, v]) => [(d.names && d.names[k]) || 'A text of the report', String(v)]) });   // (rc.22, B-139: named, never by internal ids)
    // (0.3.0 D3) every text the twin shows in English, with why, before the click
    if (Array.isArray(d.notTranslated) && d.notTranslated.length) sections.push({ heading: `Shown in English (${d.notTranslated.length}, no Arabic text)`, rows: d.notTranslated.map((x) => [String(x.field), String(x.why || '')]) });
    // (0.3.0 X1) one report holding both languages: the copy, every page pair, the language buttons, the slicers in sync
    const LG = d.languages && typeof d.languages === 'object' ? d.languages : null;
    if (LG) {
      const pairs = Array.isArray(LG.pairs) ? LG.pairs : [], btns = Array.isArray(LG.buttons) ? LG.buttons : [], sg = Array.isArray(LG.syncGroups) ? LG.syncGroups : [], T = LG.tabs || {};
      const pg = (x) => `"${String((x && x.name) || '')}"${x && x.hidden ? ' (hidden in the tabs)' : ''}`;
      sections.unshift({ heading: 'One report, English and Arabic', rows: [['New report', String((LG.copy || {}).report || '')], ['Project file', String((LG.copy || {}).pbip || '')], ['The original', 'only read: not changed'],
        ['Tabs shown', String(T.shown || '')], ['Hidden in the tabs', String(T.hidden || '')], ['Tooltip pages', String(T.tooltipPages || '')], ['What a reader sees', String(T.service || '')], ['Bookmarks', String(LG.bookmarks || 'none')]]
        .concat((Array.isArray(LG.measures) ? LG.measures : []).map((m) => ['Report measure', `${String(m.arabic)} for the Arabic pages; ${String(m.measure)} stays for the English pages`])) });
      sections.splice(1, 0, { heading: `Page pairs (${pairs.length})`, rows: pairs.map((x, i) => [`${i + 1}. English ${pg(x.english)}`, `Arabic ${pg(x.arabic)}${x.tooltip ? ' (tooltip pages)' : x.drillthrough ? ' (drillthrough pages)' : ''}`]) },
        { heading: `Language buttons (${btns.length})`, rows: btns.map((b) => [`${String(b.on)} page "${String(b.page)}"`, b.placed ? `«${String(b.text)}» at ${String(b.at || '')}, goes to its ${b.on === 'English' ? 'Arabic' : 'English'} page; ${b.phone ? 'on the phone layout too' : `not on the phone layout${b.why ? ': ' + String(b.why) : ''}`}` : `not placed: ${String(b.why || '')}`]) },
        { heading: `Slicers kept in sync (${sg.length})`, rows: sg.map((x) => [`Page "${String(x.page)}": slicer ${String(x.slicer)}`, `with its Arabic copy ${String(x.arabicSlicer || '')}, sync group "${String(x.group)}"${x.kept ? ` (${String(x.kept)})` : ''}`]) });
    }
    return { title: LG ? 'English and Arabic in one report' : 'Arabic twin of a report', sections, files: Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Arabic month script', /\.tmdl$/i]]) : null };
  }
  // (D6, the laptop proof of rc.2: the theme's page showed name, lang and path) the colours it writes, as swatches with
  // their hex, and the report they come from
  if (kind === 'theme' && d.colours && typeof d.colours === 'object') {
    const C = d.colours, src = d.source && typeof d.source === 'object' ? d.source : null, one = (c) => ({ swatches: [['', String(c)]] });
    const from = !src ? null : src.from === 'visuals' ? `from the colours on the visuals of report "${String(src.report)}"`
      : `from the theme of report "${String(src.report)}" (${String(src.theme)})${src.from === 'theme and visuals' ? ' and the colours on its visuals' : ''}`;
    sections.push({ heading: 'Colours', rows: [from ? ['Where they come from', from] : null, ['Data colours', { swatches: (Array.isArray(C.data) ? C.data : []).map((c, i) => [String(i + 1), String(c)]) }],
      ['Page', one(C.page)], ['Visuals', one(C.visuals)], ['Text', one(C.text)], ['Accent', one(C.accent)], C.mode ? ['Mode', C.mode === 'dark' ? 'dark' : 'light'] : null].filter(Boolean) });
  }
  const titles = { theme: 'Theme file', scripts: 'Model fix scripts', calendar: 'Gulf calendar script' };
  const own = Object.values(pins)[0] || {}, shownAnswers = Array.isArray(d.answersShown) ? d.answersShown : null;
  sections.push({ heading: 'Inputs', rows: Object.entries(own).filter(([k, v]) => v !== undefined && v !== null && !(k === 'answers' && shownAnswers)).map(([k, v]) => [k, val(v)]) });
  // (R6, F09 f: a long answers list was cut at 600 characters, as hashes) every question with the answer recorded for it
  if (shownAnswers && shownAnswers.length) sections.push({ heading: `Answers to record (${shownAnswers.length})`, rows: shownAnswers.map((x) => [String(x.object || ''), `${x.answer === 'mistake' ? 'a mistake' : 'intended'} (the question: ${String(x.question || '')})`]) });
  return { title: titles[kind] || 'Plan', sections, files: kind === 'theme' && Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Theme file', /\.json$/i]]) : files };
}
