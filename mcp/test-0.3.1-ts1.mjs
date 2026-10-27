// TS1 (0.3.1, the owner's decision of 27 Oct, D-1027-16: "no go for 1.25 in 0.3.1"; mcp/work/TS1.md): on a
// 1920 x 1080 page the theme's text sizes are the 1280 x 720 sizes x 1.25, not x 1.5 (Codex's text-sizes review),
// from one constant; measured heights keep their measured minimums. And 0.2.9-writer-S10 (the owner's yes, 26 Oct,
// SQ13's option (a)): the 197 gap under a shortened rail closes (REFLOW_KEEP 0.45).
// Written red first on d6d3159. Made-up layouts only: no model, no employer data.
//   node test-0.3.1-ts1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const E = require('../assets/js/design-engine.js'), Emin = require('../assets/js/design-engine.min.js'), Pbip = require('../assets/js/pbip-export.js'), Sizing = require('../assets/js/pbip-sizing.js');
const src = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');

const layoutOf = (page, w, h) => Object.assign({ preset: 'exec', page }, w ? { pageW: w, pageH: h } : {});
const themeAt = (page, w, h, Eng) => (Eng || E).buildTheme({ layout: layoutOf(page, w, h) }, 'en');
// the sizes a theme writes: the text classes, then the visual styles the engine sets (TEXT_BASES' and the card's)
const sizesOf = (t) => {
  const tc = t.textClasses, vs = (v, k, p) => t.visualStyles[v]['*'][k][0][p];
  return { label: tc.label.fontSize, title: tc.title.fontSize, header: tc.header.fontSize, callout: tc.callout.fontSize,
    table: vs('tableEx', 'values', 'fontSize'), columnHeaders: vs('tableEx', 'columnHeaders', 'fontSize'), rowHeaders: vs('pivotTable', 'rowHeaders', 'fontSize'),
    slicer: vs('slicer', 'header', 'textSize'), slicerItems: vs('slicer', 'items', 'textSize'), card: vs('card', 'labels', 'fontSize'),
    cardTitle: vs('multiRowCard', 'cardTitle', 'fontSize'), cardValues: vs('multiRowCard', 'dataLabels', 'fontSize') };
};
const want = (b, t, c, v) => ({ label: b, title: t, header: t, callout: c, table: b, columnHeaders: b, rowHeaders: b, slicer: b, slicerItems: b, card: c, cardTitle: t, cardValues: v });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- T1: one constant, the owner's 1.25 ----------
{
  chk(() => E.FHD_TEXT === 1.25, () => `T1a. design-engine exports FHD_TEXT = 1.25 (the owner's decision): ${E.FHD_TEXT}`);
  chk(() => typeof E.textScale === 'function' && E.textScale(720) === 1 && E.textScale(1080) === 1.25 && E.textScale(2160) === 2 && E.textScale(360) === 0.75,
    () => `T1b. textScale: 1 at 720, 1.25 at 1080, 2 at 2160, 0.75 at 360: ${get(() => [720, 1080, 2160, 360].map(E.textScale))}`);
  const de = src('../assets/js/design-engine.js');
  chk(() => (de.match(/FHD_TEXT = /g) || []).length === 1 && /const sizeAt = \(n, h\) => [^\n]*textScale\(h\)/.test(de) && !/h \/ 720\) \* 2/.test(de),
    () => 'T1c. FHD_TEXT is set once and sizeAt reads textScale (no second copy of the page factor for text)');
  chk(() => /D-1027-16/.test(de) && /Codex/.test(de), () => 'T1d. the constant names the owner\'s decision (D-1027-16) and its source (Codex\'s text-sizes review)');
}

