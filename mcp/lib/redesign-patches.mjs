// 0.3.2 SP38 (the split, finish: B-280, B-286; mcp/work/SP38.md): the redesign's allowlisted patches, moved out of
// lib/redesign.mjs as they were (behaviour identical: test-0.3.2-sp38.mjs). Each patch record keeps its exact JSON
// pointer, its value before (from) and after (to); its reason is its kind's, read from lib/redesign-kinds.mjs (the
// allowlist: kindOfPatch). Pure: no file is read or written here. The copy (buildCopy) and its check (verifyCopy) stay in
// lib/redesign.mjs and never call this file: the check is independent of the patches it checks.
// The interface (p: an inventory page, v: one of its visuals, as read-report.mjs reads them):
//   placePatches(p, v, from, to) -> the visual's place and size records (/position/x, y, width, height), for each side
//     of the box that moves by half a unit or more (from, to: { x, y, w, h })
//   titlePatch(p, v, key, text, why) -> { patch, title } (a static title written), { problem } (refused) or {} (the
//     same title); why: reasonOf(v) (a visual the grid keeps may still get a title when KEEP names its type)
//   tokenPatches(restyle, themeRel, themeJson) -> { theme, patches, problems }: the theme's colour tokens the restyle
//     changes (themeRel: the report's custom theme file, or null: refused)
//   namePatches(files, name) -> the copy's own name and id in its .platform ([] when it has none)
//   kindOfPatch(x, themeRel) -> { kind, reason } the enabled kind that allows the record (reason: its plan sentence), or
//     null when none does
//   KEEP, twiceOf(page), reasonOf(visual, twice), schemaOf(json): why a visual is left as it is (the grid, the titles
//     and the text read them)
import { safeName, isCustom, INSTRUCTION, LONG_TEXT } from './read-report.mjs';
import { buildTheme, themeDesign } from './design.mjs';
import * as Kinds from './redesign-kinds.mjs';
import { TITLE_AT, TOKENS } from './redesign-kinds.mjs';
export const schemaOf = (j) => { const m = /\/([A-Za-z]+)\/(\d+)\.\d+\.\d+\/schema(?:[.-]embedded)?\.json$/.exec(String((j && j.$schema) || '')); return m ? { family: m[1], major: +m[2] } : null; };

// what a redesign never moves, with why
export const KEEP = {
  textbox: 'a text box: kept where it is (the header and the lines drawn around it belong together)',
  shape: 'a shape: kept where it is (it frames or underlines other visuals)', basicShape: 'a shape: kept where it is (it frames or underlines other visuals)',
  image: 'an image: kept where it is', actionButton: 'a button: kept where it is, with its action (page or bookmark)',
  pageNavigator: 'the page navigator: kept where it is', bookmarkNavigator: 'a bookmark navigator: kept where it is'
};

export const twiceOf = (p) => { const names = p.visuals.map((v) => v.id); return new Set(names.filter((n, i) => names.indexOf(n) !== i)); };
export function reasonOf(v, twice) {
  if (twice.has(v.id)) return 'its name is used twice on the page, so a patch could not name it';
  if (v.type === 'group') return 'a group: it and its visuals keep their places (the group places them)';
  if (v.group) return `inside the group ${safeName(v.groupName || v.group)}: the group places it`;
  if (isCustom(v.type)) return 'a custom visual: copied as it is, never moved or changed';
  if (KEEP[v.type]) return KEEP[v.type];
  if (v.hidden) return 'hidden in the original (shown by a bookmark or a button): kept where it is';
  if (!schemaOf(v.json) || schemaOf(v.json).family !== 'visualContainer') return 'its file names no visual schema';
  return null;
}
// ---- the grid: a top-level visual's own position (its place is on the page) ----
const SIDES = [['x', 'x'], ['y', 'y'], ['w', 'width'], ['h', 'height']];
export function placePatches(p, v, from, to) {
  const pos = v.json.position || {};
  return SIDES.filter(([k]) => Math.abs(to[k] - from[k]) >= 0.5).map(([k, f]) => ({ page: p.id, visual: v.id, file: v.file, pointer: '/position/' + f, from: pos[f], to: to[k] }));
}

