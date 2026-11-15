// 0.3.2 PK1 (the owner D-1104-01; the scout's Decision 3; mcp/work/PK1.md): the redesign's patch kinds, one entry per
// kind of change. A redesign is a LOSSLESS COPY with allowlisted patches (J13, 19 Oct): this registry IS that allowlist.
// buildCopy and verifyCopy (redesign.mjs) read it and hold no pointer of their own, so a new kind of change is one
// entry here, never an edit of the copy or its check. Nothing here reads or writes a file (node:path only names one).
// An entry:
//   name      the kind's name; enabled: true is allowed in a copy today, false is a planned kind (the shape only)
//   changes   [{ file, pointers, check?, chosenAtWrite? }]: the file kind (FILES) and the JSON pointers it may change;
//             check(at) gives the reason a change is refused (null: it may), at = { rel, pointer, before, after,
//             json, src, out } (before: the original's value there, undefined when it is added); chosenAtWrite: the
//             pointers whose value the write chooses (the copy's logical id), so the plan's value is not compared
//   adds      [{ path, check? }]: the files it may add (path: a regex on the report-relative path); check(rel, json,
//             ctx) gives the reason an added file is refused (the text after the file's name), ctx = { src, out, allowed }
//   said      { en, ar }: the kind's plan sentence (what the person is told this kind changes)
// The copy check's order is unchanged: a changed file must be of a file kind an enabled kind changes; each changed
// pointer must be one an enabled kind names, pass that kind's check, be one of the plan's patches and hold its value.
import path from 'node:path';
import { TEXT_POINTER, THEME_STYLE_AT } from './text-format.mjs';
import { safeName } from './read-report.mjs';

export const TITLE_AT = (i) => `/visual/visualContainerObjects/title/${i}/properties/text/expr/Literal/Value`;
export const TOKENS = ['dataColors', 'foreground', 'background', 'tableAccent', 'good', 'neutral', 'bad'];
// (CS1) the theme file a consistent copy adds when the report has none, in the report's registered resources
export const ADDED_THEME = 'DataArcusText.json';
const RESOURCE = /^StaticResources\/RegisteredResources\/[^/]+\.json$/;

// ---- the file kinds, in the order a changed file is matched (ctx.themeRel: the report's custom theme file) ----
export const FILES = {
  visual: (rel) => /^definition\/pages\/[^/]+\/visuals\/[^/]+\/visual\.json$/.test(rel),
  platform: (rel) => rel === '.platform',
  theme: (rel, ctx) => !!(ctx && ctx.themeRel) && rel === ctx.themeRel,
  report: (rel) => rel === 'definition/report.json',
  // (planned kinds only: no enabled kind changes these, so a change to one stays "a file the allowlist never changes")
  mobile: (rel) => /^definition\/pages\/[^/]+\/visuals\/[^/]+\/mobile\.json$/.test(rel),
  pages: (rel) => rel === 'definition/pages/pages.json',
  reportExtensions: (rel) => rel === 'definition/reportExtensions.json'
};
const additionsOnly = (at) => (at.before !== undefined ? 'which was already in the original' : null);
// every value an added JSON holds, as pointers (an object or list: its members; anything else: itself)
// every leaf pointer of a value ("/a/b" for { a: { b: 1 } }), from at: the copy's check and the patches' reasons read it here (0.3.3 SG1)
export const leaves = (o, at = '') => (o && typeof o === 'object' ? Object.keys(o).flatMap((k) => leaves(o[k], at + '/' + k)) : [at]);

