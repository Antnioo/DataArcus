// S2 tests (test-0.3.1-see-the-result.mjs): a FAKE Power BI Desktop behind the render helper's protocol (JSON lines, as
// lib/desktop-render.ps1 answers them), so the driver's wait, capture and close logic runs on any computer. "Desktop"
// is a real child process (a pid to close; written to <log>.pid for the fake preview, fixtures/fake-preview-cli.mjs,
// which does the captures as Microsoft's preview command does).
//   node fixtures/fake-desktop-helper.mjs '<scenario JSON>'
// scenario: { log (each operation appended as a JSON line), windowAfter (the window shows at this state call,
//   default 1), dialogAt (a dialog from this state call), foreground: 'desktop', noDesktop }
import fs from 'node:fs';
import readline from 'node:readline';
import { spawn } from 'node:child_process';

const sc = JSON.parse(process.argv[2] || '{}');
const log = (o) => { if (sc.log) fs.appendFileSync(sc.log, JSON.stringify(o) + '\n'); };
let child = null, states = 0;
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
      if (sc.log) fs.writeFileSync(sc.log + '.pid', String(child.pid));
      log({ op: m.op, file: m.file, exists: fs.existsSync(m.file), pid: child.pid }); ok({ pid: child.pid }); return;
    case 'state': {
      states++; log({ op: m.op, pid: m.pid });
      ok({ pid: child ? child.pid : null, alive: alive(), hwnd: states >= (sc.windowAfter || 1) ? 4242 : null, dialog: sc.dialogAt && states >= sc.dialogAt ? { title: 'Sign in' } : null }); return;
    }
    case 'close':
      log({ op: m.op, pid: m.pid });
      if (alive() && child.pid === m.pid) { child.once('exit', () => ok({ closed: true })); child.kill('SIGKILL'); } else ok({ closed: false });
      return;
    default: no('unknown op ' + m.op);
  }
}).on('close', () => { if (alive()) child.kill('SIGKILL'); process.exit(0); });
