// DataArcus's own Arabic vocabulary (0.3.1 E; the Arabic review of 21 Oct found one concept written several ways across
// the engines): one Arabic term per concept, read from the terminology sheet's `concepts` in the fixed list
// (assets/data/arabic-report-words.json), the one source. Here only the reading and the check of a text against it:
// node:fs and nothing else (no process, no write), so the website's check (scripts/test-arabic-terms.mjs) runs it without the MCP's packages.
// The engines keep writing their own fixed texts; mcp/test-0.3.1-arabic-terms.mjs fails when one of them, or any
// Arabic text of the repo outside the sheet's allow-list, uses another form of a concept. Never applied to a user's
// approved label or a model's own name: those are never rewritten.
import fs from 'node:fs';

const LIST = JSON.parse(fs.readFileSync(new URL('../../assets/data/arabic-report-words.json', import.meta.url), 'utf8'));
export const CONCEPTS = LIST.concepts || [];
export const ALLOW = (LIST.allow || []).map((a) => ({ ...a, re: new RegExp(a.path) }));

// a term may follow a clitic (و ف ب ك ل, or لل for ل + ال) and end with a pronoun; not inside a longer word
const LETTER = '\\u0621-\\u064A\\u066E-\\u06D3';
const BEFORE = `(?<![${LETTER}])(?:[وفبكل]|لل)?`, AFTER = `(?:ها|هم|ه|ك|نا)?(?![${LETTER}])`;
const re = (src) => new RegExp(BEFORE + src + AFTER, 'gu');
const COMPILED = CONCEPTS.map((c) => ({ c, variants: (c.variants || []).map((v) => ({ src: v, re: re(v) })), form: c.form ? re(c.form) : null }));
// diacritics, the dagger alif and the tatweel folded: «مقسّم» is «مقسم»
export const fold = (s) => String(s == null ? '' : s).replace(/[ً-ْٰـ]/g, '');

/** The variants in one text: [{ id, variant, preferred, at }] (a concept's allowIn context, e.g. a page's keywords, passes). */
export function termHits(text, o) {
  const t = fold(text), out = [];
  for (const { c, variants } of COMPILED) {
    if (c.allowIn && o && o.context === c.allowIn) continue;
    for (const v of variants) for (const m of t.matchAll(v.re)) out.push({ id: c.id, variant: m[0], preferred: c.ar, at: m.index });
  }
  return out;
}

/** A concept's chosen form (for the "English once" check), as a pattern. */
export const formOf = (id) => { const x = COMPILED.find((k) => k.c.id === id); return x && x.form ? new RegExp(x.form.source, 'gu') : null; };

/** Why a path is allowed to keep variants, or null. */
export const allowed = (p) => { const a = ALLOW.find((x) => x.re.test(p)); return a ? a.why : null; };

