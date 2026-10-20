// S2-1 (20 Oct 2026, mcp/research/SEE-THE-RESULT.md "S2: the v1"): the driver that lets Power BI Desktop draw a written
// report on a copy of the model with made-up rows (lib/shadow-model.mjs renderProject), on the user's own Windows
// machine. Experimental: used by render_report only (off unless DATAARCUS_EXPERIMENTAL_RENDER=1).
// The captures are Microsoft's: `powerbi-report-author preview <folder> --host desktop --screenshot <file> --page <id>`
// (the report authoring CLI mcp/package.json pins; its Desktop host talks to Desktop over Microsoft's Desktop bridge and
// answers which Desktop process each capture came from). That host is attach-only: it never starts Desktop, and it
// refuses `--close` ("it attaches to a window the user owns and must never terminate it"). So DataArcus keeps the
// smallest driver of its own for those two parts, through a helper process over JSON lines ({ id, op, ... } in,
// { id, ok, ... } out): on Windows lib/desktop-render.ps1 (refuse when the user's own Desktop is in front, find
// Desktop, open the project by path and keep the pid, see the window and any dialog, close by the pid); the tests use a
// fake one (fixtures/fake-desktop-helper.mjs) and a fake preview (fixtures/fake-preview-cli.mjs).
// The order: the user's Desktop in front -> refuse before anything; the project into a new folder of the OS temporary
// folder (never the working folder); open it, keep the pid; wait for the window; a dialog -> stop, click nothing; each
// page captured by Microsoft's preview until two captures in a row match (a capture is the window as it is: Desktop may
// still be drawing), and only from our pid; close by the pid (its process tree only) and delete the folder, in
// finally, whatever happened. Never `--host service` (it binds a dataset in the user's workspace: the data would leave
// the machine), never --group or --dataset, never a folder but the shadow project's.
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
// Microsoft's report authoring CLI (its bin, dist/cli.js beside the package's dist/index.js)
const CLI = (() => { try { return path.join(path.dirname(fileURLToPath(import.meta.resolve('@microsoft/powerbi-report-authoring-cli'))), 'cli.js'); } catch (e) { return null; } })();

/** A render that stopped: refused (nothing of the user's was in the way, or nothing was started) or failed. */
export class RenderStop extends Error { constructor(message, refused) { super(message); this.refused = !!refused; } }

