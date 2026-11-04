// The ?v= stamps of the site's pages and engines, made by the build, never typed (ST1, 0.3.2; D-1016-01, D-1104-12).
//   node scripts/stamps.mjs           check: every ?v= reference to a local file holds that file's current stamp
//   node scripts/stamps.mjs --list    every ?v= reference: its file, the target it points at, whether the target exists
//   node scripts/stamps.mjs --write   the build (npm run build:min, after the .min.js rebuild): every reference gets
//                                     its target's stamp, in dependency order (a loader after the files it loads)
// A stamp is the first 12 hex of the sha256 of the target's final bytes, text read with LF line endings (the laptop's
// CRLF checkout agrees), so it changes exactly when the file changes. External URLs are left alone. The MCP loads the
// source files with no query string: nothing here changes how it loads.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// the files that hold references: the pages and the engines (the .min.js are built from them, the tests pin nothing)
// (a .min.js is checked too; the build rebuilds it from its source instead of writing it)
const HOLDER = /\.(html|js|css)$/i, NOT_HOLDER = /(^|\/)(node_modules|mcp|scripts|lab)\/|\.min\.css$/i;
const TEXT = /\.(js|mjs|css|svg|html|json|txt|xml)$/i;
// a reference: a local path ending in a file's extension, then ?v=<stamp>; it starts after a quote, a bracket, a space or a comma
const REF = /(?<=["'(\s,=])([^\s"'()<>,=`]+?\.(?:js|css|svg|jpe?g|png|webp|gif|ico|json|woff2?))\?v=([\w.-]*)/gi;
// the site's own address is the site's own file (an article's og:image); any other address is left alone
const OWN = /^https:\/\/dataarcus\.com(?=\/)/i, EXTERNAL = /^([a-z]+:|\/\/|\$\{)/i;
const local = (ref) => ref.replace(OWN, '');

// one helper: the stamp of a file's final bytes (sha256, LF line endings for text, the first 12 hex)
export function stampOf(file) {
  const raw = fs.readFileSync(file);
  const bytes = TEXT.test(file) ? Buffer.from(raw.toString('utf8').replace(/\r\n/g, '\n'), 'utf8') : raw;
  return crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
}
export const isStamp = (s) => /^[0-9a-f]{12}$/.test(s);

// the files that hold references in a tree: git's list in a repository, else every file under root (a test's fixture)
export function holders(root) {
  let all;
  try { all = execSync('git ls-files', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean); } catch (e) { all = null; }
  if (!all || !all.length || path.resolve(execSync('git rev-parse --show-toplevel', { cwd: root, encoding: 'utf8' }).trim()) !== path.resolve(root)) {
    const walk = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.posix.join(d, e.name)) : [path.posix.join(d, e.name)]);
    all = walk('.').map((f) => f.replace(/^\.\//, ''));
  }
  return all.filter((f) => HOLDER.test(f) && !NOT_HOLDER.test(f) && fs.existsSync(path.join(root, f))).sort();
}

// a reference's target, from the file that holds it: '/x' from the root; 'x' next to the file; in a script, a path made
// for the page that loads it ('../assets/js/x.min.js' in assets/js/theme-generator.js) falls back to the path without its leading ../
export function targetOf(root, from, ref) {
  if (ref.startsWith('/')) return path.posix.normalize(ref.slice(1));
  const near = path.posix.normalize(path.posix.join(path.posix.dirname(from), ref));
  if (/\.html$/i.test(from) || fs.existsSync(path.join(root, near))) return near;
  return path.posix.normalize(ref.replace(/^(\.\.?\/)+/, ''));
}

// every ?v= reference in the tree: { file, ref, stamp, target, exists, kind, index }
export function scan(root, files = holders(root)) {
  const out = [];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    for (const m of text.matchAll(REF)) {
      if (EXTERNAL.test(local(m[1]))) continue;
      const target = targetOf(root, file, local(m[1]));
      out.push({ file, ref: m[1], stamp: m[2], target, exists: fs.existsSync(path.join(root, target)), kind: path.extname(m[1]).slice(1).toLowerCase(), index: m.index });
    }
  }
  return out;
}

// the stale references: each with its fix
export function check(root, files) {
  const refs = scan(root, files), stale = [];
  for (const r of refs) {
    if (!r.exists) stale.push(Object.assign({ why: `points at ${r.target}, which is not there` }, r));
    else { const want = stampOf(path.join(root, r.target)); if (r.stamp !== want) stale.push(Object.assign({ why: `?v=${r.stamp || '(empty)'} is not ${r.target}'s stamp ${want}`, want }, r)); }
  }
  return { refs, stale };
}

// the build: the holders in dependency order (a file after every file it loads, and a .min.js rebuilt from its source
// right after the source's stamps change), each reference given its target's stamp. A second run changes nothing.
export async function build(root, files = holders(root), { minify } = {}) {
  const minOf = minify || (await import('./check-min.mjs')).minOf;
  const refs = scan(root, files), byFile = new Map(files.map((f) => [f, []]));
  refs.forEach((r) => byFile.get(r.file).push(r));
  // a target's node: a .min.js built from a source is its source, any other holder itself
  const srcOf = (t) => (/\.min\.js$/i.test(t) && byFile.has(t.replace(/\.min\.js$/i, '.js')) ? t.replace(/\.min\.js$/i, '.js') : byFile.has(t) ? t : null);
  const order = [], state = new Map();
  const visit = (f, trail) => {
    if (state.get(f) === 'done') return;
    if (state.get(f) === 'open') throw new Error(`stamps: a loop of references, ${[...trail, f].join(' -> ')}: no stamp can be built`);
    state.set(f, 'open');
    for (const r of byFile.get(f)) { const s = srcOf(r.target); if (s && s !== f) visit(s, [...trail, f]); }
    state.set(f, 'done'); order.push(f);
  };
  files.forEach((f) => visit(f, []));
  const changed = [], missing = [];
  const fromSource = (f) => /\.min\.js$/i.test(f) && byFile.has(f.replace(/\.min\.js$/i, '.js'));
  for (const f of order.filter((x) => !fromSource(x))) {
    const abs = path.join(root, f), text = fs.readFileSync(abs, 'utf8');
    const next = text.replace(REF, (all, ref, stamp) => {
      if (EXTERNAL.test(local(ref))) return all;
      const t = targetOf(root, f, local(ref));
      if (!fs.existsSync(path.join(root, t))) { missing.push(`${f}: ${ref} (${t} is not there)`); return all; }
      return `${ref}?v=${stampOf(path.join(root, t))}`;
    });
    if (next !== text) { fs.writeFileSync(abs, next); changed.push(f); }
    const min = f.replace(/\.js$/i, '.min.js');
    if (/\.js$/i.test(f) && !/\.min\.js$/i.test(f) && fs.existsSync(path.join(root, min))) {
      const built = await minOf(next.replace(/\r\n/g, '\n')), cur = fs.readFileSync(path.join(root, min), 'utf8').replace(/\r\n/g, '\n');
      if (built !== cur && built + '\n' !== cur) { fs.writeFileSync(path.join(root, min), built); changed.push(min); }
    }
  }
  return { order, changed, missing };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2] || '';
  if (arg === '--list') {
    const refs = scan(ROOT), kinds = {}, hand = refs.filter((r) => !isStamp(r.stamp)).length;
    for (const r of refs) { console.log(`${r.file}\t${r.ref}?v=${r.stamp}\t${r.target}\t${r.exists ? 'exists' : 'MISSING'}`); kinds[r.kind] = (kinds[r.kind] || 0) + 1; }
    console.log(`\n${refs.length} references in ${new Set(refs.map((r) => r.file)).size} files: ${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} .${k}`).join(', ')}; `
      + `${refs.filter((r) => !r.exists).length} missing targets; ${hand} not a content stamp (typed by hand), ${refs.length - hand} content stamps`);
    console.log(`PASS  stamps-list  ${refs.length} checks`);
  } else if (arg === '--write') {
    const r = await build(ROOT);
    if (r.missing.length) { console.error(`FAIL  stamps  ${r.missing.length} references point at no file:\n  ${r.missing.join('\n  ')}`); process.exit(1); }
    console.log(r.changed.length ? `stamps: ${r.changed.length} files written:\n  ${r.changed.join('\n  ')}` : 'stamps: nothing to change.');
    console.log(`PASS  stamps-write  ${r.order.length} checks`);
  } else if (!arg) {
    const { refs, stale } = check(ROOT);
    if (stale.length) {
      for (const s of stale) console.error(`FAIL  ${s.file}: ${s.ref}: ${s.why} (fix: npm run build:min)`);
      console.error(`FAIL  stamps  ${stale.length} of ${refs.length} references stale (fix: npm run build:min; never type a stamp)`);
      process.exit(1);
    }
    console.log(`PASS  stamps  ${refs.length} checks`);
  } else { console.error(`stamps: unknown option ${arg} (none, --list or --write)`); process.exit(2); }
}
