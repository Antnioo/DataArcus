// node scripts/test-stamps.mjs
// ST1 (0.3.2): scripts/stamps.mjs, the ?v= stamps made by the build. Red on made-up trees (a page with an old stamp, a
// loader with a hand-typed one, a missing target, a target changed after the build, a loop), green on the real tree,
// and a second build that changes nothing (on the made-up tree and on a copy of the real one). Made-up files only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, stampOf, isStamp, holders, scan, check, build } from './stamps.mjs';
import { minOf } from './check-min.mjs';

const problems = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) problems.push(msg); };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'da-stamps-'));
const put = (root, f, text) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), text); };
const get = (root, f) => fs.readFileSync(path.join(root, f), 'utf8');
const snap = (root) => Object.fromEntries(holders(root).map((f) => [f, get(root, f)]));
const stampIn = (root, f, ref) => { const m = new RegExp(ref.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\?v=([\\w.-]*)').exec(get(root, f)); return m && m[1]; };

// a made-up site: a leaf engine, a worker that imports it, a loader that lists both, a page that loads the loader
async function site(name) {
  const root = path.join(TMP, name);
  const src = {
    'assets/js/leaf.js': 'var Leaf = { n: function (a) { return a + 1; } };\n',
    'assets/js/worker.js': "importScripts('leaf.min.js?v=20261025f');\nself.onmessage = function (e) { self.postMessage(Leaf.n(e.data)); };\n",
    'assets/js/loader.js': "var LIST = ['/assets/js/worker.min.js?v=20261103sp15', '../assets/js/leaf.min.js?v=20261025a'];\nwindow.load = function () { return LIST.slice(); };\n",
  };
  for (const [f, t] of Object.entries(src)) { put(root, f, t); put(root, f.replace(/\.js$/, '.min.js'), await minOf(t)); }
  put(root, 'assets/css/site.css', 'body { color: #123; }\n');
  put(root, 'assets/img/card.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n');
  put(root, 'tools/page.html', '<!doctype html>\n<link href="../assets/css/site.css?v=20261003" rel="stylesheet">\n'
    + '<meta property="og:image" content="https://dataarcus.com/assets/img/card.svg?v=20261005b">\n'
    + '<script src="https://cdn.example.com/lib.js?v=1.2.3"></script>\n<script src="../assets/js/loader.min.js?v=20261104sp36" defer></script>\n');
  return root;
}

try {
  // 1. the build: every local reference gets its target's stamp; external ones are left alone; a second build changes nothing
  const a = await site('build');
  const first = await build(a), after1 = snap(a), second = await build(a), after2 = snap(a);
  const refs = scan(a);
  ok(refs.length === 9 && refs.every((r) => isStamp(r.stamp) && r.stamp === stampOf(path.join(a, r.target))),
    `B1 after the build every local reference holds its target's stamp: ${JSON.stringify(refs.map((r) => [r.file, r.ref, r.stamp]))}`);
  ok(/cdn\.example\.com\/lib\.js\?v=1\.2\.3"/.test(get(a, 'tools/page.html')) && stampIn(a, 'tools/page.html', 'https://dataarcus.com/assets/img/card.svg') === stampOf(path.join(a, 'assets/img/card.svg')),
    'B2 an external URL is left alone; the site\'s own https://dataarcus.com/ address is stamped as its file');
  const at = (f) => first.order.indexOf(f);
  ok(at('assets/js/leaf.js') < at('assets/js/worker.js') && at('assets/js/worker.js') < at('assets/js/loader.js') && at('assets/js/loader.js') < at('tools/page.html'),
    `B3 dependency order: the leaf, the worker, the loader, then the page: ${first.order.join(', ')}`);
  ok(get(a, 'assets/js/loader.min.js') === await minOf(get(a, 'assets/js/loader.js')) && stampIn(a, 'tools/page.html', '../assets/js/loader.min.js') === stampOf(path.join(a, 'assets/js/loader.min.js')),
    'B4 the loader\'s .min.js is rebuilt with its new stamps before the page takes its stamp');
  ok(!second.changed.length && JSON.stringify(after1) === JSON.stringify(after2) && !check(a).stale.length,
    `B5 a second build changes nothing (changed: ${second.changed.join(', ') || '-'}) and the check is green`);

  // 2. red: a page with an old stamp
  const b = await site('old'); await build(b);
  put(b, 'tools/page.html', get(b, 'tools/page.html').replace(/loader\.min\.js\?v=\w+/, 'loader.min.js?v=0123456789ab'));
  const rb = check(b).stale;
  ok(rb.length === 1 && rb[0].file === 'tools/page.html' && /loader\.min\.js/.test(rb[0].ref) && rb[0].want === stampOf(path.join(b, 'assets/js/loader.min.js')),
    `R1 a page with an old stamp is named, with the right stamp: ${JSON.stringify(rb)}`);

  // 3. red: a loader with a hand-typed stamp
  const c = await site('typed'); await build(c);
  put(c, 'assets/js/loader.js', get(c, 'assets/js/loader.js').replace(/worker\.min\.js\?v=\w+/, 'worker.min.js?v=20261104st1'));
  const rc = check(c).stale;
  ok(rc.some((s) => s.file === 'assets/js/loader.js' && /20261104st1/.test(s.why)), `R2 a loader with a hand-typed stamp is named: ${JSON.stringify(rc)}`);

  // 4. red: a missing target (the check names it; the build names it and writes nothing for it)
  const d = await site('missing'); await build(d);
  put(d, 'tools/page.html', get(d, 'tools/page.html') + '<script src="../assets/js/gone.min.js?v=0123456789ab"></script>\n');
  const rd = check(d).stale, bd = await build(d);
  ok(rd.length === 1 && /gone\.min\.js/.test(rd[0].ref) && /not there/.test(rd[0].why) && bd.missing.length === 1 && /gone\.min\.js\?v=0123456789ab/.test(get(d, 'tools/page.html')),
    `R3 a missing target is named by the check and the build: ${JSON.stringify(rd)} ${JSON.stringify(bd.missing)}`);

  // 5. red: a target changed after the build (its .min.js rebuilt, as check-min --write does); the build then carries
  // the change up the chain: the worker's import, the worker's stamp in the loader, the loader's stamp in the page
  const e = await site('changed'); await build(e);
  const leaf = 'var Leaf = { n: function (a) { return a + 2; } };\n', before = snap(e);
  put(e, 'assets/js/leaf.js', leaf); put(e, 'assets/js/leaf.min.js', await minOf(leaf));
  const re = check(e).stale;
  ok(re.length === 4 && re.every((s) => /leaf\.min\.js/.test(s.ref)), `R4 a target changed after the build: its 4 references (worker, loader and their .min.js) are named: ${JSON.stringify(re.map((s) => [s.file, s.ref]))}`);
  await build(e);
  const moved = (f, ref) => stampIn(e, f, ref) !== (new RegExp(ref.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\?v=(\\w+)').exec(before[f]) || [])[1];
  ok(!check(e).stale.length && moved('assets/js/worker.js', 'leaf.min.js') && moved('assets/js/loader.js', '/assets/js/worker.min.js') && moved('tools/page.html', '../assets/js/loader.min.js') && !moved('tools/page.html', '../assets/css/site.css'),
    'R5 the rebuild moves exactly the chain\'s stamps (worker, loader, page) and leaves the others');

  // 6. red: a loop of references cannot be built
  const f = await site('loop');
  put(f, 'assets/js/leaf.js', "var BACK = '/assets/js/loader.min.js?v=x';\n"); put(f, 'assets/js/leaf.min.js', await minOf(get(f, 'assets/js/leaf.js')));
  let loop = ''; try { await build(f); } catch (err) { loop = err.message; }
  ok(/a loop of references/.test(loop), `R6 a loop of references is refused: ${loop || 'built'}`);

  // 7. the laptop's CRLF checkout gives the same stamp as LF; a binary file is hashed as it is
  put(f, 'crlf.js', 'a\r\nb\r\n'); put(f, 'lf.js', 'a\nb\n');
  ok(stampOf(path.join(f, 'crlf.js')) === stampOf(path.join(f, 'lf.js')) && isStamp(stampOf(path.join(f, 'lf.js'))), 'S1 a CRLF file and its LF copy have one stamp');

  // 8. the real tree: green, and a build on a copy of it changes nothing (twice)
  const real = check(ROOT);
  ok(real.refs.length > 1000 && !real.stale.length, `T1 the real tree: every reference holds its target's stamp (${real.stale.length} of ${real.refs.length} stale: ${real.stale.slice(0, 3).map((s) => s.file + ' ' + s.ref).join('; ')}; fix: npm run build:min)`);
  ok(real.refs.every((r) => isStamp(r.stamp)), 'T2 the real tree holds no hand-typed stamp');
  const g = path.join(TMP, 'real');
  for (const file of new Set([...holders(ROOT), ...real.refs.map((r) => r.target)])) { fs.mkdirSync(path.dirname(path.join(g, file)), { recursive: true }); fs.copyFileSync(path.join(ROOT, file), path.join(g, file)); }
  const g0 = snap(g), g1 = await build(g), g2 = await build(g);
  ok(!g1.changed.length && !g2.changed.length && JSON.stringify(snap(g)) === JSON.stringify(g0), `T3 a build of a copy of the real tree changes nothing, twice (changed: ${[...g1.changed, ...g2.changed].join(', ') || '-'})`);

  // 9. the command: its result line on the real tree, one FAIL line per stale reference with the fix on a made-up one
  const run = (...args) => spawnSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'stamps.mjs'), ...args], { encoding: 'utf8' });
  const cmd = run(), red = run('--root', c);
  ok(cmd.status === 0 && /^PASS {2}stamps {2}\d+ checks$/m.test(cmd.stdout), `C1 node scripts/stamps.mjs on the real tree: exit 0 and its PASS line: ${cmd.status} ${cmd.stdout}${cmd.stderr}`);
  const lines = red.stderr.split('\n').filter((l) => /^FAIL {2}\S+: /.test(l));
  ok(red.status === 1 && lines.length === 1 && /assets\/js\/loader\.js: \/assets\/js\/worker\.min\.js: .*\(fix: npm run build:min\)/.test(lines[0]) && /^FAIL {2}stamps {2}1 of 9 references stale/m.test(red.stderr),
    `C2 on a stale tree: exit 1, one FAIL line per stale reference with the fix, then the FAIL result line: ${red.status} ${red.stderr}`);
} catch (err) {
  problems.push('crashed: ' + (err.stack || err.message).split('\n').slice(0, 3).join(' '));
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}

if (problems.length) {
  console.log(`FAIL script=scripts/test-stamps.mjs check="${problems[0].slice(0, 200).replace(/"/g, "'")}" cause=checks-failed`);
  problems.forEach((p) => console.log('  - ' + p));
  console.log(`FAIL  stamps-test  ${checks - problems.length}/${checks} checks`);
  process.exit(1);
}
console.log(`PASS  stamps-test  ${checks} checks`);
