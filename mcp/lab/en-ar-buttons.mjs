// 0.3.1 R1 (a real user's EN-AR copy, 23 Oct: its 4 language buttons drawn as empty white boxes in Desktop; the report
// had no page tabs, so the twin's own plain button was written, never proven in Desktop): a project for the laptop to see
// what Desktop draws. The made-up work orders model and its English report (mcp/test-models/service-orders: the case's
// shape, its white-panel theme, no page buttons), its EN-AR copy written through the tools (create_arabic_twin into
// "same": plan -> approve -> write) with the shipped button, then one more page in the copy, "Button variants": the
// language button in each variant below, «العربية» and "English", each under its label, each going to the Overview page:
//   V0  as 0.3.0 wrote it: no text colour, the container left to the theme (its white panel), the outline on, no colour
//   V1  shipped (0.3.1): the theme's text colour, the outline in that colour, the container's background, border and
//       shadow off
//   V2  V1 with the container left to the theme (the white panel, its border and shadow)
//   V3  V0 with the text colour only
//   V4  V1 with the text margins 0 (round 13: margins did nothing; checked again here)
//   V5  V1 at 36 high;  V6  V1 at 44 high;  V7  V0 at 44 high (is the height the cause?)
// Microsoft's validator runs on the copy. Nothing outside the folder given is touched.
//   node lab/en-ar-buttons.mjs <empty folder>      (from mcp/; prints the .pbip to open in Power BI Desktop)
import '../test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { serverClient } from '../test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const Lv = (v) => ({ expr: { Literal: { Value: v } } }), Ls = (t) => Lv("'" + String(t).replace(/'/g, "''") + "'"), solid = (c) => ({ solid: { color: Ls(c) } });
const off = { background: [{ properties: { show: Lv('false') } }], border: [{ properties: { show: Lv('false') } }], dropShadow: [{ properties: { show: Lv('false') } }] };

export async function writeButtons(out) {
  fs.mkdirSync(out, { recursive: true });
  if (fs.readdirSync(out).length) throw new Error(`${out} is not empty: give an empty folder`);
  const ROOT = fs.realpathSync.native(path.resolve(out));
  fs.cpSync(path.join(HERE, '../test-models/service-orders'), path.join(ROOT, 'case'), { recursive: true, filter: (f) => !/make-report\.mjs$/.test(f) });
  const s = await serverClient(ROOT, {});
  try {
    const p0 = await s.call('create_arabic_twin', { path: 'case/Service Orders.pbip', into: 'same' });
    if (p0.err) throw new Error(p0.t);
    let k = 0; const L = {}; p0.j.texts.filter((t) => t.text != null).forEach((t) => { L[t.id] = t.draftArabic || `نص ${++k}`; });
    Object.assign(L, { 'textbox:overview0001/ovTitle/0.0': 'أوامر العمل المفتوحة حسب القسم والحالة', 'textbox:overview0001/ovSubtitle/0.0': 'مفتوح: كل أمر لم يُنجز ولم يُفوتر. أيام الفتح: الأيام منذ تسجيله.',
      'textbox:detail000002/dtTitle/0.0': 'أوامر العمل المفتوحة: التفاصيل', 'textbox:detail000002/dtSubtitle/0.0': 'صف لكل أمر، الأقدم أولاً.', 'field:Work Orders.Avg days open': 'أيام الفتح', 'field:Work Orders.Avg Cost': 'التكلفة' });
    const p1 = await s.call('create_arabic_twin', { path: 'case/Service Orders.pbip', into: 'same', labels: L }), id = p1.j && p1.j.plan && p1.j.plan.planId;
    if (!id) throw new Error('no plan: ' + String(p1.t).slice(0, 300));
    await s.call('approve_plan', { planId: id });
    const w = await s.call('create_arabic_twin', { path: 'case/Service Orders.pbip', into: 'same', planId: id });
    if (w.err) throw new Error(w.t);
    const COPY = path.join(ROOT, 'case/Service Orders (EN-AR).Report'), PJ = path.join(COPY, 'definition/pages/pages.json'), pages = JSON.parse(fs.readFileSync(PJ, 'utf8'));
    // the shipped button, as written on the first Arabic page (its look, its font and size)
    const arFirst = pages.pageOrder[2], vdir = path.join(COPY, 'definition/pages', arFirst, 'visuals');
    const shipped = fs.readdirSync(vdir).map((n) => JSON.parse(fs.readFileSync(path.join(vdir, n, 'visual.json'), 'utf8'))).find((v) => v.visual && v.visual.visualType === 'actionButton');
    const def = (v, card) => v.visual.objects[card].find((e) => e.selector && e.selector.id === 'default').properties;
    const make = (variant, text, h) => {
      const b = JSON.parse(JSON.stringify(shipped)), o = b.visual.objects, vco = b.visual.visualContainerObjects, t = def(b, 'text');
      t.text = Ls(text);
      vco.visualLink = [{ properties: { show: Lv('true'), type: Ls('PageNavigation'), navigationSection: Ls(pages.pageOrder[0]) } }];
      const old = () => { delete t.fontColor; o.outline = [{ properties: { show: Lv('true') } }]; ['background', 'border', 'dropShadow'].forEach((x) => delete vco[x]); };
      if (variant === 'V0' || variant === 'V7') old();
      if (variant === 'V2') ['background', 'border', 'dropShadow'].forEach((x) => delete vco[x]);
      if (variant === 'V3') { const c = t.fontColor; old(); t.fontColor = c; }
      if (variant === 'V4') Object.assign(t, { leftMargin: Lv('0L'), rightMargin: Lv('0L'), topMargin: Lv('0L'), bottomMargin: Lv('0L') });
      b.position.height = h;
      return b;
    };
    const V = [['V0', '0.3.0: no text colour, container to the theme, outline on', 29], ['V1', 'shipped: text colour, outline colour, container off', 29], ['V2', 'V1, container to the theme', 29], ['V3', 'V0 + text colour only', 29],
      ['V4', 'V1, text margins 0', 29], ['V5', 'V1 at 36 high', 36], ['V6', 'V1 at 44 high', 44], ['V7', 'V0 at 44 high', 44]];
    const pid = crypto.createHash('sha256').update('r1 button variants').digest('hex').slice(0, 20), P = path.join(COPY, 'definition/pages', pid);
    fs.mkdirSync(path.join(P, 'visuals'), { recursive: true });
    fs.writeFileSync(path.join(P, 'page.json'), JSON.stringify({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: pid, displayName: 'Button variants', displayOption: 'FitToPage', width: 1280, height: 720 }, null, 2) + '\n');
    const put = (j) => { fs.mkdirSync(path.join(P, 'visuals', j.name), { recursive: true }); fs.writeFileSync(path.join(P, 'visuals', j.name, 'visual.json'), JSON.stringify(j, null, 2) + '\n'); };
    let z = 1000;
    V.forEach(([v, what, h], i) => {
      const y = 20 + i * 84;
      put({ $schema: shipped.$schema, name: 'label' + v, position: { x: 20, y, z: z++, height: 34, width: 560, tabOrder: z },
        visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: `${v}  ${what}`, textStyle: { fontFamily: 'Segoe UI', fontSize: '11pt' } }], horizontalTextAlignment: 'left' }] } }] }, visualContainerObjects: off } });
      [['ar', 'العربية', 620], ['en', 'English', 820]].forEach(([l, text, x]) => { const b = make(v, text, h); b.name = 'btn' + v + l; b.parentGroupName = undefined; b.position = { x, y, z: z++, height: h, width: shipped.position.width + (l === 'en' ? 14 : 0), tabOrder: z }; put(JSON.parse(JSON.stringify(b))); });
    });
    pages.pageOrder.push(pid); fs.writeFileSync(PJ, JSON.stringify(pages, null, 2) + '\n');
    const ck = await s.call('check_report', { path: 'case/Service Orders (EN-AR).pbip', checks: ['validator'] });
    return { pbip: path.join(ROOT, 'case/Service Orders (EN-AR).pbip'), original: path.join(ROOT, 'case/Service Orders.pbip'), variantsPage: pid, validator: ck.j ? ck.j.validator : ck.t };
  } finally { await s.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) { console.error('usage: node lab/en-ar-buttons.mjs <empty folder>'); process.exit(2); }
  writeButtons(out).then((r) => console.log(JSON.stringify(r, null, 2))).catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
}
