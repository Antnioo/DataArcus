// 0.3.2 DP1 (written red first, 2 Nov 2026): the MCP's package updates (audit AUD-046, Dependabot #107-#110).
// Every version is written once, in package.json (D-1016-01): this suite reads the pins there and holds only the
// audit's fixed floors, the first version each advisory names as safe (a different fact from the pin).
//   D1  every runtime dependency is an exact pin (x.y.z, no range)
//   D2  each pin is what the lock records and what is installed (one copy of the SDK)
//   D3  the shipped packages the audit named are at or above their fixed floors in the lock and installed
//   D4  the server declares no capabilities in McpServer's options (SDK 1.32.2's only runtime change is not taken)
//   node test-0.3.2-deps.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const num = (v) => String(v || '').split('.').map((x) => parseInt(x, 10) || 0);
const atLeast = (v, floor) => { const a = num(v), b = num(floor); for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0); return true; };
const installed = (name) => { try { return J(path.join(HERE, 'node_modules', name, 'package.json')).version; } catch { return null; } };

// the first safe version per advisory (npm audit, 2 Nov 2026)
const FLOORS = {
  'body-parser': '2.4.0',  // GHSA-27r3-jxmh-p828 (high): 2.0.0 - 2.3.0
  'fast-uri': '3.1.9',     // GHSA-w74x-v6f9-j3xg and three more (moderate): 3.0.0 - 3.1.8
  'ip-address': '10.7.4',  // GHSA-rxp7-6hxx-x8q5 (moderate): <= 10.7.3
  'qs': '6.16.1',          // GHSA-6pq8-jhm2-2vcw (moderate): 6.7.0 - 6.16.0
};

try {
  const pkg = J(path.join(HERE, 'package.json')), lock = J(path.join(HERE, 'package-lock.json'));
  const deps = Object.entries(pkg.dependencies || {});

  // D1
  const ranged = deps.filter(([, v]) => !/^\d+\.\d+\.\d+$/.test(v));
  chk(() => deps.length > 0 && !ranged.length, () => `D1. every runtime dependency is an exact pin: ${JSON.stringify(ranged)}`);

  // D2
  const root = (lock.packages || {})[''] || {};
  const drift = deps.filter(([n, v]) => (root.dependencies || {})[n] !== v || ((lock.packages || {})['node_modules/' + n] || {}).version !== v || installed(n) !== v)
    .map(([n, v]) => `${n}: package.json ${v}, lock root ${(root.dependencies || {})[n]}, lock ${((lock.packages || {})['node_modules/' + n] || {}).version}, installed ${installed(n)}`);
  chk(() => !drift.length, () => `D2. each pin is the lock's and the installed version: ${drift.join('; ')}`);
  const sdkCopies = Object.keys(lock.packages || {}).filter((k) => /(^|\/)node_modules\/@modelcontextprotocol\/sdk$/.test(k));
  chk(() => sdkCopies.length === 1, () => `D2. one copy of the SDK in the lock: ${sdkCopies.join(', ')}`);

  // D3: every copy in the lock, and the installed top-level copy
  for (const [name, floor] of Object.entries(FLOORS)) {
    const copies = Object.entries(lock.packages || {}).filter(([k]) => k.endsWith('node_modules/' + name)).map(([k, v]) => [k, v.version]);
    const low = copies.filter(([, v]) => !atLeast(v, floor));
    const inst = installed(name);
    chk(() => copies.length > 0 && !low.length && (inst === null || atLeast(inst, floor)),
      () => `D3. ${name} at or above ${floor}: lock ${JSON.stringify(copies)}, installed ${inst}`);
  }

  // D4
  const src = fs.readFileSync(path.join(HERE, 'server.mjs'), 'utf8');
  const ctor = (src.match(/new McpServer\(([^;]*)\);/) || [])[1] || '';
  chk(() => ctor && !/capabilities/.test(ctor), () => `D4. McpServer is built without declared capabilities: ${ctor.slice(0, 200)}`);
} catch (e) { problems.push('the suite threw: ' + (e && e.stack || e)); }

if (problems.length) { console.log(`FAIL  dp1  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  dp1  ${checks} checks`);
