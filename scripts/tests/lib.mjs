// Shared helpers for the browser tests: a small web server for the site folder,
// the browser, and pages with the CDN served from node_modules and analytics blocked.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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
 * Returns { ctx, pg, errs, hits } — errs collects page errors and console errors, hits counts analytics requests.
 */
export async function visitor(browser, { viewport = [1440, 900], timezone = 'Asia/Dubai', consent = 'denied', downloads = false, motion = 'no-preference' } = {}) {
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
  if (consent) await ctx.addInitScript((c) => { try { if (!localStorage.getItem('dataarcus-consent')) localStorage.setItem('dataarcus-consent', c); } catch (e) { /* ignore */ } }, consent);
  const pg = await ctx.newPage();
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

// Waits until the page stops scrolling (smooth scrolls take a moment)
// Waits until the page stops scrolling. A smooth scroll can start a moment after a click (later still on a busy
// machine), so one unchanged reading is not enough: the position must hold for 4 readings in a row (about 320 ms).
export async function settle(pg) {
  let last = -1, same = 0;
  for (let i = 0; i < 60; i++) {
    const y = await pg.evaluate(() => scrollY);
    same = y === last ? same + 1 : 0;
    if (same >= 3) return y;
    last = y; await pg.waitForTimeout(80);
  }
  return last;
}
