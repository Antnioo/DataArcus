// OP1 (0.3.2, B-283; the owner's D-1016-01 "I don't want to find something that needs to be updated in 100 places";
// mcp/work/OP1.md): one place per fact for the text sizes and the fonts. text-measure.js owns the measured heights
// (a text box, a button, a dropdown slicer), Power BI's text size range (8-60) and the font catalog; design-engine.js
// owns the default page. Everything else reads them, and this suite fails if one is written a second time.
// The one change in behaviour: the writer's and the checker's button heights agree (6 + 1.6 x pt a line, the laptop's
// measured Arabic rule, DESKTOP-TESTS.md 2026-10-01). Written red first on e75d432. No model, no data.
//   node test-0.3.2-op1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = typeof msg === 'function' ? msg() : msg; } catch (e) { m = String(msg); } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const TM = require('../assets/js/text-measure.js'), TMmin = require('../assets/js/text-measure.min.js');
const E = require('../assets/js/design-engine.js'), Rules = require('../assets/js/report-rules.js'), Sizing = require('../assets/js/pbip-sizing.js');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const list = (dir, re) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => re.test(f)).map((f) => `${dir}/${f}`);

// The engine code the guard reads: the website's engines (not their .min.js, built from them) and the MCP's code
const CODE = [...list('assets/js', /^(?!.*\.min\.js$).*\.js$/), ...list('mcp/lib', /\.mjs$/), ...list('mcp/tools', /\.mjs$/), 'mcp/server.mjs'];
const OWNER = 'assets/js/text-measure.js', PAGE_OWNER = 'assets/js/design-engine.js';
// code only: block comments and line comments out (a // inside a string after a quote or a colon, a URL, is kept);
// lines split on CRLF too (a Windows checkout: "." does not match the "\r" before a line's end)
const codeOf = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\r\n]/g, ' ')).split(/\r?\n/).map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'));
const hits = (re, files, skip) => files.filter((f) => !skip.includes(f)).flatMap((f) => codeOf(read(f)).map((l, i) => (re.test(l) ? `${f}:${i + 1}` : null)).filter(Boolean));

// ---------- S1: the owner exports every fact (and its .min.js the same) ----------
{
  const keys = ['boxH', 'buttonH', 'slicerH', 'ptIn', 'measuredFont'];
  chk(() => keys.every((k) => typeof TM[k] === 'function' && typeof TMmin[k] === 'function') && TM.TEXT_MIN === 8 && TM.TEXT_MAX === 60 && TMmin.TEXT_MAX === 60,
    () => `S1a. text-measure.js exports ${keys.join(', ')}, TEXT_MIN 8, TEXT_MAX 60: ${keys.filter((k) => typeof TM[k] !== 'function').join(', ') || 'functions there'}; range ${TM.TEXT_MIN}-${TM.TEXT_MAX}`);
  chk(() => JSON.stringify(TM.FONTS) === JSON.stringify(['Segoe UI', 'Segoe UI Semibold', 'DIN', 'Arial', 'Calibri', 'Tahoma', 'Verdana', 'Georgia'])
    && JSON.stringify(TM.AR_FONTS) === JSON.stringify(['Segoe UI', 'Segoe UI Semibold', 'Arial', 'Tahoma']) && JSON.stringify(TM.MEASURED_FONTS) === JSON.stringify(['Segoe UI', 'Tahoma'])
    && JSON.stringify(TMmin.FONTS) === JSON.stringify(TM.FONTS) && Object.isFrozen(TM.FONTS) && Object.isFrozen(TM.AR_FONTS) && Object.isFrozen(TM.MEASURED_FONTS),
  () => `S1b. the font catalog (8 offered, 4 with Arabic letters, 2 measured), frozen: ${JSON.stringify([TM.FONTS, TM.AR_FONTS, TM.MEASURED_FONTS])}`);
  chk(() => E.DEFAULT_PAGE === '1920x1080' && JSON.stringify(E.PAGES[E.DEFAULT_PAGE]) === '[1920,1080]' && E.repairState({}).layout.page === E.DEFAULT_PAGE && E.upgrade({ v: 2 }).page === '1280x720',
    () => `S1c. design-engine.js DEFAULT_PAGE 1920x1080 (a new design's page), 1280x720 kept for a design saved before v3: ${E.DEFAULT_PAGE}, ${get(() => E.upgrade({ v: 2 }).page)}`);
}

