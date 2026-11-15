// A test tool (SN3 item 4): runs suites under shifted clocks (scripts/clock-shift.cjs) and prints one line each.
//   node scripts/run-shifted-clock.mjs [--clocks tomorrow,newyear,leap] [--jobs 3] <suite file>...
// A suite file is mcp/test-*.mjs or scripts/test-*.mjs (run as they are) or scripts/tests/<name>.mjs (run through
// scripts/tests/run-all.mjs, as R-57 says). "<clock> <file> PASS|FAIL <seconds>s"; a FAIL is followed by its last lines.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const clocks = opt('--clocks', 'tomorrow,newyear,leap').split(','), jobs = +opt('--jobs', '3');
const files = args;
const PRE = path.join(ROOT, 'scripts/clock-shift.cjs');
const cmd = (f) => /^scripts\/tests\//.test(f) ? { argv: ['scripts/tests/run-all.mjs', path.basename(f, '.mjs')], cwd: ROOT }
  : /^mcp\//.test(f) ? { argv: [path.basename(f)], cwd: path.join(ROOT, 'mcp') } : { argv: [f], cwd: ROOT };
const queue = [];
for (const f of files) for (const c of clocks) queue.push([f, c]);
let running = 0, idx = 0;
await new Promise((done) => {
  const next = () => {
    while (running < jobs && idx < queue.length) {
      const [f, c] = queue[idx++]; const { argv, cwd } = cmd(f); running++;
      const t0 = Date.now(); let out = '';
      const env = { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${PRE}`.trim() };
      if (c !== 'none') env.SHIFT_CLOCK = c; else delete env.SHIFT_CLOCK;
      const p = spawn(process.execPath, argv, { cwd, env });
      p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
      p.on('close', (code) => {
        running--;
        console.log(`${c} ${f} ${code === 0 ? 'PASS' : 'FAIL'} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
        if (code !== 0) console.log(out.trim().split('\n').filter((l) => /FAIL|fail|Error|differ/.test(l)).slice(0, 6).map((l) => '    ' + l.slice(0, 260)).join('\n'));
        if (idx >= queue.length && running === 0) done(); else next();
      });
    }
    if (!queue.length) done();
  };
  next();
});
