// 0.3.1 CS2 (the laptop's CS1 run in Desktop 2.159, 27 Oct: the copy is one text set but Desktop drew Power BI's default
// sizes; a hand report's titles lost their look; an older save's report refused): the text set is written as the theme's
// visual styles per visual type (where Microsoft's own base theme sets titles and where DataArcus's themes are proven to
// set sizes), never as text classes; a visual's own colour, background, alignment and wrap stay; a definition.pbir with
// no $schema is read by its version or refused with why. Written red first (e2236be). The plan: mcp/work/CS2.md.
//   T1  the lab, no theme file: the added theme holds visualStyles only (no textClasses), titles 14 and table text 10
//       for each listed type; the copy: Microsoft's validator 0 errors, no FORMAT_MIXED
//   T2  a report with its own theme: only role pointers of its visualStyles change; an entry's colour is kept
//   T3  colours kept: titles and table headers with their own colour, background, alignment and wrap: the same after
//   T4  the allowlist: a theme change outside the roles (a colour, a background) and a removed colour are refused
//   T5  definition.pbir with no $schema: version 4.0 read (said in the plan, the file copied as it is); 1.0 refused;
//       a report.json with no $schema refused with why
//   T6  themeValue reads the theme's visualStyles["*"]["*"] (as Microsoft's base theme sets titles)
//   node test-0.3.1-cs2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';
import { writeLab } from './lab/consistency-lab.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 500) : JSON.stringify(x.j).slice(0, 500));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2));
const diff = (a, b, at = '') => {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a === undefined && b && typeof b === 'object') return Object.keys(b).flatMap((k) => diff(undefined, b[k], at + '/' + k));
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) return [...new Set(Object.keys(a).concat(Object.keys(b)))].flatMap((k) => diff(a[k], b[k], at + '/' + k));
  return [at];
};
const P1 = 'a1b2c3d4e5f6a7b8c9d0', P2 = 'b2c3d4e5f6a7b8c9d0e1', MODEL = 'Gulf Retail.SemanticModel', FROM = 'Store Ops.pbip';
const vfile = (rep, pg, v) => path.join(rep, 'definition/pages', pg, 'visuals', v, 'visual.json');
const TYPES = ['card', 'slicer', 'clusteredColumnChart', 'lineChart', 'tableEx', 'pivotTable', 'clusteredBarChart', 'donutChart'];
const ROOTS = [];
const lab = async (opts) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-cs2-')); ROOTS.push(d); fs.rmSync(d, { recursive: true }); return writeLab(d, opts); };
// plan, click, write: the plan's answer and the write's
const run = async (s, args) => {
  const pl = await s.call('plan_layout', Object.assign({ path: MODEL, redesignFrom: FROM }, args));
  if (pl.err || !pl.j.plan) return { pl, w: null };
  await s.call('approve_plan', { planId: pl.j.plan.planId });
  return { pl, w: await s.call('create_report', Object.assign({ path: MODEL, redesignFrom: FROM, planId: pl.j.plan.planId }, args)) };
};
let lib = null, T = null;
try { lib = await import('./lib/redesign.mjs'); T = await import('./lib/text-format.mjs'); } catch (e) { lib = null; }
try {
  // ---------- T1: the lab, no theme file ----------
  {
    const L = await lab(), s = await serverClient(L.root, {});
    try {
      const { pl, w } = await run(s, { consistentText: 'report', keepPositions: true });
      chk(() => w && !w.err && w.j.written, () => `T1. the copy is written: ${w ? short(w) : short(pl)}`);
      const OUT = path.join(L.root, 'Store Ops redesigned.Report'), th = path.join(OUT, 'StaticResources/RegisteredResources/DataArcusText.json');
      const t = fs.existsSync(th) ? rd(th) : {}, vs = t.visualStyles || {};
      chk(() => Object.keys(t).join() === 'name,visualStyles' && t.name === 'DataArcusText.json', () => `T1. the added theme holds the text set as visual styles alone (no textClasses, no colours): ${Object.keys(t)}`);
      chk(() => JSON.stringify(Object.keys(vs).sort()) === JSON.stringify(TYPES.slice().sort()), () => `T1. a visual style for each listed type: ${Object.keys(vs)}`);
      chk(() => TYPES.every((ty) => vs[ty]['*'].title[0].fontSize === 14 && !('fontFamily' in vs[ty]['*'].title[0])), () => `T1. every type's title 14pt (the set's font is the theme's: none written): ${JSON.stringify(TYPES.map((ty) => ((vs[ty] || {})['*'] || {}).title))}`);
      chk(() => ['values', 'columnHeaders'].every((o) => vs.tableEx['*'][o][0].fontSize === 10 && vs.pivotTable['*'][o][0].fontSize === 10) && vs.pivotTable['*'].rowHeaders[0].fontSize === 10,
        () => `T1. table and matrix text 10pt, values, headers and row headers: ${JSON.stringify([vs.tableEx, vs.pivotTable])}`);
      chk(() => Object.values(vs).every((x) => Object.values(x['*']).every((arr) => Array.isArray(arr) && arr.length === 1 && Object.keys(arr[0]).every((p) => /^(fontFamily|fontSize|titleFontFamily|titleFontSize|textSize)$/.test(p)))),
        () => 'T1. only font and size properties, one entry each');
      chk(() => /visual styles/.test(pl.j.redesign.text.theme) && /DataArcusText\.json/.test(pl.j.redesign.text.theme), () => `T1. the plan says the text set is written as visual styles: ${pl.j.redesign.text.theme}`);
      const ck = await s.call('check_report', { path: 'Store Ops redesigned.pbip', checks: ['validator', 'theme'] });
      chk(() => !ck.err && ck.j.validator.errors === 0 && !(ck.j.counts.byRule || {}).FORMAT_MIXED, () => `T1. the copy: Microsoft's validator 0 errors (every theme property known), no FORMAT_MIXED: ${JSON.stringify(ck.j && [ck.j.validator, ck.j.counts])}`);
    } finally { await s.close(); }
  }

  // ---------- T2: a report with its own theme ----------
  {
    const L = await lab({ theme: true }), A = path.join(L.root, 'Store Ops.Report'), TR = 'StaticResources/RegisteredResources/store-ops-theme.json';
    const t0 = rd(path.join(A, TR)); t0.visualStyles = { card: { '*': { title: [{ fontColor: { solid: { color: '#7A1F5C' } }, fontSize: 9 }], labels: [{ color: { solid: { color: '#123456' } } }] } } }; wr(path.join(A, TR), t0);
    const s = await serverClient(L.root, {});
    try {
      const { pl, w } = await run(s, { consistentText: 'report', keepPositions: true });
      const B = path.join(L.root, 'Store Ops redesigned.Report'), t1 = fs.existsSync(path.join(B, TR)) ? rd(path.join(B, TR)) : {};
      const d = diff(t0, t1);
      chk(() => w && !w.err && d.length && lib && lib.THEME_STYLE_AT && d.every((p) => lib.THEME_STYLE_AT.test(p)), () => `T2. the report's theme: only role pointers of its visual styles: ${JSON.stringify(d)} ${w ? short(w) : short(pl)}`);
      chk(() => t1.visualStyles.card['*'].title[0].fontSize === 14 && t1.visualStyles.card['*'].title[0].fontColor.solid.color === '#7A1F5C' && t1.visualStyles.card['*'].labels[0].color.solid.color === '#123456',
        () => `T2. its card style: the title 14pt, its colour and the labels' colour kept: ${JSON.stringify(t1.visualStyles && t1.visualStyles.card)}`);
      chk(() => !d.some((p) => /^\/textClasses\//.test(p)) && !fs.existsSync(path.join(B, 'StaticResources/RegisteredResources/DataArcusText.json')), () => 'T2. no textClasses written, no theme file added');
      chk(() => (pl.j.redesign.text.themeStyles || '').includes('card') && /set to the text set/.test(pl.j.redesign.text.themeStyles || ''), () => `T2. the theme's own card style is said and set: ${pl.j.redesign.text.themeStyles}`);
    } finally { await s.close(); }
  }

  // ---------- T3: colours kept (a hand report's titles in their own colour, made up) ----------
  {
    const L = await lab(), A = path.join(L.root, 'Store Ops.Report');
    const L_ = (v) => ({ expr: { Literal: { Value: v } } }), C = (c) => ({ solid: { color: { expr: { Literal: { Value: `'${c}'` } } } } });
    const own = { fontColor: C('#FFFFFF'), alignment: L_("'center'"), titleWrap: L_('true'), background: C('#0B3D2E') };
    const f1 = vfile(A, P1, 'colBranch'), j1 = rd(f1); Object.assign(j1.visual.visualContainerObjects.title[0].properties, own);
    j1.visual.visualContainerObjects.background = [{ properties: { show: L_('true'), color: C('#0B3D2E') } }]; wr(f1, j1);
    const f2 = vfile(A, P1, 'tblProducts'), j2 = rd(f2); Object.assign(j2.visual.objects.columnHeaders[0].properties, { fontColor: C('#FFFFFF'), backColor: C('#0B3D2E'), alignment: L_("'Center'"), wordWrap: L_('true') }); wr(f2, j2);
    const f3 = vfile(A, P2, 'donutChannel'), j3 = rd(f3); Object.assign(j3.visual.visualContainerObjects.title[0].properties, { fontColor: C('#F2C14E') }); wr(f3, j3);
    const s = await serverClient(L.root, {});
    try {
      const { pl, w } = await run(s, { consistentText: 'report', keepPositions: true });
      const B = path.join(L.root, 'Store Ops redesigned.Report');
      const keep = (j, at) => JSON.stringify(Object.fromEntries(Object.entries(at(j)).filter(([k]) => !/^(fontFamily|fontSize|bold|italic)$/.test(k))));
      const tt = (j) => j.visual.visualContainerObjects.title[0].properties;
      chk(() => w && !w.err && keep(rd(vfile(B, P1, 'colBranch')), tt) === keep(j1, tt) && tt(rd(vfile(B, P1, 'colBranch'))).fontColor.solid.color.expr.Literal.Value === "'#FFFFFF'",
        () => `T3. the title's own colour, alignment, wrap and background stay: ${w ? JSON.stringify(fs.existsSync(B) ? tt(rd(vfile(B, P1, 'colBranch'))) : 'no copy') : short(pl)}`);
      chk(() => JSON.stringify(rd(vfile(B, P1, 'colBranch')).visual.visualContainerObjects.background) === JSON.stringify(j1.visual.visualContainerObjects.background), () => 'T3. the visual\'s own background stays');
      const ch = (j) => j.visual.objects.columnHeaders[0].properties;
      chk(() => keep(rd(vfile(B, P1, 'tblProducts')), ch) === keep(j2, ch) && !('fontSize' in ch(rd(vfile(B, P1, 'tblProducts')))), () => 'T3. the table headers\' own colour, fill, alignment and wrap stay; their size is removed');
      chk(() => tt(rd(vfile(B, P2, 'donutChannel'))).fontColor.solid.color.expr.Literal.Value === "'#F2C14E'" && !('fontSize' in tt(rd(vfile(B, P2, 'donutChannel')))), () => 'T3. a title with its own colour and size: the colour stays, the size goes to the set');
      const th = path.join(B, 'StaticResources/RegisteredResources/DataArcusText.json');
      chk(() => fs.existsSync(th) && !JSON.stringify(rd(th)).match(/color|textClasses/i), () => 'T3. the added theme names no colour and no text class (a text class written without its colour would take the base theme\'s colour away)');
    } finally { await s.close(); }
  }

  // ---------- T4: the allowlist ----------
  if (lib) {
    const V = 'definition/pages/p/visuals/v/visual.json', TH = 'StaticResources/RegisteredResources/a.json', B = (j) => Buffer.from(JSON.stringify(j, null, 2));
    const vis = { name: 'v', position: { x: 0, y: 0, width: 10, height: 10 }, visual: { visualType: 'card', visualContainerObjects: { title: [{ properties: { fontColor: { solid: { color: '#fff' } }, fontSize: { expr: { Literal: { Value: '11D' } } } } }] } } };
    const src = { [V]: B(vis), 'definition/report.json': B({ themeCollection: { customTheme: { name: 'a.json', type: 'RegisteredResources' } } }), [TH]: B({ name: 'a.json', visualStyles: { card: { '*': { title: [{ fontColor: { solid: { color: '#000' } } }] } } } }) };
    const refuse = (out, patches, re) => { try { lib.verifyCopy(src, out, patches); return false; } catch (e) { return re.test(e.message); } };
    const t = (f) => { const j = JSON.parse(src[TH].toString()); f(j); return B(j); };
    chk(() => refuse(Object.assign({}, src, { [TH]: t((j) => { j.visualStyles.card['*'].title[0].fontColor.solid.color = '#f00'; }) }), [{ file: TH, pointer: '/visualStyles/card/*/title/0/fontColor', to: { solid: { color: '#f00' } } }], /outside the allowlist/),
      () => 'T4. a theme colour in a visual style: outside the allowlist');
    chk(() => refuse(Object.assign({}, src, { [TH]: t((j) => { j.visualStyles.card['*'].title[0].show = false; }) }), [{ file: TH, pointer: '/visualStyles/card/*/title/0/show', to: false }], /outside the allowlist/),
      () => 'T4. a role object\'s other property (the title hidden): outside the allowlist');
    chk(() => refuse(Object.assign({}, src, { [TH]: t((j) => { j.visualStyles.card['*'].background = [{ show: false }]; }) }), [{ file: TH, pointer: '/visualStyles/card/*/background', to: [{ show: false }], create: true }], /outside the allowlist/),
      () => 'T4. a background in a visual style: outside the allowlist');
    chk(() => refuse(Object.assign({}, src, { [TH]: t((j) => { j.textClasses = { largeTitle: { fontSize: 14 } }; }) }), [{ file: TH, pointer: '/textClasses/largeTitle/fontSize', to: 14, create: true }], /outside the allowlist/),
      () => 'T4. a text class: outside the allowlist (nothing writes it now)');
    chk(() => { try { return lib.verifyCopy(src, Object.assign({}, src, { [TH]: t((j) => { j.visualStyles.card['*'].title[0].fontSize = 14; }) }), [{ file: TH, pointer: '/visualStyles/card/*/title/0/fontSize', to: 14 }]).onlyAllowlisted; } catch (e) { return false; } },
      () => 'T4. the title size in the card\'s visual style, planned: accepted');
    { const j = JSON.parse(src[V].toString()); delete j.visual.visualContainerObjects.title[0].properties.fontColor;
      chk(() => refuse(Object.assign({}, src, { [V]: B(j) }), [{ op: 'remove', file: V, pointer: '/visual/visualContainerObjects/title/0/properties/fontColor' }], /outside the allowlist/), () => 'T4. a visual\'s own title colour removed: refused'); }
  } else chk(() => false, () => 'T4. lib/redesign.mjs did not load');

  // ---------- T5: a definition file with no $schema (an older Desktop save) ----------
  {
    const L = await lab(), A = path.join(L.root, 'Store Ops.Report'), pbir = path.join(A, 'definition.pbir'), j = rd(pbir); delete j.$schema; wr(pbir, j);
    const before = fs.readFileSync(pbir);
    const s = await serverClient(L.root, {});
    try {
      const { pl, w } = await run(s, { consistentText: 'report', keepPositions: true });
      chk(() => !pl.err && pl.j.plan && w && !w.err && w.j.written, () => `T5. definition.pbir with no $schema, version 4.0: planned and written: ${w ? short(w) : short(pl)}`);
      chk(() => /definition\.pbir names no \$schema/.test(JSON.stringify(pl.j.redesign.schemaNotes || '')) && /4\.0/.test(JSON.stringify(pl.j.redesign.schemaNotes || '')), () => `T5. the plan says how it was read: ${JSON.stringify(pl.j && pl.j.redesign && pl.j.redesign.schemaNotes)}`);
      chk(() => fs.readFileSync(path.join(L.root, 'Store Ops redesigned.Report/definition.pbir')).equals(before), () => 'T5. its definition.pbir is copied as it is');
      j.version = '1.0'; wr(pbir, j); fs.rmSync(path.join(L.root, 'Store Ops redesigned.Report'), { recursive: true, force: true }); fs.rmSync(path.join(L.root, 'Store Ops redesigned.pbip'), { force: true });
      const p2 = await s.call('plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'report' });
      chk(() => !(p2.j && p2.j.plan && p2.j.plan.planId) && /definition\.pbir/.test(p2.t) && /1\.0/.test(p2.t) && /save/i.test(p2.t), () => `T5. version 1.0 with no $schema: no plan id, with why and the fix: ${short(p2)}`);
      j.version = '4.0'; j.$schema = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json'; wr(pbir, j);
      const rp = path.join(A, 'definition/report.json'), r = rd(rp); delete r.$schema; wr(rp, r);
      const p3 = await s.call('plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'report' });
      chk(() => !(p3.j && p3.j.plan && p3.j.plan.planId) && /report\.json names no \$schema/.test(p3.t) && /Desktop/.test(p3.t), () => `T5. report.json with no $schema: refused, with why and the fix: ${short(p3)}`);
    } finally { await s.close(); }
  }

  // ---------- T6: themeValue reads visualStyles["*"]["*"] ----------
  chk(() => T && T.themeValue({ visualStyles: { '*': { '*': { title: [{ fontSize: 15 }] } } } }, 'largeTitle', 'size', 'card', 'title', { size: 'fontSize' }).value === 15
    && T.themeValue({ visualStyles: { '*': { '*': { title: [{ fontSize: 15 }] } }, card: { '*': { title: [{ fontSize: 12 }] } } } }, 'largeTitle', 'size', 'card', 'title', { size: 'fontSize' }).value === 12,
  () => 'T6. a theme\'s "*" visual style counts as the theme\'s value (the type\'s own first)');
} catch (e) { checks++; problems.push('stopped: ' + String(e && e.stack || e).slice(0, 400)); }
finally { ROOTS.forEach((d) => fs.rmSync(d, { recursive: true, force: true })); }
if (problems.length) { console.log(`FAIL script=test-0.3.1-cs2.mjs cause=${problems[0].slice(0, 160)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  cs2  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  cs2  ${checks} checks`);