// ---------- S2: the measured numbers (unchanged, and the button's agreed rule) ----------
{
  const got = get(() => ({ box: [TM.boxH(8), TM.boxH(10, 2), TM.boxH(15)], btn: [TM.buttonH(8), TM.buttonH(15), TM.buttonH(10, 1), TM.buttonH(10, 2), TM.buttonH(14, 1), TM.buttonH(14, 2)], sl: [TM.slicerH(10), TM.slicerH(15)] }));
  chk(() => JSON.stringify(got) === JSON.stringify({ box: [25, 46, 37], btn: [19, 30, 22, 38, 29, 51], sl: [56, 76] }),
    () => `S2a. box 10 + 1.8 x pt a line, button 6 + 1.6 x pt a line, dropdown 16 + 4 x pt: ${JSON.stringify(got)}`);
  chk(() => [7, 8, 8.4, 8.6, 12.5, 60, 61, 100].map(TM.ptIn).join() === '8,8,8,9,13,60,60,60', () => `S2b. ptIn: a whole point within 8-60: ${get(() => [7, 8, 8.4, 8.6, 12.5, 60, 61, 100].map(TM.ptIn).join())}`);
  chk(() => ['Segoe UI', "'Segoe UI'", 'tahoma, sans-serif', '', null].every(TM.measuredFont) && !['Verdana', 'Segoe UI Semibold', 'Arial'].some(TM.measuredFont),
    () => 'S2c. measuredFont: Segoe UI and Tahoma (any case, quoted, first of a list; none means the theme\'s), not Verdana, Semibold, Arial');
}

// ---------- S3: the writer and the checker agree on every height (they did not on the button: 4 px, and lines) ----------
{
  const Z = Sizing.make({ font: 'Segoe UI', LABEL: 10 }), M = Rules.MEASURED, off = [];
  for (let t = 8; t <= 60; t += 0.5) for (const n of [1, 2, 3]) {
    if (M.BTN_H(t, n) !== Z.buttonH(t, n)) off.push(`button ${t}pt x${n}: checker ${M.BTN_H(t, n)}, writer ${Z.buttonH(t, n)}`);
    if (M.BOX(t, n) !== Z.boxH(t, n)) off.push(`box ${t}pt x${n}: checker ${M.BOX(t, n)}, writer ${Z.boxH(t, n)}`);
    if (n === 1 && M.SLICER(t) !== Z.slicerH(t)) off.push(`dropdown ${t}pt: checker ${M.SLICER(t)}, writer ${Z.slicerH(t)}`);
  }
  chk(() => !off.length, () => `S3a. the checker's and the writer's heights, 8-60pt, 1-3 lines: ${off.length} differ, first ${off.slice(0, 3).join('; ')}`);
  chk(() => Z.buttonH(8) === TM.buttonH(8) && M.BTN_H(10, 2) === TM.buttonH(10, 2) && Z.resetFit('', 0, 1 / 3).h === TM.buttonH(10) && M.TEXT_MIN === TM.TEXT_MIN && M.TEXT_MAX === TM.TEXT_MAX,
    () => `S3b. both read text-measure.js (the Reset at 10pt on a 360 page: ${get(() => Z.resetFit('', 0, 1 / 3).h)} for ${get(() => TM.buttonH(10))})`);
  chk(() => E.FONTS === TM.FONTS && E.AR_FONTS === TM.AR_FONTS && E.MEASURED_FONTS === TM.MEASURED_FONTS,
    () => 'S3c. design-engine.js FONTS, AR_FONTS, MEASURED_FONTS are text-measure.js\'s own (not copies)');
}

