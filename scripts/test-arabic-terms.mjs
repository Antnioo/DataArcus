// The website's Arabic terms (0.3.1 E): every Arabic text of the site's tools, engines and data (assets/) and of the
// Arabic pages (ar/) uses the terminology sheet's one term per concept (assets/data/arabic-report-words.json
// `concepts`, read by mcp/lib/arabic-terms.mjs: node:fs only, no MCP package needed), and each Arabic page that names a
// slicer or a tooltip gives the English once, at its first use, and carries «داتا أركوس» once in its keywords (search). The blog's published articles are reported, not
// checked (the sheet's allow-list). The MCP's own texts are checked by mcp/test-0.3.1-arabic-terms.mjs. No network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONCEPTS, repoHits, repoFiles, englishOnceProblem, keywordsProblem } from '../mcp/lib/arabic-terms.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = []; let checks = 0;
const hits = repoHits(ROOT, ['assets', 'ar']);
for (const c of CONCEPTS.filter((k) => k.variants.length)) { checks++; if ((hits[c.id] || []).length) fails.push(`${c.id}: ${hits[c.id].length} texts use another form than «${c.ar}»: ${hits[c.id].slice(0, 8).join('; ')}`); }
const pages = repoFiles(ROOT, ['ar']).filter((p) => p.endsWith('.html') && !p.startsWith('ar/articles/'));
for (const c of CONCEPTS.filter((k) => k.englishOnce)) for (const p of pages) { checks++; const e = englishOnceProblem(fs.readFileSync(path.join(ROOT, p), 'utf8'), c.id); if (e) fails.push(`${p}: ${c.id}: ${e}`); }
for (const p of pages) { checks++; const e = keywordsProblem(fs.readFileSync(path.join(ROOT, p), 'utf8')); if (e) fails.push(`${p}: ${e}`); }
if (fails.length) { fails.forEach((f) => console.log('  - ' + f)); console.log(`FAIL  test-arabic-terms  ${fails.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-arabic-terms  ${checks} checks`);
