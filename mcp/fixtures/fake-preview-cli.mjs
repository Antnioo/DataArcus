// S2 tests (test-0.3.1-see-the-result.mjs): a FAKE of Microsoft's `powerbi-report-author preview` (the pinned report
// authoring CLI), as lib/desktop-render.mjs calls it: `preview <folder> --host desktop --screenshot <file> --page <id>
// --scale 1`. It logs every call's arguments, writes a small PNG that changes until the page has "drawn", and answers
// the CLI's JSON envelope ({ data: { ok, screenshots: [{ page, path, mimeType, pid }] } } or { error }), with the pid of
// the fake Desktop (fixtures/fake-desktop-helper.mjs writes it to <log>.pid).
//   node fixtures/fake-preview-cli.mjs '<scenario JSON>' preview <folder> ...
// scenario: { log, stableAfter (captures of a page that change, default 1), failCapture (this capture fails, not
//   retryable), notReadyFor (the first N calls answer "not open yet", retryable), foreignPid (captures come from
//   another Desktop), missingPage (this page id is not found) }
import fs from 'node:fs';
import { PNG } from 'pngjs';

const sc = JSON.parse(process.argv[2] || '{}'), args = process.argv.slice(3);
const opt = (k) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : undefined; };
const say = (o) => { process.stdout.write(JSON.stringify(o) + '\n'); };
const png = (r, g, b) => { const p = new PNG({ width: 8, height: 6 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = r; p.data[i + 1] = g; p.data[i + 2] = b; p.data[i + 3] = 255; } return PNG.sync.write(p); };
const stateFile = sc.log + '.preview.json';
const st = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { calls: 0, pages: [], per: {} };
st.calls++;
fs.appendFileSync(sc.log, JSON.stringify({ op: 'preview', args }) + '\n');
const page = opt('--page'), file = opt('--screenshot');
const save = () => fs.writeFileSync(stateFile, JSON.stringify(st));
if (sc.notReadyFor && st.calls <= sc.notReadyFor) { save(); say({ error: { code: 'HOST_UNAVAILABLE', message: 'No Power BI Desktop instance has this report open yet.', retryable: true } }); process.exit(0); }
if (sc.failCapture && st.calls === sc.failCapture) { save(); say({ error: { code: 'RENDER_FAILED', message: 'snapshot timed out', retryable: false } }); process.exit(0); }
if (sc.missingPage && page === sc.missingPage) { save(); say({ error: { code: 'PAGE_NOT_FOUND', message: 'No page with that id or name.', retryable: false } }); process.exit(0); }
if (!st.pages.includes(page)) st.pages.push(page);
const k = st.pages.indexOf(page), n = st.per[page] || 0;
st.per[page] = n + 1; save();
const b = n >= (sc.stableAfter == null ? 1 : sc.stableAfter) ? png(10 + k * 20, 200, 100) : png((n * 7) % 255, k * 20, 50 + (n % 200));
fs.writeFileSync(file, b);
fs.writeFileSync(sc.log.replace(/\.log$/, `-last-${k}.png`), b);
const pid = Number(fs.readFileSync(sc.log + '.pid', 'utf8')) + (sc.foreignPid ? 1000 : 0);
say({ data: { host: 'desktop', report: { folder: args[1] }, ok: true, screenshots: [{ page, path: file, mimeType: 'image/png', pid }], diagnostics: [{ code: 'LIVE_WINDOW_NOT_RELOADED', severity: 'info' }] } });
