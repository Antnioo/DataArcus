// DD1F (0.3.2; the owner D-1104-12 "a library of functions where a place calls them so if we need to fix something we
// fix it at the source", D-1104-15, D-1104-18, D-1016-01): one answer to "is this text Arabic?". The character class
// lives in assets/js/arabic-script.js only (mcp/docs/CONTRACTS.md, family 1f).
//   U1  the probe's 11 texts plus null, undefined, '' and a number: hasArabic pinned (15 texts)
//   U2  ARABIC is one regex with no g flag (so .test never keeps a lastIndex), the module frozen
// Made-up texts only.   node test-0.3.2-dd1f.mjs
import { createRequire } from 'node:module';

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

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1f  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1f  ${checks} checks`);