// ---------- G: the guard: a formula, the range, a font list or the default page written outside its owner ----------
{
  const FORMULA = /\b10\s*\+\s*1\.8\s*\*|\b[26]\s*\+\s*1\.6\s*\*|\b16\s*\+\s*4\s*\*/;
  const RANGE = /Math\.min\(\s*60\s*,\s*Math\.max\(\s*8\b|Math\.max\(\s*8\s*,\s*Math\.min\(\s*60\b/;
  const formula = hits(FORMULA, CODE, [OWNER]), range = hits(RANGE, CODE, [OWNER]);
  chk(() => !formula.length, () => `G1. a sizing formula (10 + 1.8 x, 2 or 6 + 1.6 x, 16 + 4 x) written outside ${OWNER}: ${formula.join(', ')}`);
  chk(() => !range.length, () => `G2. the 8-60 text size range written outside ${OWNER}: ${range.join(', ')}`);
  // two or more catalog font names quoted on one code line is a list of fonts
  const names = TM.FONTS || ['Segoe UI', 'Segoe UI Semibold', 'DIN', 'Arial', 'Calibri', 'Tahoma', 'Verdana', 'Georgia'];
  const quoted = new RegExp(`(['"\`])(${names.map((n) => n.replace(/ /g, ' ')).join('|')})\\1`, 'gi');
  const fontLists = CODE.filter((f) => f !== OWNER).flatMap((f) => codeOf(read(f)).map((l, i) => (new Set((l.match(quoted) || []).map((q) => q.slice(1, -1).toLowerCase())).size >= 2 ? `${f}:${i + 1}` : null)).filter(Boolean));
  const pages = ['tools/power-bi-theme-generator.html', 'ar/tools/power-bi-theme-generator.html', 'tools/power-bi-theme-generator-lab.html'];
  const options = pages.filter((p) => new RegExp(`<option[^>]*>\\s*(${names.join('|')})\\s*</option>`, 'i').test(read(p)));
  chk(() => !fontLists.length && !options.length, () => `G3. the font list written outside ${OWNER}: code ${fontLists.join(', ') || 'none'}; <option> copies ${options.join(', ') || 'none'}`);
  // the default page: '1920x1080' as a value, and a 1920 / 1080 default, only in design-engine.js; the TK1 files read it
  // after TK1 merges (mcp/work/OP1.md, "Follow-up"); check-report.mjs lists Power BI's standard sizes, not the default
  const LATER = ['mcp/lib/tool-limits.mjs', 'mcp/lib/tool-inputs.mjs', 'mcp/tools/plan_layout.mjs', 'mcp/lib/check-report.mjs'];
  const page = hits(/['"`]1920x1080['"`]|default\(1920\)|default\(1080\)/, CODE, [PAGE_OWNER, ...LATER]);
  chk(() => !page.length, () => `G4. the default page written outside ${PAGE_OWNER}: ${page.join(', ')}`);
  // the guard sees what it guards (its own patterns on a sample, so a broken pattern cannot pass silently)
  chk(() => FORMULA.test('Math.ceil(2 + 1.6 * t)') && FORMULA.test('Math.ceil(16 + 4 * t)') && FORMULA.test('10+1.8*t') && !FORMULA.test('// 10 + 1.8 x pt') && RANGE.test('Math.min(60, Math.max(8, v))')
    && codeOf("const a = 1; // ['Segoe UI', 'Tahoma']")[0].match(quoted) === null && codeOf("x();\r\n// 'Segoe UI' or 'Arial'\r\n")[1].match(quoted) === null && (codeOf("const F = ['Segoe UI', 'Tahoma'];")[0].match(quoted) || []).length === 2,
  () => 'G5. the guard\'s own patterns catch a formula, the range and a font list in code, not in a comment (CRLF lines too)');
}

// ---------- P: the pages: the font choices come from the catalog; text-measure.js loads before design-engine.js ----------
{
  const pages = ['tools/power-bi-theme-generator.html', 'ar/tools/power-bi-theme-generator.html', 'tools/power-bi-theme-generator-lab.html'];
  const order = pages.map((p) => { const h = read(p); return [p, h.search(/text-measure\.min\.js/), h.search(/design-engine\.min\.js/)]; });
  chk(() => order.every(([, a, b]) => a > 0 && b > 0 && a < b), () => `P1. text-measure.js before design-engine.js on every generator page: ${JSON.stringify(order)}`);
  const tg = read('assets/js/theme-generator.js');
  chk(() => /E\.FONTS\.map\(/.test(tg) && /E\.DEFAULT_PAGE/.test(tg), () => 'P2. theme-generator.js renders the font options from E.FONTS and the page choices around E.DEFAULT_PAGE');
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-op1.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  op1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  op1  ${checks} checks`);