// ---- the kinds a redesign makes today ----
export const KINDS = [
  { name: 'grid', enabled: true,
    changes: [{ file: 'visual', pointers: [/^\/position\/(x|y|width|height)$/] }],
    said: { en: 'Top-level native visuals are placed on the grid: their place and size change, nothing else of them.',
      ar: 'توضع المرئيات الأصلية في المستوى الأعلى على الشبكة: يتغير موضعها وحجمها فقط، ولا شيء غير ذلك.' } },
  { name: 'titles', enabled: true,
    changes: [{ file: 'visual', pointers: [/^\/visual\/visualContainerObjects\/title\/\d+\/properties\/text\/expr\/Literal\/Value$/] }],
    said: { en: 'A static title the person approved is written on its visual; a title from a measure stays as it is.',
      ar: 'يُكتب العنوان الثابت الذي وافق عليه الشخص على المرئي الخاص به؛ ويبقى العنوان المأخوذ من مقياس كما هو.' } },
  { name: 'themeTokens', enabled: true,
    changes: [{ file: 'theme', pointers: [new RegExp(`^/(${TOKENS.join('|')})(/\\d+)?$`)] }],
    said: { en: 'The custom theme\'s colour tokens become the restyle\'s; everything else in the theme is copied as it is.',
      ar: 'تصبح رموز الألوان في السمة المخصصة ألوان إعادة التنسيق؛ وكل ما عدا ذلك في السمة يُنسخ كما هو.' } },
  { name: 'copyName', enabled: true,
    changes: [{ file: 'platform', pointers: [/^\/metadata\/displayName$/, /^\/config\/logicalId$/], chosenAtWrite: [/^\/config\/logicalId$/] }],
    said: { en: 'The copy gets its own name and a new id, so it is told apart from the original.',
      ar: 'تحصل النسخة على اسمها الخاص ومعرّف جديد، لتتميز عن التقرير الأصلي.' } },
  // (0.3.1 CS1) a visual's own text settings (removed: TEXT_POINTER, text-format.mjs's roles only), and report.json's
  // custom theme and its resource item (additions only); (CS2) the text set in the theme's visual styles, a role's font
  // and size per known type (THEME_STYLE_AT), no longer its text classes (Desktop 2.159 did not draw them: mcp/work/CS2.md)
  { name: 'consistentText', enabled: true,
    changes: [{ file: 'visual', pointers: [TEXT_POINTER] }, { file: 'theme', pointers: [THEME_STYLE_AT] },
      { file: 'report', pointers: [/^\/themeCollection\/customTheme\/(name|reportVersionAtImport|type)$/, /^\/resourcePackages\/\d+\/(name|type)$/, /^\/resourcePackages\/\d+\/items\/\d+\/(name|path|type)$/], check: additionsOnly }],
    // (CS2) an added theme holds its name and allowlisted theme pointers only (the text set's visual styles)
    adds: [{ path: RESOURCE, check: (rel, json, ctx) => { const off = leaves(json).filter((p) => p !== '/name' && !ctx.allowed('theme', p)); return off.length ? `adds ${safeName(off[0])}, outside the allowlist` : null; } }],
    said: { en: 'Each listed visual\'s own font settings are removed so the theme governs, and the text set is written in the theme (a theme file is added when the report has none).',
      ar: 'تُزال إعدادات الخط الخاصة بكل مرئي مدرج لتحكمه السمة، وتُكتب مجموعة النص في السمة (ويُضاف ملف سمة إذا لم يكن للتقرير ملف).' } }
];