// a line inside a page's or a translation's keywords (the product's Arabic spelling and the Microsoft dashboard term stay
// there, for search)
export const KEYWORDS = /name=["']keywords["']|["']?keywords["']?\s*:/i;

// (0.3.3 AR7, D-1112-05) the key a text sits under, so a failure names the file, the key and the word: the last
// `key:` before the word on its line ("heroTitle": '...', WHY's missingTable: [...]), else the key the line above ends
// with (a text wrapped under its key); null in running text (an HTML page, a sentence built in code)
const KEY = /(?:^|[\s{,(\[])["']?([A-Za-z_$][\w$.-]*)["']?\s*:(?!:)/g;
const keyBefore = (s) => { let k = null; for (const m of s.matchAll(KEY)) k = m[1]; return k; };
export function keyOf(lines, i, at) {
  const here = keyBefore(lines[i].slice(0, at == null ? lines[i].length : at));
  if (here) return here;
  const m = i > 0 ? /^\s*["']?([A-Za-z_$][\w$.-]*)["']?\s*:\s*$/.exec(lines[i - 1]) : null;
  return m ? m[1] : null;
}

/** Every variant in a file's text, line by line: [{ line, key, id, variant, preferred }] (key: see keyOf). */
export function fileHits(text) {
  const out = [], lines = String(text).split('\n');
  lines.forEach((l, i) => {
    if (!/[ء-ي]/.test(l)) return;
    // the fold drops marks before the word, so the key is looked for before the word's first letter in the raw line
    for (const h of termHits(l, { context: KEYWORDS.test(l) ? 'keywords' : null })) out.push({ line: i + 1, key: keyOf(lines, i, l.indexOf(h.variant.slice(0, 2)) < 0 ? null : l.indexOf(h.variant.slice(0, 2))), ...h });
  });
  return out;
}

/** The repo's text files under root (relative paths, '/' separated), without .git, node_modules and dot folders. */
export function repoFiles(root, under) {
  const out = [], EXT = /\.(js|mjs|cjs|json|html|md|txt|yml|xml|webmanifest|tmdl|dax|csv)$/;
  const walk = (rel) => {
    for (const d of fs.readdirSync(rel ? `${root}/${rel}` : root, { withFileTypes: true })) {
      if (d.name.startsWith('.') || d.name === 'node_modules') continue;
      const p = rel ? `${rel}/${d.name}` : d.name;
      if (d.isDirectory()) walk(p); else if (EXT.test(d.name)) out.push(p);
    }
  };
  (under || ['']).forEach((u) => { if (!u || fs.existsSync(`${root}/${u}`)) walk(u); });
  return out.sort();
}

/** Every variant outside the allow-list: { [conceptId]: ['path:line «variant»', ...] }. */
export function repoHits(root, under) {
  const by = {};
  for (const p of repoFiles(root, under)) {
    if (allowed(p)) continue;
    for (const h of fileHits(fs.readFileSync(`${root}/${p}`, 'utf8'))) (by[h.id] = by[h.id] || []).push(`${p}:${h.line}${h.key ? ' key ' + h.key : ''} «${h.variant}» (sheet: «${h.preferred}»)`);
  }
  return by;
}

/** An Arabic page's visible text uses a concept with englishOnce: its first use must be followed by the English, once
 *  ("مقسم طريقة العرض (Slicer)"). Returns a problem or null. */
export function englishOnceProblem(html, id) {
  const c = CONCEPTS.find((k) => k.id === id), form = formOf(id);
  if (!c || !form) return null;
  const body = fold(String(html).replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ''));
  const m = form.exec(body);
  if (!m) return null;
  const after = body.slice(m.index + m[0].length, m.index + m[0].length + 30);
  const en = new RegExp(`^\\s*\\(${c.englishOnce}s?\\)`, 'i');
  if (!en.test(after)) return `first «${m[0]}» is not followed by (${c.englishOnce})`;
  const again = body.split(new RegExp(`\\(${c.englishOnce}s?\\)`, 'gi')).length - 1;
  return again > 1 ? `(${c.englishOnce}) given ${again} times (once is enough)` : null;
}

/** An Arabic page of the site carries the product's Arabic spelling once, in its keywords (search; the owner, 25 Oct:
 *  "add the arabic dataarcus"). Returns a problem or null. */
export function keywordsProblem(html) {
  const m = /<meta[^>]+name=["']keywords["'][^>]*>/i.exec(String(html));
  if (!m) return 'no keywords meta';
  const n = fold(m[0]).split(/داتا ?أركوس/).length - 1;
  return n === 1 ? null : `«داتا أركوس» ${n} times in its keywords (once)`;
}

// (0.3.3 AR7, D-1112-05) the glossary a person reads, content/ARABIC-GLOSSARY.md, is this sheet rendered: one row per
// concept (English, the Arabic, Microsoft's word and Google's with where each was read, why the term stands, where it
// is used). Written by scripts/arabic-glossary.mjs --write; mcp/test-0.3.3-ar7.mjs fails when the file and the sheet differ.
export const APPROVALS = { 'D-1112-05': 'both use it (D-1112-05)', owner: 'the owner\'s own', 'one source': 'one source only: a new line waits' };
const links = (src) => (Array.isArray(src) ? src.map((u, i) => `[${i + 1}](${u})`).join(' ') : src || 'not read');
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|');
/** A concept's approval problem, or null: 'D-1112-05' needs both words, both sources and the date they were read. */
export function approvalProblem(c) {
  if (!Object.keys(APPROVALS).includes(c.approval)) return `approval is ${JSON.stringify(c.approval)}`;
  if (c.approval !== 'D-1112-05') return null;
  if (!c.microsoft || !Array.isArray(c.source) || !c.source.length) return 'D-1112-05 without Microsoft\'s word and source';
  if (!c.google || !Array.isArray(c.googleSource) || !c.googleSource.length) return 'D-1112-05 without Google\'s word and source';
  if (!c.googleSource.every((u) => /^https:\/\/(support|developer|cloud)\.google\.com\/|^https:\/\/developer\.android\.com\//.test(u))) return 'a Google source that is not Google\'s own page';
  if (!/^\d{4}-\d\d-\d\d$/.test(c.read || '')) return 'D-1112-05 without the date its sources were read';
  return null;
}
export function glossaryMd() {
  const rows = CONCEPTS.map((c) => `| ${cell(c.id)} | ${cell(c.en)} | ${cell(c.ar)} | ${cell(c.microsoft || 'none found')} ${c.microsoft ? links(c.source) : ''} | ${cell(c.google || (c.googleSource ? 'none found' : 'not read'))} ${c.google ? links(c.googleSource) : ''} | ${APPROVALS[c.approval] || c.approval}${c.read ? ', read ' + c.read : ''} | ${cell(c.used || 'the tools and the site')} |`.replace(/ +\|/g, ' |'));
  return [
    '# DataArcus Arabic glossary', '',
    'One Arabic term per concept, for every tool and the site. Rendered from the one term sheet,',
    '`assets/data/arabic-report-words.json` (`concepts`): change a term there, then run',
    '`node scripts/arabic-glossary.mjs --write`. Never edit this file by hand: the `ar7` suite fails when it and the sheet differ.',
    'The rule (the owner, 12 Nov 2026, D-1112-05): a term or a line that Microsoft and Google both use for the same thing',
    'in their own Arabic is approved, with both sources and the date read; anything else waits for him',
    '([ARABIC-STYLE.md](ARABIC-STYLE.md#approval-d-1112-05)). The check that every Arabic text uses these terms:',
    '`mcp/lib/arabic-terms.mjs`, run by `mcp/test-0.3.1-arabic-terms.mjs` and `scripts/test-arabic-terms.mjs`',
    '(a failure names the file, the key and the word).', '',
    '| Concept | English | Arabic | Microsoft | Google | Why it stands | Where used |', '|---|---|---|---|---|---|---|',
    ...rows, '',
    `${CONCEPTS.length} concepts: ${CONCEPTS.filter((c) => c.approval === 'D-1112-05').length} that both use, ${CONCEPTS.filter((c) => c.approval === 'owner').length} the owner's own, ${CONCEPTS.filter((c) => c.approval === 'one source').length} with one source only.`,
    'The owner\'s other standing terms (rule 2 and rule 5) are in [ARABIC-STYLE.md](ARABIC-STYLE.md).', '',
  ].join('\n');
}