/** The helper for this computer: PowerShell with lib/desktop-render.ps1 on Windows, none elsewhere. */
export function helperCommand(platform) {
  if ((platform || process.platform) !== 'win32') return null;
  return { cmd: 'powershell.exe', args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', PS1] };
}

/** Microsoft's preview command: node with the pinned CLI (null when it is not installed). */
export function previewCommand() { return CLI ? { cmd: process.execPath, args: [CLI] } : null; }

/** The one preview call DataArcus makes: a page of the shadow report captured from Power BI Desktop at scale 1. */
export function previewArgs(reportFolder, file, pageId) {
  return ['preview', reportFolder, '--host', 'desktop', '--screenshot', file, '--page', String(pageId), '--scale', '1'];
}
const NEVER = new Set(['--group', '--dataset', '--close', '--close-all', '--reload', '--reload-with-model', '--headless', '--all-pages', '--list-hosts', '--status']);
class PreviewFail extends Error { constructor(message, code, retryable) { super(message); this.code = code || ''; this.retryable = !!retryable; } }
// runs the preview command; its JSON answer ({ data } or { error }) or a PreviewFail. Refuses, before running, any call
// but the one previewArgs makes on a folder inside `inside` (the render's own temporary folder).
function runPreview(pv, args, ms, inside) {
  const host = args[args.indexOf('--host') + 1], folder = String(args[1] || ''), rel = path.relative(inside, folder);
  if (args[0] !== 'preview' || host !== 'desktop' || args.some((a) => NEVER.has(a)) || !rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    return Promise.reject(new RenderStop('DataArcus refused its own preview call: only "--host desktop" on the shadow project\'s folder is allowed.'));
  }
  return new Promise((resolve, reject) => {
    const child = spawn(pv.cmd, (pv.args || []).concat(args), { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let out = '', err = '';
    const t = setTimeout(() => { try { child.kill(); } catch (e) { /* gone */ } }, ms);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err = (err + d).slice(-2000); });
    child.on('error', (e) => { clearTimeout(t); reject(new PreviewFail('the preview command could not start: ' + short(e && e.message, 160))); });
    child.on('close', () => {
      clearTimeout(t);
      const line = out.trim().split('\n').filter(Boolean).pop() || '';
      let j = null; try { j = JSON.parse(line); } catch (e) { j = null; }
      const e = j && (j.error || (j.data && j.data.ok === false && j.data.error));
      if (e) { reject(new PreviewFail(`${short(e.code || 'error', 40)}: ${short(e.message, 200)}`, e.code, e.retryable)); return; }
      if (!j || !j.data) { reject(new PreviewFail('the preview command gave no answer' + (err.trim() ? ': ' + short(err.trim().split('\n').pop(), 160) : ''))); return; }
      resolve(j.data);
    });
  });
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
 *  Desktop. opts: { helper ({ cmd, args }: helperCommand()), preview ({ cmd, args }: previewCommand()), timing (RENDER
 *  overrides) }. Returns { pid, pages: [{ n,
 *  id, name, png (Buffer), settled, seconds } | { n, id, name, error }], openSeconds, totalSeconds }. Throws a RenderStop
 *  (refused: true when nothing was started, or a dialog stopped it). Whatever happens, the Desktop it started is closed
 *  by its pid and the temporary folder is deleted before it returns. */
export async function render(project, opts) {
  const o = opts || {}, T = Object.assign({}, RENDER, o.timing || {}), t0 = Date.now();
  if (!o.helper) throw new RenderStop('Rendering needs Windows with Power BI Desktop installed: this computer is not Windows. The approval page\'s preview (drawn by DataArcus, not by Desktop) is the look available here. Nothing was opened.', true);
  const pv = o.preview || previewCommand();
  if (!pv) throw new RenderStop('Microsoft\'s report authoring CLI (its preview command) is not installed with DataArcus: run npm ci in the mcp folder. Nothing was opened.', true);
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
    // a page: captured by Microsoft's preview until two in a row are the same (the visuals have drawn), at most
    // `budget`; the last capture marked settled: false at the cap. A retryable answer (Desktop still opening the
    // report, its bridge not up yet) is asked again within the budget. A capture from any Desktop but ours stops it.
    const reportFolder = path.join(dir, project.name + '.Report');
    const settle = async (p, k, budget) => {
      const start = Date.now(), end = start + budget;
      let prev = null;
      for (let n = 0; ; n++) {
        await state();
        const f = path.join(dir, `capture-${k}-${n}.png`);
        let d = null;
        try { d = await runPreview(pv, previewArgs(reportFolder, f, p.id), T.helperMs, dir); } catch (e) {
          if (e instanceof RenderStop) throw e;
          if (e.retryable && Date.now() < end) { await sleep(T.pollMs); continue; }
          throw new RenderStop(`The capture of page ${p.n} failed (Microsoft's preview command): ${short(e.message, 220)}`);
        }
        const shot = (d.screenshots || [])[0];
        if (!shot) throw new RenderStop(`The capture of page ${p.n} failed: Microsoft's preview command saved no image.`);
        if (shot.pid != null && Number(shot.pid) !== Number(pid)) throw new RenderStop(`Microsoft's preview command captured a Power BI Desktop that DataArcus did not start (process ${shot.pid}): stopped, and nothing of that capture is returned.`, true);
        const png = fs.readFileSync(shot.path || f); fs.rmSync(f, { force: true });
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
      if (k === 0) { pages.push(Object.assign(id, await settle(p, k, T.settleMs))); continue; }
      try { pages.push(Object.assign(id, await settle(p, k, T.pageSettleMs))); } catch (e) {
        if (!(e instanceof RenderStop) || e.refused) throw e;
        pages.push(Object.assign(id, { error: 'not captured: ' + short(e.message, 260) }));
      }
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
