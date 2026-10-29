// Links to this repo on GitHub (SQ11, DS1-S4: the MCP page's PRIVACY.md and README anchors were checked by eye only):
// every github.com/Antnioo/DataArcus/blob/<branch>/<path> link in the repo's tracked files names a file that is here,
// and its #anchor is a heading of that file as GitHub makes it (or #L<n>, a line the file has). A renamed heading or a
// moved file fails here, before a visitor's click lands on the top of the page or on a 404.
// Runs in Node, no browser:  node scripts/tests/github-links.mjs   (run-all.mjs runs it as "github-links")
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LINK = /https?:\/\/github\.com\/antnioo\/dataarcus\/blob\/([^/\s"'<>)`]+)\/([^\s"'<>)`#?]+)(#[^\s"'<>)`]*)?/gi;
const TEXT = /\.(html|js|mjs|md|txt|xml|json|yml|webmanifest)$/i;

// the files git tracks (the site as deployed and the repo as published); a walk where git is not there
const tracked = () => {
  const g = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' });
  if (g.status === 0 && g.stdout) return g.stdout.split('\0').filter(Boolean);
  const out = [], walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).forEach((e) => {
    const r = d ? `${d}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walk(r); } else out.push(r);
  });
  walk(''); return out;
};

// GitHub's heading anchors (github-slugger): lower case, every character but letters, marks, numbers, "_", "-" and
// spaces dropped, spaces to "-"; a repeated heading gets -1, -2 ...; inline code, links and emphasis read as their text
export const slug = (h) => h.trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');
export function anchorsOf(md) {
  const seen = new Map(), out = new Set(); let fence = null;
  for (const line of md.replace(/\r\n/g, '\n').split('\n')) {
    const f = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; continue; }
    if (fence) continue;
    const m = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (m) {
      const text = m[1].replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, '').replace(/[`*_]{1,3}([^`*_]+)[`*_]{1,3}/g, '$1');
      const base = slug(text), n = seen.get(base) || 0; seen.set(base, n + 1); out.add(n ? `${base}-${n}` : base);
    }
    for (const a of line.matchAll(/<a\s+[^>]*(?:id|name)="([^"]+)"/gi)) out.add(a[1]);
  }
  return out;
}

export default async function run() {
  const problems = []; let checks = 0;
  const files = tracked().filter((f) => TEXT.test(f) && !/(^|\/)node_modules\//.test(f) && !/\.min\.js$/.test(f));
  const anchors = new Map();
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of text.matchAll(LINK)) {
      const [url, , rel, hash] = m, target = decodeURIComponent(rel), where = `${f}: ${url}`;
      checks++;
      const p = path.join(ROOT, target);
      if (!fs.existsSync(p) || !fs.statSync(p).isFile()) { problems.push(`${where}: ${target} is not a file in this repo`); continue; }
      if (!hash || hash === '#') continue;
      checks++;
      const id = decodeURIComponent(hash.slice(1)), body = fs.readFileSync(p, 'utf8');
      const line = /^L(\d+)(?:-L(\d+))?$/.exec(id);
      if (line) { const n = body.split('\n').length; if (+line[1] > n || +(line[2] || 0) > n) problems.push(`${where}: ${target} has ${n} lines`); continue; }
      if (!/\.md$/i.test(target)) { problems.push(`${where}: an anchor on a file GitHub shows without headings`); continue; }
      if (!anchors.has(target)) anchors.set(target, anchorsOf(body));
      if (!anchors.get(target).has(id)) {
        const near = [...anchors.get(target)].filter((a) => a.split('-').some((w) => w.length > 3 && id.includes(w))).slice(0, 3);
        problems.push(`${where}: #${id} is no heading of ${target}${near.length ? ` (its headings near it: ${near.join(', ')})` : ''}`);
      }
    }
  }
  // the reader itself, on made-up headings, so a pass above means the anchors were compared, not skipped
  const own = anchorsOf('# Title\n## 3. Metadata only: no data values\n## Other MCP clients and platforms (developers)\n```\n## not a heading\n```\n## Notes\n## Notes\n<a id="kept"></a>\n## `code` and [a link](x.md)');
  for (const a of ['title', '3-metadata-only-no-data-values', 'other-mcp-clients-and-platforms-developers', 'notes', 'notes-1', 'kept', 'code-and-a-link']) { checks++; if (!own.has(a)) problems.push(`the anchor reader misses "${a}" (${[...own].join(', ')})`); }
  checks++; if (own.has('not-a-heading')) problems.push('the anchor reader read a heading inside a code block');
  checks++; if (!files.some((f) => /\.html$/.test(f))) problems.push('no tracked site page was read');
  return { checks, problems };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await run();
  if (r.problems.length) { console.log(`FAIL  github-links  ${r.problems.length} of ${r.checks} checks failed`); r.problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
  console.log(`PASS  github-links  ${r.checks} checks`);
}
