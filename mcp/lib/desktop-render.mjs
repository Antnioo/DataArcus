// S2-1 (20 Oct 2026, mcp/research/SEE-THE-RESULT.md "S2: the v1"): the driver that lets Power BI Desktop draw a written
// report on a copy of the model with made-up rows (lib/shadow-model.mjs renderProject), on the user's own Windows
// machine. Experimental: used by render_report only (off unless DATAARCUS_EXPERIMENTAL_RENDER=1).
// The driver is platform-free: it writes the project into a new folder of the OS temporary folder (never the working
// folder), and talks to a helper process over JSON lines ({ id, op, ... } in, { id, ok, ... } out). On Windows the helper
// is lib/desktop-render.ps1 (Win32 and UI Automation); the tests use a fake one with the same protocol
// (fixtures/fake-desktop-helper.mjs). The order, from the lab's quirks (mcp/CLAUDE.md, scripts/tests/DESKTOP-TESTS.md):
// the user's own Desktop in front -> refuse before anything; open the project by its path and keep the pid; wait for the
// window; a dialog -> stop, click nothing, close; capture by the window's handle until two captures in a row match (the
// visuals have drawn; at most settleMs for the first page, pageSettleMs after a page switch); switch pages by name;
// close by the pid (its process tree only) and delete the folder, in finally, whatever happened.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compare } from './box-diff.mjs';

// (chosen, not measured: the laptop measures the open, the settle and a page's capture first; R1: "about 20 s after the
// window shows before the visuals are drawn", 2.159 says "not loaded after 45 s" while it is still loading)
export const RENDER = Object.freeze({ pollMs: 1500, windowMs: 120000, settleMs: 90000, pageSettleMs: 30000, helperMs: 60000 });
const PS1 = fileURLToPath(new URL('./desktop-render.ps1', import.meta.url));

/** A render that stopped: refused (nothing of the user's was in the way, or nothing was started) or failed. */
export class RenderStop extends Error { constructor(message, refused) { super(message); this.refused = !!refused; } }