// ---------- T2: the theme's text on each page ----------
{
  const cases = [
    ['1920 x 1080', ['1920x1080'], want(12.5, 15, 35, 22.5)],
    ['1280 x 720 (unchanged)', ['1280x720'], want(10, 12, 28, 18)],
    ['960 x 720 (unchanged)', ['960x720'], want(10, 12, 28, 18)],
    ['1366 x 768', ['custom', 1366, 768], want(10.5, 12.5, 29, 18.5)],
    ['3840 x 2160', ['custom', 3840, 2160], want(20, 24, 56, 36)],
    ['640 x 360 (8 at least)', ['custom', 640, 360], want(8, 9, 21, 13.5)]
  ];
  cases.forEach(([name, a, w]) => { const got = get(() => sizesOf(themeAt(...a))); chk(() => same(got, w), () => `T2 ${name}: ${JSON.stringify(got)}, want ${JSON.stringify(w)}`); });
  // every size a whole or half point within 8-60, on every page the engine can make
  const odd = [];
  for (let h = 360; h <= 2160; h += 7) { const s = sizesOf(themeAt('custom', Math.round(h * 16 / 9), h)); Object.entries(s).forEach(([k, v]) => { if (!(v >= 8 && v <= 60 && v * 2 === Math.round(v * 2))) odd.push(`${h}:${k}=${v}`); }); }
  chk(() => !odd.length, () => `T2g. every size a half point within 8-60: ${odd.slice(0, 10).join(', ')}`);
  // the website loads the .min.js: the Theme Generator shows the same numbers
  chk(() => same(get(() => sizesOf(themeAt('1920x1080', 0, 0, Emin))), want(12.5, 15, 35, 22.5)), () => `T2h. design-engine.min.js (the website's Theme Generator) writes the same 1080 sizes: ${JSON.stringify(get(() => sizesOf(themeAt('1920x1080', 0, 0, Emin))))}`);
  const tg = src('../assets/js/theme-generator.js');
  chk(() => /E\.buildTheme\(state/.test(tg) && !/fontSize\s*:/.test(tg) && !/sizeAt|textScale/.test(tg), () => 'T2i. the Theme Generator builds its theme through the engine only (no text size of its own)');
}

// ---------- T3: a theme's page and its rescale follow the same factor ----------
{
  const t720 = themeAt('1280x720'), t1080 = themeAt('1920x1080'), sc = get(() => E.themeScaleOf(t720)), sc1 = get(() => E.themeScaleOf(t1080));
  chk(() => sc.f === 1 && Math.abs(sc1.f - 1.25) < 0.01 && Math.abs(sc1.h - 1080) <= 10 && sc1.f === E.textScale(sc1.h),
    () => `T3a. themeScaleOf gives the theme's page and its text factor: 720 ${JSON.stringify(sc)}, 1080 ${JSON.stringify(sc1)}`);
  const up = get(() => E.scaleTheme(t720, E.textScale(1080) / sc.f));
  chk(() => same(sizesOf(up), sizesOf(t1080)), () => `T3b. a 720 theme rescaled to 1080 by the text factors is the 1080 theme: ${JSON.stringify(get(() => sizesOf(up)))}`);
  const rr = src('lib/report-run.mjs');
  chk(() => /textScale\(hs\[0\]\) \/ sc\.f/.test(rr) && !/hs\[0\] \/ themeH/.test(rr), () => 'T3c. create_report rescales one of our themes by the text factors, never by the page heights');
}

// ---------- T4: measured heights keep their measured minimums ----------
{
  const Z = Sizing.make({ font: 'Segoe UI', LABEL: 12.5 });
  chk(() => Z.pillH(12.5) === 76 && Z.pillH(10) === 79 && Z.pillH(15) === 76, () => `T4a. the pills at 12.5pt (1080 now) 76 high (the measured 72 + 4), 10pt and 15pt as measured: ${[12.5, 10, 15].map((t) => get(() => Z.pillH(t)))}`);
  chk(() => [8, 9, 10, 11, 12, 12.5, 13, 14, 15].every((t) => Z.pillH(t) >= (t <= 9 ? 56 : 72) + 4), () => 'T4b. no pill below its measured minimum (56 to 9pt, 72 from 10pt) and its 4 of room');
  const ins = (page) => E.kpiInset(Object.assign({ preset: 'exec', page, kpiBar: 'start', kpiBarW: 4 }));
  chk(() => ins('1920x1080') - E.toPage(14, { page: '1920x1080' }) === 5 && ins('1280x720') - E.toPage(14, { page: '1280x720' }) === 3, () => `T4c. the KPI title gap beside the bar is the page's (round(5k)), not the text's: ${ins('1920x1080')}, ${ins('1280x720')}`);
  // the top rail's measured rule (DESKTOP-TESTS.md: a dropdown slicer needs 16 + 4 x pt) at the theme's 12.5: 58, inside the range
  const fh = get(() => E.rangeOf('fh', 1280, { preset: 'exec', page: '1920x1080' })[0]);
  chk(() => fh === 58, () => `T4d. the top rail's least height on 1080: the measured rule at 12.5pt, ceil((16 + 50 + 20) / 1.5) = 58: ${JSON.stringify(fh)}`);
}

// ---------- T5: S10, the gap under a shortened rail (REFLOW_KEEP 0.45) ----------
{
  const l0 = { preset: 'exec', kpis: E.LAYOUTS.exec.kpis, filters: true, fpos: 'start', header: true, page: '1920x1080' }, pages = E.projectPages(l0, 'en', { second: true });
  const slicers = [{ t: 'S', c: 'A', type: 'string' }, { t: 'S', c: 'B', type: 'string' }, { t: 'S', c: 'C', type: 'string' }];
  const fo = Pbip.fitOptions({ lang: 'en', font: 'Segoe UI', theme: E.buildTheme({ layout: l0 }, 'en'), model: { byPath: 'M.SemanticModel' }, bind: { date: { t: 'D', c: 'Date', type: 'dateTime' }, slicers }, pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, grow: true })) });
  const before = pages[1].slots, f = E.fitSlots(before, fo[1]).slots, rail = f.find((s) => s.kind === 'slicer' && s.stack), B = rail.y + rail.h;
  const col = f.find((s) => s.kind === 'column'), col0 = before.find((s) => s.kind === 'column');
  chk(() => E.REFLOW_KEEP === 0.45, () => `T5a. REFLOW_KEEP 0.45 (SQ13's option (a), the owner's yes): ${E.REFLOW_KEEP}`);
  chk(() => col && col.y + col.h === B && col.h === 168, () => `T5b. the column chart beside the rail ends with it, 168 high: ${JSON.stringify(col)} (rail bottom ${B})`);
  const under = f.filter((s) => s !== rail && s.x < rail.x + rail.w && s.x + s.w > rail.x && s.y >= B);
  chk(() => under.length && Math.min(...under.map((s) => s.y)) - B === 18, () => `T5c. the rows under start one row gap under the rail: ${JSON.stringify(under.map((s) => [s.kind, s.y]))}`);
  chk(() => col0 && under.every((s) => { const o = before.find((q) => q.kind === s.kind && q.x <= s.x + 1 && q.y > s.y); return !o || (o.y + o.h === s.y + s.h); }), () => 'T5d. the rows under keep their bottoms (they grow by as much as they move up)');
}

if (problems.length) { console.log(`FAIL script=test-0.3.1-ts1.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  ts1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  ts1  ${checks} checks`);
