// The files the pages load from jsDelivr follow package.json (16 Oct 2026, owner: "I don't want to find something that
// needs to be updated in 100 places"). aos, bootstrap and bootstrap-icons are each named on every page with a version and
// a Subresource Integrity hash (audit AUD-010); package.json is the one place their version is set. After a bump
// (by hand or Dependabot): npm ci, then `npm run pages:deps`, which writes every page's version and hash from
// node_modules (the same bytes jsDelivr serves) and then each page's Content Security Policy (scripts/csp.mjs).
//   node scripts/cdn.mjs           check: exit code 1 and the list when a page names another version or hash
//   node scripts/cdn.mjs --write   write the versions, the hashes and the policies
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { apply, files } from './csp.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const PINS = { ...PKG.dependencies, ...PKG.devDependencies };
const sri = (file) => 'sha384-' + crypto.createHash('sha384').update(fs.readFileSync(file)).digest('base64');
const TAG = /<(script|link)\b[^>]*\b(?:src|href)="https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/"]+\/)?[^@/"]+)@([^/"]+)\/([^"]+)"[^>]*>/g;

// a page with every jsDelivr tag at package.json's version and the hash of that file; problems lists what was not
export function pin(html) {
  const problems = [];
  const out = html.replace(TAG, (tag, kind, pkg, ver, file) => {
    const want = PINS[pkg];
    if (!want) { problems.push(`${pkg}@${ver}: not in package.json (add it, pinned exactly)`); return tag; }
    if (!/^\d+\.\d+\.\d+$/.test(want)) { problems.push(`${pkg}: package.json must pin an exact version, not ${want}`); return tag; }
    const local = path.join(ROOT, 'node_modules', pkg, file);
    if (!fs.existsSync(local)) { problems.push(`${pkg}/${file}: not in node_modules (run npm ci)`); return tag; }
    const installed = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', pkg, 'package.json'), 'utf8')).version;
    if (installed !== want) { problems.push(`${pkg}: node_modules has ${installed}, package.json ${want} (run npm ci)`); return tag; }
    let t = tag.replace(`/npm/${pkg}@${ver}/`, `/npm/${pkg}@${want}/`);
    const hash = sri(local);
    t = /\sintegrity="[^"]*"/.test(t) ? t.replace(/\sintegrity="[^"]*"/, ` integrity="${hash}"`) : t.replace(/(\s(?:src|href)="[^"]*")/, `$1 integrity="${hash}"`);
    if (!/\scrossorigin=/.test(t)) t = t.replace(/(\sintegrity="[^"]*")/, '$1 crossorigin="anonymous"');
    return t;
  });
  return { html: out, problems };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write'), stale = [], problems = new Set();
  let loading = 0;
  for (const f of files()) {
    const file = path.join(ROOT, f), html = fs.readFileSync(file, 'utf8'), r = pin(html);
    r.problems.forEach((p) => problems.add(p));
    if (TAG.test(html)) loading++;
    TAG.lastIndex = 0;
    const want = write ? apply(r.html) : r.html;
    if (want !== html) { stale.push(f); if (write) fs.writeFileSync(file, want); }
  }
  if (problems.size) { console.log(`Not done:\n  ${[...problems].join('\n  ')}`); process.exit(1); }
  if (write) console.log(stale.length ? `Wrote the jsDelivr versions, hashes and policies of ${stale.length} pages.` : 'Every page already follows package.json.');
  else if (stale.length) { console.log(`${stale.length} pages name another version or hash than package.json (npm run pages:deps):\n  ${stale.join('\n  ')}`); process.exit(1); }
  else console.log(`All ${loading} pages that load from jsDelivr name package.json's versions and their hashes.`);
}