/** The helper for this computer: PowerShell with lib/desktop-render.ps1 on Windows, none elsewhere. */
export function helperCommand(platform) {
  if ((platform || process.platform) !== 'win32') return null;
  return { cmd: 'powershell.exe', args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', PS1] };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, n || 60);

// the helper process: ask(op) answers its JSON reply, or rejects with its error, its exit or a time-out
function startHelper(h, ms) {
  const child = spawn(h.cmd, h.args || [], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const waiting = new Map();
  let next = 1, dead = null, err = '';
  child.stderr.on('data', (d) => { err = (err + d).slice(-2000); });
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    let j = null; try { j = JSON.parse(line); } catch (e) { return; }
    const w = j && waiting.get(j.id); if (!w) return;
    waiting.delete(j.id); clearTimeout(w.t);
    if (j.ok) w.res(j); else w.rej(new Error(short(j.error || 'failed', 300)));
  });
  const fail = (why) => { if (dead) return; dead = why; for (const w of waiting.values()) { clearTimeout(w.t); w.rej(new Error(why)); } waiting.clear(); };
  child.on('exit', (code) => fail(`the helper stopped (exit ${code})${err.trim() ? ': ' + short(err.trim().split('\n').pop(), 200) : ''}`));
  child.on('error', (e) => fail('the helper could not start: ' + short(e && e.message, 200)));
  child.stdin.on('error', () => {});
  const ask = (msg) => new Promise((res, rej) => {
    if (dead) { rej(new Error(dead)); return; }
    const id = next++, t = setTimeout(() => { waiting.delete(id); rej(new Error(`the helper did not answer "${msg.op}" in ${Math.round(ms / 1000)} s`)); }, ms);
    waiting.set(id, { res, rej, t });
    child.stdin.write(JSON.stringify(Object.assign({ id }, msg)) + '\n');
  });
  const stop = () => { try { child.stdin.end(); } catch (e) { /* gone */ } setTimeout(() => { try { child.kill(); } catch (e) { /* gone */ } }, 3000).unref(); };
  return { ask, stop };
}

const dialogStop = (d) => new RenderStop(`A dialog is open in Power BI Desktop${d && d.title ? ` ("${short(d.title)}")` : ''}. DataArcus clicks nothing it doesn't know, so it stopped and closed its own Desktop window; nothing was captured. If Desktop asks this every time (sign-in, an update, a privacy level), answer it once in your own Desktop, then ask again.`, true);

/** Renders project ({ files: [{ path, text | data }], name, pages: [{ n, id, name }] }: renderProject's) in Power BI
 *  Desktop. opts: { helper ({ cmd, args }: helperCommand()), timing (RENDER overrides) }. Returns { pid, pages: [{ n,
 *  id, name, png (Buffer), settled, seconds } | { n, id, name, error }], openSeconds, totalSeconds }. Throws a RenderStop
 *  (refused: true when nothing was started, or a dialog stopped it). Whatever happens, the Desktop it started is closed
 *  by its pid and the temporary folder is deleted before it returns. */
export async function render(project, opts) {
  const o = opts || {}, T = Object.assign({}, RENDER, o.timing || {}), t0 = Date.now();
  if (!o.helper) throw new RenderStop('Rendering needs Windows with Power BI Desktop installed: this computer is not Windows. The approval page\'s preview (drawn by DataArcus, not by Desktop) is the look available here. Nothing was opened.', true);
  const h = startHelper(o.helper, T.helperMs);
  let dir = null, pbip = null, pid = null, result = null, notClosed = null, left = null;
  try {
    const fg = await h.ask({ op: 'foreground' });
    if (fg.desktop) throw new RenderStop('A Power BI Desktop window of yours is in front. DataArcus starts its own Desktop only while yours is not in use: switch to another window (or close your report), then ask again. Nothing was opened.', true);
    let exe = null;
    try { exe = (await h.ask({ op: 'find' })).path; } catch (e) { throw new RenderStop(`Power BI Desktop was not found on this computer (${short(e.message, 160)}). Install it (Microsoft Store or the installer), or set PBI_DESKTOP_PATH to its PBIDesktop.exe, then ask again. Nothing was opened.`, true); }
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-render-'));
    for (const f of project.files) {
      const rel = String(f.path).replace(/\\/g, '/');
      if (/(^|\/)\.\.(\/|$)|^\//.test(rel)) throw new RenderStop('a project path leaves its folder: ' + short(rel, 120));
      const to = path.join(dir, ...rel.split('/'));
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.writeFileSync(to, f.data != null ? f.data : f.text, { flag: 'wx' });
    }
    pbip = path.join(dir, project.name + '.pbip');
    pid = (await h.ask({ op: 'open', exe, file: pbip })).pid;
    // the window (a Store Desktop may start again under another pid: the helper finds the one whose command line names
    // this project, never another Desktop)
    const state = async () => {
      const st = await h.ask({ op: 'state', pid, file: pbip });
      if (st.pid) pid = st.pid;
      if (st.alive === false) throw new RenderStop('Power BI Desktop closed before the report was captured.');
      if (st.dialog) throw dialogStop(st.dialog);
      return st;
    };
    let hwnd = null;
    for (const end = Date.now() + T.windowMs; ;) {
      const st = await state();
      if (st.hwnd) { hwnd = st.hwnd; break; }
      if (Date.now() > end) throw new RenderStop(`Power BI Desktop showed no window in ${Math.round(T.windowMs / 1000)} s.`);
      await sleep(T.pollMs);
    }
    const openSeconds = Math.round((Date.now() - t0) / 100) / 10;
    // a page: captured until two in a row are the same (the visuals have drawn), at most `budget`; the last capture
    // marked settled: false at the cap
    const settle = async (p, k, budget) => {
      const start = Date.now(), end = start + budget;
      let prev = null;
      for (let n = 0; ; n++) {
        await state();
        const f = path.join(dir, `capture-${k}-${n}.png`);
        try { await h.ask({ op: 'capture', hwnd, file: f, page: p.name }); } catch (e) { throw new RenderStop(`The capture of page ${p.n} failed: ${short(e.message, 160)}`); }
        const png = fs.readFileSync(f); fs.rmSync(f, { force: true });
        const sum = crypto.createHash('sha256').update(png).digest('hex'), seconds = Math.round((Date.now() - start) / 100) / 10;
        if (sum === prev) return { png, settled: true, seconds };
        prev = sum;
        if (Date.now() >= end) return { png, settled: false, seconds };
        await sleep(T.pollMs);
      }
    };
    const pages = [];
    for (const [k, p] of project.pages.entries()) {
      const id = { n: p.n, id: p.id, name: p.name };
      if (k > 0) {
        try { await h.ask({ op: 'page', pid, hwnd, name: p.name }); } catch (e) { pages.push(Object.assign(id, { error: `not captured: the page could not be shown (${short(e.message, 160)})` })); continue; }
      }
      pages.push(Object.assign(id, await settle(p, k, k ? T.pageSettleMs : T.settleMs)));
    }
    result = { pid, pages, openSeconds, totalSeconds: 0 };
  } finally {
    if (pid) { try { await h.ask({ op: 'close', pid, file: pbip }); } catch (e) { notClosed = `Power BI Desktop (process ${pid}) could not be closed: ${short(e.message, 160)}. Close that window yourself.`; } }
    h.stop();
    if (dir) { try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch (e) { left = `The temporary copy could not be deleted (${short(e.code || e.message, 40)}): the folder ${path.basename(dir)} in the computer's temporary folder; delete it yourself.`; } }
  }
  result.totalSeconds = Math.round((Date.now() - t0) / 100) / 10;
  if (notClosed) result.notClosed = notClosed;
  if (left) result.leftBehind = left;
  return result;
}

/** S2-6, the learning hook: a render scored against the written report's boxes (box-diff), once the boxes Desktop drew
 *  are measured in the image (the laptop); { score: null, why } until then. */
export function scoreRender(page, measured) {
  const written = ((page && page.boxes) || []).map((b) => ({ i: b.i, kind: b.kind, frame: { x: b.x, y: b.y, w: b.w, h: b.h } }));
  if (!measured || !measured.length) return { score: null, why: 'Not scored yet: the boxes Desktop drew are measured in the images on the laptop first (S2-6); then each render is scored against the written boxes, and a gap becomes a measured rule in page-preview.js.' };
  const got = measured.map((b) => (b.frame ? b : { i: b.i, kind: b.kind, frame: { x: b.x, y: b.y, w: b.w, h: b.h } }));
  const r = compare(got, written);
  return { score: r.score, pairs: r.pairs.length, within4: r.within(4), missing: r.missing, extra: r.extra };
}