// ---- the planned kinds (NOT enabled: their shape is proven by test-0.3.2-pk1.mjs, nothing of them is allowed) ----
// Each job that brings one turns it on here (enabled: true) with its own tests; nothing else of the copy changes.
const PHONE_W = 323;
export const PLANNED = [
  // RD4 seasonal skins (rd/0.3.2-seasonal-skins, section g): the page background, outspace, title and largeTitle
  // colours of the theme; "off" restores the theme's original bytes (a restore op, to be added with the kind)
  { name: 'season', enabled: false,
    changes: [{ file: 'theme', pointers: [/^\/visualStyles\/page\/\*\/(background|outspace)(\/\d+(\/[^/]+)*)?$/, /^\/textClasses\/(title|largeTitle)\/color$/] }],
    said: { en: 'The theme\'s page background and title colours become the season\'s skin; the original theme can be put back.',
      ar: 'تصبح خلفية الصفحة وألوان العناوين في السمة مظهر الموسم؛ ويمكن إعادة السمة الأصلية.' } },
  // RD6 phone layout (rd/0.3.2-phone-layout, section c): a mobile.json added beside a visual.json, on a page that has no
  // phone layout, holding $schema and a position only, inside the phone's width
  { name: 'phone', enabled: false,
    adds: [{ path: /^definition\/pages\/[^/]+\/visuals\/[^/]+\/mobile\.json$/, check: (rel, json, ctx) => {
      const dir = rel.replace(/mobile\.json$/, ''), page = rel.split('/').slice(0, 3).join('/') + '/';
      if (!((dir + 'visual.json') in ctx.src)) return 'adds a phone place for a visual that is not in the original';
      if (Object.keys(ctx.src).some((r) => r.startsWith(page) && /\/mobile\.json$/.test(r))) return 'adds a phone place on a page that has a phone layout already';
      const p = json && json.position, keys = Object.keys(json || {}).sort().join(','), pk = Object.keys(p || {}).sort().join(',');
      if (keys !== '$schema,position' || pk !== 'height,tabOrder,width,x,y,z') return 'adds more than a phone place ($schema and a position)';
      return p.x < 0 || p.width < 0 || p.x + p.width > PHONE_W ? `adds a phone place outside the phone's ${PHONE_W} width` : null; } }],
    said: { en: 'A phone layout is added to the pages that have none: each placed visual gets its phone place; nothing of the desktop layout changes.',
      ar: 'يُضاف تخطيط للهاتف إلى الصفحات التي ليس لها تخطيط: يحصل كل مرئي موضوع على مكانه في الهاتف؛ ولا يتغير شيء من تخطيط سطح المكتب.' } },
  // RD8 add a page (rd/0.3.2-add-page, "the design"): files under a new page id (case-insensitive, [\w-]+), appends
  // to the page order, the registered resources and the report's measures; nothing of the original changes
  { name: 'page', enabled: false,
    changes: [{ file: 'pages', pointers: [/^\/pageOrder\/\d+$/], check: additionsOnly },
      { file: 'report', pointers: [/^\/resourcePackages\/\d+\/items\/\d+(\/[^/]+)*$/], check: additionsOnly },
      { file: 'reportExtensions', pointers: [/^\/entities\/\d+\/measures\/\d+(\/[^/]+)*$/], check: additionsOnly }],
    adds: [{ path: /^definition\/pages\/[\w-]+\/(page\.json|visuals\/[\w-]+\/visual\.json)$/, check: (rel, json, ctx) => {
      const id = rel.split('/')[2].toLowerCase();
      return Object.keys(ctx.src).some((r) => /^definition\/pages\/[^/]+\//.test(r) && r.split('/')[2].toLowerCase() === id) ? 'adds a file to a page of the original' : null; } }],
    said: { en: 'A new page is added to the copy and named in the page order; no page of the original changes.',
      ar: 'تُضاف صفحة جديدة إلى النسخة وتُذكر في ترتيب الصفحات؛ ولا تتغير أي صفحة من الأصل.' } },
  // B-304 tidy (rd/0.3.2-ideas, rd1/b304, way B): the grid's pointers, and a group moved as one (its x and y only; its
  // children byte-identical, checked by the copy as every other file)
  { name: 'tidy', enabled: false,
    changes: [{ file: 'visual', pointers: [/^\/position\/(x|y|width|height)$/], check: (at) => (at.json && at.json.visualGroup && !/\/(x|y)$/.test(at.pointer) ? 'a group\'s size, which tidy never changes' : null) }],
    said: { en: 'Visuals are aligned and evenly spaced where they are; a group moves as one and keeps its size.',
      ar: 'تُحاذى المرئيات وتُوزع بمسافات متساوية في أماكنها؛ وتتحرك المجموعة كوحدة واحدة وتحتفظ بحجمها.' } }
];

// what an entry must hold (the enabled and the planned ones alike); [] when it is whole
export function shapeProblems(k) {
  const out = [], re = (x) => x instanceof RegExp, fn = (x) => x === undefined || typeof x === 'function';
  if (!k || typeof k.name !== 'string' || !k.name) out.push('no name');
  if (typeof (k && k.enabled) !== 'boolean') out.push('enabled is not true or false');
  const ch = (k && k.changes) || [], ad = (k && k.adds) || [];
  if (!Array.isArray(ch) || !Array.isArray(ad) || !(ch.length + ad.length)) out.push('it neither changes nor adds a file');
  (Array.isArray(ch) ? ch : []).forEach((c, i) => {
    if (!c || !(c.file in FILES)) out.push(`changes[${i}] names no known file kind`);
    if (!c || !Array.isArray(c.pointers) || !c.pointers.length || !c.pointers.every(re)) out.push(`changes[${i}] has no pointers`);
    if (!c || !fn(c.check)) out.push(`changes[${i}].check is not a function`);
    if (c && c.chosenAtWrite !== undefined && !(Array.isArray(c.chosenAtWrite) && c.chosenAtWrite.every(re))) out.push(`changes[${i}].chosenAtWrite is not a list of pointers`);
  });
  (Array.isArray(ad) ? ad : []).forEach((a, i) => { if (!a || !re(a.path)) out.push(`adds[${i}] has no path`); if (!a || !fn(a.check)) out.push(`adds[${i}].check is not a function`); });
  const said = (k && k.said) || {};
  if (typeof said.en !== 'string' || !said.en || typeof said.ar !== 'string' || !said.ar) out.push('no plan sentence in English and Arabic');
  return out;
}
const bad = KINDS.concat(PLANNED).map((k) => [k.name, shapeProblems(k)]).filter(([, p]) => p.length);
if (bad.length) throw new Error(`redesign-kinds.mjs: the kind ${bad[0][0]} is not whole: ${bad[0][1][0]}`);

// ---- what the copy reads: only the enabled kinds ----
const ON = KINDS.filter((k) => k.enabled === true);
const CHANGES = ON.flatMap((k) => (k.changes || []).map((c) => Object.assign({ kind: k.name }, c)));
const ADDS = ON.flatMap((k) => (k.adds || []).map((a) => Object.assign({ kind: k.name }, a)));
// the allowlist, by file kind (the union of the enabled kinds' pointers, in the kinds' order)
export const ALLOW = Object.freeze(Object.fromEntries(Object.keys(FILES).map((f) => [f, CHANGES.filter((c) => c.file === f).flatMap((c) => c.pointers)]).filter(([, l]) => l.length)));
// the file kind of a changed file (null: no enabled kind changes it)
export const fileKindOf = (rel, ctx) => Object.keys(ALLOW).find((f) => FILES[f](rel, ctx)) || null;
export const allowed = (file, ptr) => !!file && (ALLOW[file] || []).some((re) => re.test(ptr));
// the enabled kinds' rules for one changed pointer: its reason to refuse (null: none)
export function changeRefused(file, at) {
  for (const c of CHANGES) if (c.file === file && c.check && c.pointers.some((re) => re.test(at.pointer))) { const why = c.check(at); if (why) return why; }
  return null;
}
// a value the write chooses (the copy's logical id): by pointer, as the copy has always done
export const chosenAtWrite = (ptr) => CHANGES.some((c) => (c.chosenAtWrite || []).some((re) => re.test(ptr)));
// the rule for an added file (null: no enabled kind adds it)
export const addRuleOf = (rel) => ADDS.find((a) => a.path.test(rel)) || null;
export function addRefused(rel, json, ctx) { const a = addRuleOf(rel); if (!a) return `adds ${safeName(leaves(json)[0] || '/')}, outside the allowlist`; return a.check ? a.check(rel, json, Object.assign({ allowed }, ctx)) : null; }
// the report's theme file, for the "theme" file kind: the one given, else the one the copy adds, else report.json's
// custom theme (read from the original's bytes)
export function themeFileOf(src, adds, themeRel) {
  if (themeRel) return themeRel;
  if (adds.length) return adds[0];
  try { const b = Buffer.from(src['definition/report.json']), t = (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? b.subarray(3) : b).toString('utf8');
    const ct = (JSON.parse(t).themeCollection || {}).customTheme; return ct && ct.name ? `StaticResources/RegisteredResources/${path.basename(String(ct.name))}` : null; } catch (e) { return null; }
}
// a kind's plan sentence (an enabled kind only; null otherwise)
export const sentenceOf = (name, lang) => { const k = ON.find((x) => x.name === name); return k ? k.said[lang === 'ar' ? 'ar' : 'en'] : null; };
