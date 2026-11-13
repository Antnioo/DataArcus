// Shared helpers for the browser tests: a small web server for the site folder,
// the browser, and pages with the CDN served from node_modules and analytics blocked.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// (0.3.1 GD1) the design the Theme Generator saved on a first visit before glass became its default (visitor's plainDesign)
const PLAIN_DESIGN = JSON.stringify(createRequire(import.meta.url)('../../assets/js/design-engine.js').repairState(null));

// (SQ15c, Q1-S5: a report, never a gate) DA_WEB_COVERAGE=<folder> (scripts/coverage-web.mjs sets it): every page a test
// opens records Chromium's JS coverage (page.coverage) from its first script to its close; the engines' entries
// (assets/js/*.js, the translations' data files not) are written to <folder> in Node's V8 coverage format, each named by
// its source file, for c8 to report. The server then sends an engine's source for its .min.js (the pages load the
// minified file; CI checks it is what the source gives), so the counts are the source's lines and branches.
const COVERAGE = process.env.DA_WEB_COVERAGE ? path.resolve(process.env.DA_WEB_COVERAGE) : null;
const ENGINE = /^\/assets\/js\/([^/]+?)(?:\.min)?\.js$/;
const covered = new Set();
let covFiles = 0;
async function coverageStart(pg) { await pg.coverage.startJSCoverage({ resetOnNavigation: false }); covered.add(pg); }
async function coverageStop(pg) {
  if (!covered.delete(pg)) return;
  let list; try { list = await pg.coverage.stopJSCoverage(); } catch (e) { return; }   // a page that crashed or closed itself: nothing to write
  const result = list.map((e) => { const m = ENGINE.exec(new URL(e.url, 'http://x').pathname), f = m && path.join(ROOT, 'assets/js', m[1] + '.js');
    return f && fs.existsSync(f) ? { scriptId: e.scriptId, url: pathToFileURL(f).href, functions: e.functions } : null; }).filter(Boolean);
  if (!result.length) return;
  fs.mkdirSync(COVERAGE, { recursive: true });
  fs.writeFileSync(path.join(COVERAGE, `coverage-web-${process.pid}-${++covFiles}.json`), JSON.stringify({ result }));
}
// the pages still open at the end (run-all calls it before closing the browser)
export const flushCoverage = () => Promise.all([...covered].map(coverageStop));

// How long to wait for something the page does itself (build the language switcher, translate, lay out). Generous,
// because a busy machine can be many times slower; a wait that runs out is still a failure, just a later one.
export const WAIT = 30000;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };

// Serves the site like GitHub Pages: folders open index.html, unknown paths get 404.html
export function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const eng = COVERAGE && /\.min\.js$/.test(p) && ENGINE.exec(p);
    if (eng && fs.existsSync(path.join(ROOT, 'assets/js', eng[1] + '.js'))) file = path.join(ROOT, 'assets/js', eng[1] + '.js');
    if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(ROOT, '404.html'))); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}

// CHROME_PATH wins; otherwise a preinstalled Chromium, installed Google Chrome, or Playwright's own download
export async function launch() {
  const tries = [];
  if (process.env.CHROME_PATH) tries.push({ executablePath: process.env.CHROME_PATH });
  if (fs.existsSync('/opt/pw-browsers/chromium')) tries.push({ executablePath: '/opt/pw-browsers/chromium' });
  tries.push({}, { channel: 'chrome' });
  let last;
  for (const t of tries) { try { return await chromium.launch(t); } catch (e) { last = e; } }
  throw new Error('No browser found. Run "npx playwright-core install chromium" or set CHROME_PATH.\n' + last.message);
}

// The languages a page is tested in: an Arabic copy (ar/..., scripts/ar-pages.mjs) is Arabic whatever ?lang= says
// (0.3.2 BF1) build/ (the unlisted live build page) is English only and loads no language scripts, like the go/ links
// (0.3.3 IX4) a page whose Arabic is held (locale-routes.js AR_HELD, the one list) is English only until it ships
const AR_HELD = createRequire(import.meta.url)('../../assets/js/locale-routes.js').AR_HELD.map((p) => p.replace(/^\/+/, ''));
export const langsOf = (p) => (p.startsWith('ar/') ? ['ar'] : p.startsWith('build/') || AR_HELD.includes(p) ? ['en'] : ['en', 'ar']);

// The HTML pages of the site (the go/ short links are redirects, not pages)
// git runs without a shell, so the pattern needs no quotes (Windows' cmd.exe keeps single quotes and finds nothing)
export const pages = () => {
  const list = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT }).toString().trim().split(/\r?\n/).filter((p) => p && !p.startsWith('go/'));
  if (!list.length) throw new Error('No HTML pages found with git ls-files');
  return list;
};