// ---- a static title the person approved ----
export function titlePatch(p, v, key, text, why) {
  const t = String(text), arr = ((v.json.visual || {}).visualContainerObjects || {}).title, i = Array.isArray(arr) ? arr.findIndex((e) => e && e.properties && e.properties.text && e.properties.text.expr && e.properties.text.expr.Literal && !e.selector) : -1;
  if (why && !KEEP[v.type]) return { problem: `titles: ${safeName(key)} is not changed (${why}); leave it out of titles.` };
  if (i < 0) return { problem: `titles: ${safeName(key)} has no static title of its own (a title from a measure, or none): only a static title is changed; leave it out of titles.` };
  if (INSTRUCTION.test(t)) return { problem: `titles: the text for ${safeName(key)} reads like an instruction to an AI assistant: not written.` };
  if (!t.trim() || t.length > LONG_TEXT || /[\p{Cc}\p{Cf}]/u.test(t)) return { problem: `titles: the text for ${safeName(key)} must be 1 to ${LONG_TEXT} characters, with no control characters.` };
  const old = String(arr[i].properties.text.expr.Literal.Value), to = `'${t.replace(/'/g, "''")}'`;
  return old !== to ? { patch: { page: p.id, visual: v.id, file: v.file, pointer: TITLE_AT(i), from: old, to }, title: t } : {};
}

// ---- the theme's tokens, from the design engine, only when a restyle is asked ----
export function tokenPatches(restyle, themeRel, themeJson) {
  if (!themeRel) return { theme: null, patches: [], problems: ['restyle: the original has no custom theme file (only Power BI\'s base theme), so there are no theme tokens to change: leave restyle out.'] };
  const td = themeDesign(Object.assign({}, restyle, { pageTint: false })), problems = td.repaired.map((x) => `restyle.${x.field}: ${x.why}.`), patches = [];
  const built = buildTheme(td.design, 'en'), th = themeJson || {}, tokens = {};
  TOKENS.forEach((k) => { if (built[k] !== undefined && JSON.stringify(built[k]).toLowerCase() !== JSON.stringify(th[k] === undefined ? null : th[k]).toLowerCase()) { tokens[k] = built[k]; patches.push({ file: themeRel, pointer: '/' + k, from: th[k] === undefined ? null : th[k], to: built[k] }); } });
  return { theme: { file: themeRel.split('/').pop(), tokens, keeps: 'everything else in the theme file (fonts, visual styles, text classes) is copied as it is' }, patches, problems };
}

// ---- the copy's own name and id: .platform names the report, and its logical id is the item's id in a workspace ----
export const namePatches = (files, name) => (files.includes('.platform') ? [{ file: '.platform', pointer: '/metadata/displayName', from: null, to: name }, { file: '.platform', pointer: '/config/logicalId', from: null, to: 'a new id' }] : []);

// ---- each record's reason: the enabled kind (lib/redesign-kinds.mjs) whose file and pointers cover it ----
// (a value set where there was none, an object or a list, is covered pointer by pointer, as the copy's check reads it:
// redesign-kinds.mjs leaves, its one place since 0.3.3 SG1)
export function kindOfPatch(x, themeRel) {
  const named = (kind) => (kind ? { kind, reason: Kinds.sentenceOf(kind, 'en') } : null), ctx = { themeRel };
  if (x.op === 'add') { const a = Kinds.addRuleOf(x.file); return named(a && a.kind); }
  const covers = (at) => Kinds.KINDS.find((kd) => kd.enabled === true && at.every((ptr) => (kd.changes || []).some((c) => Kinds.FILES[c.file](x.file, ctx) && c.pointers.some((re) => re.test(ptr)))));
  const k = covers([x.pointer]) || (x.op !== 'remove' && x.to && typeof x.to === 'object' ? covers(Kinds.leaves(x.to, x.pointer)) : null);
  return named(k && k.name);
}
