// S2 tests (test-0.3.1-see-the-result.mjs): a FAKE Power BI Desktop behind the render helper's protocol (JSON lines, as
// lib/desktop-render.ps1 answers them), so the driver's wait, capture and close logic runs on any computer. "Desktop"
// is a real child process (a pid to close); a capture is a small PNG that changes until the page has "drawn".
//   node fixtures/fake-desktop-helper.mjs '<scenario JSON>'
// scenario: { log (each operation appended as a JSON line; a page's last capture copied to <log>-last-<page>.png),
//   windowAfter (the window shows at this state call, default 1), stableAfter (captures of a page that change, default 1),
//   dialogAt (a dialog from this state call), failCapture (this capture fails), foreground: 'desktop', noDesktop }
import fs from 'node:fs';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { PNG } from 'pngjs';

const sc = JSON.parse(process.argv[2] || '{}');
const log = (o) => { if (sc.log) fs.appendFileSync(sc.log, JSON.stringify(o) + '\n'); };
const png = (r, g, b) => { const p = new PNG({ width: 8, height: 6 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = r; p.data[i + 1] = g; p.data[i + 2] = b; p.data[i + 3] = 255; } return PNG.sync.write(p); };
let child = null, states = 0, captures = 0, pageIx = 0;
const perPage = new Map();
const alive = () => !!child && child.exitCode === null && child.signalCode === null;

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  let m = null; try { m = JSON.parse(line); } catch (e) { return; }
  const ok = (o) => process.stdout.write(JSON.stringify(Object.assign({ id: m.id, ok: true }, o || {})) + '\n');
  const no = (e) => process.stdout.write(JSON.stringify({ id: m.id, ok: false, error: e }) + '\n');
  switch (m.op) {
    case 'foreground': log({ op: m.op }); ok({ desktop: sc.foreground === 'desktop' }); return;
    case 'find': log({ op: m.op }); if (sc.noDesktop) no('PBIDesktop.exe not found (PBI_DESKTOP_PATH, Program Files, the Store package)'); else ok({ path: 'C:\\Fake\\bin\\PBIDesktop.exe' }); return;
    case 'open':
      child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
      log({ op: m.op, file: m.file, exists: fs.existsSync(m.file), pid: child.pid }); ok({ pid: child.pid }); return;
    case 'state': {
      states++; log({ op: m.op, pid: m.pid });
      ok({ pid: child ? child.pid : null, alive: alive(), hwnd: states >= (sc.windowAfter || 1) ? 4242 : null, dialog: sc.dialogAt && states >= sc.dialogAt ? { title: 'Sign in' } : null }); return;
    }
    case 'page': pageIx++; log({ op: m.op, name: m.name }); ok({}); return;
    case 'capture': {
      captures++; log({ op: m.op, page: m.page, hwnd: m.hwnd });
      if (sc.failCapture && captures === sc.failCapture) { no('PrintWindow returned 0'); return; }
      const n = perPage.get(pageIx) || 0; perPage.set(pageIx, n + 1);
      const b = n >= (sc.stableAfter == null ? 1 : sc.stableAfter) ? png(10 + pageIx * 20, 200, 100) : png((n * 7) % 255, pageIx * 20, 50 + (n % 200));
      fs.writeFileSync(m.file, b);
      if (sc.log) fs.writeFileSync(sc.log.replace(/\.log$/, `-last-${pageIx}.png`), b);
      ok({ width: 8, height: 6 }); return;
    }
    case 'close':
      log({ op: m.op, pid: m.pid });
      if (alive() && child.pid === m.pid) { child.once('exit', () => ok({ closed: true })); child.kill('SIGKILL'); } else ok({ closed: false });
      return;
    default: no('unknown op ' + m.op);
  }
}).on('close', () => { if (alive()) child.kill('SIGKILL'); process.exit(0); });