/**
 * A fresh visitor. Options: viewport [w, h], timezone, consent ('denied' | 'granted' | null for a first visit),
 * downloads (true to accept file downloads), motion ('reduce' for visitors who turn animations off).
 * plainDesign (default true; 0.3.1 GD1): the Theme Generator's first visit opens on the glass look, so a visitor starts
 * with the design the page saved on a first visit before that (E.repairState(null): no look, plain), the path the
 * website's suites were written for; false for a true first visit (theme-generator.mjs, GD1).
 * Returns { ctx, pg, errs, hits }: errs collects page errors and console errors, hits counts analytics requests.
 */
export async function visitor(browser, { viewport = [1440, 900], timezone = 'Asia/Dubai', consent = 'denied', downloads = false, motion = 'no-preference', plainDesign = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] }, timezoneId: timezone, acceptDownloads: downloads, reducedMotion: motion });
  // opening a page on a busy machine can take longer than Playwright's default 30 s
  ctx.setDefaultNavigationTimeout(120000);
  await ctx.route('https://cdn.jsdelivr.net/npm/**', async (rt) => {
    const m = new URL(rt.request().url()).pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/(.*)$/);
    const file = m && path.join(ROOT, 'node_modules', m[1], m[2]);
    if (file && fs.existsSync(file)) await rt.fulfill({ path: file }); else await rt.fulfill({ status: 404, body: '' });
  });
  const hits = [];
  await ctx.route(/googletagmanager\.com|clarity\.ms/, (rt) => { hits.push(new URL(rt.request().url()).host); rt.fulfill({ status: 200, contentType: 'text/javascript', body: '' }); });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|app\.powerbi|web3forms/, (rt) => rt.fulfill({ status: 200, body: '' }));
  // whether the page itself is scrolling: from a scroll event of the page to its scrollend (fired when a smooth scroll
  // finishes, however long a busy machine takes); settle() waits for it. Scrolls inside elements don't count.
  await ctx.addInitScript(() => { window.__scrolling = false;
    document.addEventListener('scroll', () => { window.__scrolling = true; }, { passive: true });
    document.addEventListener('scrollend', () => { window.__scrolling = false; }); });
  if (plainDesign) await ctx.addInitScript((d) => { try { if (!localStorage.getItem('dataarcus-theme-generator')) localStorage.setItem('dataarcus-theme-generator', d); } catch (e) { /* ignore */ } }, PLAIN_DESIGN);
  if (consent) await ctx.addInitScript((c) => { try { if (!localStorage.getItem('dataarcus-consent')) localStorage.setItem('dataarcus-consent', c); } catch (e) { /* ignore */ } }, consent);
  const pg = await ctx.newPage();
  if (COVERAGE) {
    // every page of this visitor, the first and any a test opens itself, until it or the visitor closes
    const track = async (p) => { await coverageStart(p); const close = p.close.bind(p); p.close = async (o) => { await coverageStop(p); return close(o); }; return p; };
    await track(pg);
    const newPage = ctx.newPage.bind(ctx), closeCtx = ctx.close.bind(ctx);
    ctx.newPage = async () => track(await newPage());
    ctx.close = async (o) => { await Promise.all(ctx.pages().map(coverageStop)); return closeCtx(o); };
  }
  // --slow N in run-all: pages run N times slower (Chrome's CPU throttling), to reproduce a busy machine
  const slow = +process.env.DATAARCUS_TEST_SLOW || 0;
  if (slow > 1) await (await ctx.newCDPSession(pg)).send('Emulation.setCPUThrottlingRate', { rate: slow });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  return { ctx, pg, errs, hits };
}

/**
 * Waits until the page has finished setting itself up, so a check never measures a half-built page: the language
 * manager has translated it (it removes the i18n-pending class), fonts and images are loaded, and the layout holds
 * still (page height, top offset and title unchanged for 3 readings). "The network is quiet" is not enough on a
 * busy machine: the scripts that translate and lay out the page can still be running.
 */
export async function ready(pg) {
  await pg.waitForFunction(() => !document.documentElement.classList.contains('i18n-pending')
    && (!document.querySelector('script[src*="lang-manager"]') || !!(window.langManager && window.langManager.initialized)), null, { timeout: WAIT });
  await pg.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].filter((i) => !i.complete && i.loading !== 'lazy')
    .map((i) => new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))]));
  let last = '', same = 0;
  for (let i = 0; i < 100 && same < 2; i++) {
    const now = await pg.evaluate(() => [document.documentElement.scrollHeight, getComputedStyle(document.documentElement).scrollPaddingTop, document.title].join('|'));
    same = now === last ? same + 1 : 0; last = now; await pg.waitForTimeout(100);
  }
}

