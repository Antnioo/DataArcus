// DD1F (0.3.2; the owner D-1104-12 "a library of functions where a place calls them so if we need to fix something we
// fix it at the source", D-1104-15, D-1104-18, D-1016-01): one answer to "is this text Arabic?". The character class
// lives in assets/js/arabic-script.js only (mcp/docs/CONTRACTS.md, family 1f).
//   U1  the probe's 11 texts plus null, undefined, '' and a number: hasArabic pinned (15 texts)
//   U2  ARABIC is one regex with no g flag (so .test never keeps a lastIndex), the module frozen
//   P   the parity test: every place of the ledger's 1f (text-measure ARABIC, field-catalog langOf, report-rules
//       headerNeed, pbip-query AR_LETTERS, dax-functions storyLang, report-bind arName, twin-plan arOf in planTwin; run
//       as scripts/contracts-probe.mjs runs them) gives hasArabic's answer on the 15 texts: one answer each
//   S   no place keeps a letter class of its own (AR_SCRIPT, AR_LETTER, AR_COL and the inline ones are gone), each
//       reads arabic-script.js; text-measure ARABIC and pbip-query AR_LETTERS are its ARABIC, the same object
// Made-up texts only.   node test-0.3.2-dd1f.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { FAMILIES, answerOf, placeName, definitions } from '../scripts/contracts-probe.mjs';

const require = createRequire(import.meta.url);
const A = require('../assets/js/arabic-script.js');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// ---- U1: the 15 texts (scripts/contracts-probe.mjs TEXTS, then four odd ones) ----
const TEXTS15 = [
  ["'' (empty)", '', false], ['Sales', 'Sales', false], ['المبيعات', 'المبيعات', true],
  ['U+FEFB (a presentation form B: lam alef)', 'ﻻ', true], ['U+FDF2 (a presentation form A: Allah)', 'ﷲ', true],
  ['U+0750 (the Arabic supplement)', 'ݐ', true], ['U+08A0 (Arabic extended-A)', 'ࢠ', true],
  ['١٢٣ (Arabic-Indic digits)', '١٢٣', true], ['؟ (the Arabic question mark)', '؟', true],
  ['Sales ٢٠٢٤ (Latin and Arabic digits)', 'Sales ٢٠٢٤', true], ['U+200F alone (a direction mark)', '‏', false],
  ['null', null, false], ['undefined', undefined, false], ["'' (empty, again)", '', false], ['12 (a number)', 12, false],
].map(([label, s, want]) => ({ label, s, want }));
TEXTS15.forEach((x) => chk(() => A.hasArabic(x.s) === x.want, () => `U1 hasArabic(${x.label}) = ${A.hasArabic(x.s)}, the rule says ${x.want}`));

// ---- U2: the shape ----
chk(() => A.ARABIC instanceof RegExp && !A.ARABIC.global && !A.ARABIC.sticky && Object.isFrozen(A) && Object.keys(A).join() === 'ARABIC,hasArabic',
  () => 'U2 arabic-script.js must export one frozen { ARABIC (a regex, no g or y flag), hasArabic }');

// ---- P: the parity test, the seven places on every text ----
const f1f = FAMILIES.find((x) => x.id === '1f');
chk(() => f1f && f1f.places.length === 7 && f1f.inputs.length === 11, () => 'P the probe has no family 1f with 7 places and the 11 texts');
for (const place of (f1f ? f1f.places : [])) for (const x of TEXTS15) {
  const got = await answerOf(place, x);
  chk(() => got.key === String(x.want), () => `P ${placeName(place)} on ${x.label}: ${got.shown}, hasArabic says ${x.want}`);
}

// ---- S: no own letter class; the two exported names are arabic-script's own ----
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => fs.readFileSync(path.join(ROOT, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
const OLD = { 'assets/js/text-measure.js': [], 'assets/js/field-catalog.js': ['AR_SCRIPT'], 'assets/js/report-rules.js': ['AR_LETTER'], 'assets/js/pbip-query.js': [],
  'mcp/lib/dax-functions.mjs': [], 'mcp/lib/report-bind.mjs': ['AR_COL'], 'mcp/lib/twin-plan.mjs': [] };
for (const [f, names] of Object.entries(OLD)) {
  const s = src(f), own = names.filter((n) => definitions(s, n).length > 0);
  chk(() => !own.length && /require\('(\.\/|\.\.\/\.\.\/assets\/js\/)arabic-script\.js'\)/.test(s) && (f.endsWith('.mjs') || /root\.DAArabicScript/.test(s)),
    () => `S ${f} keeps a letter class of its own (${own.join(', ')}) or does not read arabic-script.js`);
}
// the named places' own lines: no inline Arabic block left in them
const line = (f, re) => (src(f).split('\n').find((l) => re.test(l)) || '');
[['assets/js/text-measure.js', /const ARABIC = /], ['assets/js/pbip-query.js', /const AR_LETTERS = /], ['mcp/lib/dax-functions.mjs', /export const storyLang = /],
  ['mcp/lib/report-bind.mjs', /export const arName = /], ['mcp/lib/twin-plan.mjs', /const arOf = /], ['assets/js/report-rules.js', /lowW: /], ['assets/js/field-catalog.js', /const langOf = /]]
  .forEach(([f, re]) => chk(() => { const l = line(f, re); return l && !/\\u0600|[\u0600-\u06FF]-/.test(l); }, () => `S ${f}: the place's line keeps an inline Arabic class (${line(f, re).trim().slice(0, 120)})`));
const TM = require('../assets/js/text-measure.js'), Q = require('../assets/js/pbip-query.js');
chk(() => TM.ARABIC === A.ARABIC && Q.AR_LETTERS === A.ARABIC, () => 'S text-measure ARABIC and pbip-query AR_LETTERS must be arabic-script.js ARABIC itself');

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1f  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1f  ${checks} checks`);