// Waits until the page stops scrolling. A smooth scroll can start a moment after a click (later still on a busy
// machine), so one unchanged reading is not enough: the position must hold for 4 readings in a row (about 320 ms).
// On a busy machine a smooth scroll can also stall mid-way for longer than that, so while the browser says a scroll is
// under way (a scroll event without its scrollend yet) the readings don't count; a scrollend that never comes stops
// the wait after about 3 s without movement.
// (TR1, B-439) `from`: the position before a click that MUST scroll the page. A busy machine can start the smooth scroll
// later than the 4 readings (on 10 Nov three CI runs read "top 715, bars 551": the page still at 0, the scroll not begun),
// so readings at `from` do not count until the page has left it; a page that never moves ends the wait at WAIT and the
// caller's own check fails, as it should. `wait`: the limit in ms (the settle test passes a short one).
export async function settle(pg, { from, wait = WAIT } = {}) {
  let last = -1, same = 0, still = 0, left = from === undefined;
  const end = Date.now() + wait;
  while (Date.now() < end) {
    const [y, busy] = await pg.evaluate(() => [scrollY, !!window.__scrolling]);
    if (y !== from) left = true;
    still = y === last ? still + 1 : 0;
    same = left && y === last && (!busy || still >= 36) ? same + 1 : 0;
    if (same >= 3) return y;
    last = y; await pg.waitForTimeout(80);
  }
  return last;
}

// (CI3) What a page still has to do after a step, so a check reads the state the step leads to, not a moment of it:
// its own timers of up to SHORT_TIMER ms started since the step's mark (a debounce, a ripple's removal, Bootstrap's
// collapse), the animation frames it asked for since then (a counter), its finite animations and transitions, and a
// scroll (the page must hold still for QUIET_FRAMES frames in a row: frames, not milliseconds, so a busy runner that
// starts a smooth scroll late is still waited for; the scroll flag above is not used, an instant scroll leaves it set).
// A sleep raced all of these on a busy runner (sp35, run 43237079137: "ripples: 1 -> 0"). Longer timers (a result
// hidden after 6 s, an article read after 30 s) are the page's own clocks, not work to wait for.
// trackWork(ctx) before the page opens; markWork(pg) when a step begins; quiet(pg) waits for all of it (WAIT at most).
export const SHORT_TIMER = 3000, QUIET_FRAMES = 5;
export const trackWork = (ctx) => ctx.addInitScript(([limit, need]) => {
  const w = window, st = w.setTimeout, ct = w.clearTimeout, raf = w.requestAnimationFrame, caf = w.cancelAnimationFrame;
  const timers = new Map(), frames = new Map(), now = () => performance.now();
  let mark = 0;
  w.setTimeout = function (fn, ms, ...a) {
    if (typeof fn !== 'function' || +ms > limit) return st.call(w, fn, ms, ...a);
    const id = st.call(w, function (...x) { timers.delete(id); return fn.apply(this, x); }, ms, ...a);
    timers.set(id, now()); return id;
  };
  w.clearTimeout = (id) => { timers.delete(id); return ct.call(w, id); };
  w.requestAnimationFrame = (fn) => { const id = raf.call(w, (t) => { frames.delete(id); fn(t); }); frames.set(id, now()); return id; };
  w.cancelAnimationFrame = (id) => { frames.delete(id); return caf.call(w, id); };
  const since = (m) => [...m.values()].filter((t) => t >= mark).length;
  const moving = () => document.getAnimations().filter((x) => x.playState === 'running' && x.effect && x.effect.getComputedTiming().endTime !== Infinity).length;
  // resolves on the first frame that ends a run of `need` frames with no work left and the page in the same place
  const still = () => new Promise((r) => { let n = 0, y = null; const f = () => { const at = scrollX + ',' + scrollY; n = !since(timers) && !since(frames) && !moving() && at === y ? n + 1 : 0; y = at; if (n >= need) r(); else raf.call(w, f); }; raf.call(w, f); });
  Object.defineProperty(w, '__work', { value: { mark: () => { mark = now(); }, still } });
}, [SHORT_TIMER, QUIET_FRAMES]);
export const markWork = (pg) => pg.evaluate(() => window.__work && window.__work.mark());
// a page without trackWork (a fake clock replaces its timers) waits for its scroll only (settle)
export const quiet = (pg, { wait = WAIT } = {}) => pg.evaluate((ms) => (window.__work
  ? Promise.race([window.__work.still(), new Promise((r) => setTimeout(r, ms))]) : null), wait).then((r) => (r === null ? settle(pg, { wait }) : r));
