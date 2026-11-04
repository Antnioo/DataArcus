// 0.3.2 SP38 (the split, finish: B-280, B-286; mcp/work/SP38.md): the redesign's text restyling, moved out of
// lib/redesign.mjs as it was (behaviour identical: test-0.3.2-sp38.mjs). Pure: no file is read or written here.
// The interface:
//   textPlan(inv, files, themeRel, mode, rep) -> { out, patches, perVisual, problems }
//     in:  inv the report's inventory (read-report.mjs), files the report's relative paths, themeRel its custom theme
//          file (or null), mode consistentText ("report", "theme" or null), rep its definition/report.json as read by
//          the facade (or null when it can't be read)
//     out: out the plan's text block (mixed, and with a mode the set, the removals counted, kept, untouched, the
//          theme's sentence), patches the text's patch records (a visual's own setting removed: op "remove"; the
//          theme's visual styles; the added theme file: op "add"; report.json's additions), perVisual each visual's
//          removals (Map visual -> rows), problems the text's refusals
//   textWhy(page, visual, twice) -> why the visual's text is kept as it is (null: it is made consistent)
//   (why a visual is left as it is, KEEP, twiceOf and reasonOf, is the patch policy: lib/redesign-patches.mjs)
import { safeName, isCustom } from './read-report.mjs';
import { CLASSES, KNOWN_TYPES, visualText, countsOf, mixedOf, textSetOf, facesOf, boldItalicOf, shownValue, themeValue, rolesOf } from './text-format.mjs';
import { ADDED_THEME } from './redesign-kinds.mjs';
import { twiceOf, reasonOf } from './redesign-patches.mjs';
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : null);

// (0.3.1 CS1) why a visual's text is not made consistent (null: it is): the visuals the grid would place (its own
// reasons), on a page that is not a tooltip page, of a type whose text roles are known
export function textWhy(p, v, twice) {
  if (p.kind === 'Tooltip') return 'on a tooltip page: kept as it is';
  if (v.type === 'textbox') return 'a text box: its text runs are its author\'s, with their own fonts, kept as they are';
  const r = reasonOf(v, twice);
  if (r) return r.replace(/(kept where it is|keep their places|the group places it|never moved or changed)/, (m) => ({ 'kept where it is': 'its text kept as it is', 'keep their places': 'keep their text settings', 'the group places it': 'its text kept as it is', 'never moved or changed': 'never changed' })[m]);
  if (!KNOWN_TYPES.has(v.type)) return `a visual type DataArcus does not know the text roles of (${safeName(v.type)}): its text settings are kept as they are`;
  return null;
}

// (0.3.1 CS1) the consistent copy's text: the text set, the removals, what is kept and why; and, for every redesign,
// the classes that show more than one font or size (mixed)
export function textPlan(inv, files, themeRel, mode, rep) {
  const items = [], untouched = [];
  inv.pages.forEach((p) => { const twice = twiceOf(p); p.visuals.filter((v) => v.type !== 'group').forEach((v) => {
    const why = textWhy(p, v, twice);
    if (!why) items.push({ p, v, json: v.json });
    else untouched.push({ page: p.name, visual: safeName(v.id), type: isCustom(v.type) ? 'custom ' + safeName(v.type) : safeName(v.type), why });
  }); });
  const theme = themeRel ? inv.themeJson || {} : null, counts = countsOf(items, theme), mixed = mixedOf(counts), boldItalic = boldItalicOf(items);
  const out = { mixed: mixed.map((x) => x.said), ...(boldItalic ? { boldOrItalic: `${boldItalic} visual${boldItalic === 1 ? ' sets' : 's set'} bold or italic of ${boldItalic === 1 ? 'its' : 'their'} own` } : {}) };
  if (!mode) return { out, patches: [], perVisual: new Map(), problems: [] };
  const set = textSetOf(counts, mode, facesOf(items)), patches = [], perVisual = new Map(), kept = [], problems = [], removed = [];
  const said = (cls, prop) => { const x = set[cls] || {}; return shownValue(prop, prop === 'family' ? x.family : prop === 'size' ? x.size : null); };
  items.forEach(({ p, v }) => {
    const t = visualText(v.json), list = [];
    t.overrides.forEach((o) => {
      patches.push({ op: 'remove', page: p.id, visual: v.id, file: v.file, pointer: o.pointer, from: o.raw });
      const row = { class: o.cls, property: o.property, from: shownValue(o.prop, o.value), to: said(o.cls, o.prop) };
      list.push(row); removed.push(Object.assign({ page: p.name, visual: safeName(v.id) }, row));
    });
    t.kept.forEach((k) => kept.push({ page: p.name, visual: safeName(v.id), class: k.cls, property: k.property, why: k.why }));
    if (list.length) perVisual.set(v, list);
  });
  // (CS2) the theme: the set's font and size as visual styles, per listed type and role object ("*" preset), where
  // Desktop draws them (Microsoft's base theme sets titles there, DataArcus's themes every text size); a class whose set
  // is the theme's is not written; nothing else of a style entry changes (its colour stays)
  const want = new Map();   // type -> object -> { property: value }
  items.forEach(({ v }) => rolesOf(v.type).forEach((r) => { const x = set[r.cls]; if (!x) return;
    const props = Object.assign({}, x.face != null ? { [r.props.family]: x.face } : {}, x.size != null ? { [r.props.size]: x.size } : {});
    if (!Object.keys(props).length) return;
    const m = want.get(v.type) || new Map(); want.set(v.type, m); m.set(r.object, Object.assign(m.get(r.object) || {}, props)); }));
  const ptr = (t, o) => `/visualStyles/${t}/*/${o}`, styleSet = [];
  let themeSaid = 'not changed: the theme\'s own text settings govern every listed visual';
  if (want.size) {
    if (themeRel) {
      const vs = (obj(inv.themeJson) && obj(inv.themeJson.visualStyles)) || {};
      want.forEach((m, t) => m.forEach((props, o) => {
        const arr = ((obj(vs[t]) || {})['*'] || {})[o];
        if (arr === undefined) { patches.push({ file: themeRel, pointer: ptr(t, o), from: null, to: [props], create: true }); return; }
        if (!Array.isArray(arr)) { problems.push(`consistentText: the theme's visual style for ${safeName(t)} ${safeName(o)} is not a list, so the text set can't be written there: fix the theme file (or apply it again in Power BI Desktop), then plan again.`); return; }
        const i = arr.findIndex((e) => obj(e) && (e.$id === undefined || e.$id === 'default'));
        if (i < 0) { patches.push({ file: themeRel, pointer: `${ptr(t, o)}/${arr.length}`, from: null, to: props }); return; }
        Object.entries(props).forEach(([k, val]) => { if (arr[i][k] !== val) { patches.push({ file: themeRel, pointer: `${ptr(t, o)}/${i}/${k}`, from: arr[i][k] === undefined ? null : arr[i][k], to: val });
          if (arr[i][k] !== undefined) styleSet.push(`${t} ${o} ${k} ${typeof arr[i][k] === 'string' || typeof arr[i][k] === 'number' ? arr[i][k] : 'set'} -> ${val}`); } });
      }));
      themeSaid = `${themeRel.split('/').pop()}: the text set is written as its visual styles (per visual type: titles, axes, labels, table text), where Power BI Desktop draws them; its text classes, colours and everything else are copied as they are`;
    } else {
      const tcol = (rep && rep.themeCollection && typeof rep.themeCollection === 'object') ? rep.themeCollection : {};
      if (tcol.customTheme) problems.push('consistentText: the report\'s theme is one of Power BI\'s own (not a theme file in the report), so its text settings can\'t be written: in Power BI Desktop, View > Themes > Customize current theme > Apply (the theme becomes a file in the report), save, then plan again. Or use consistentText "theme".');
      else if (files.includes(`StaticResources/RegisteredResources/${ADDED_THEME}`)) problems.push(`consistentText: the report already holds a file ${ADDED_THEME} that is not its theme: rename it in the report's folder, then plan again.`);
      else {
        const rel = `StaticResources/RegisteredResources/${ADDED_THEME}`, pk = Array.isArray(rep && rep.resourcePackages) ? rep.resourcePackages : null, item = { name: ADDED_THEME, path: ADDED_THEME, type: 'CustomTheme' };
        const ver = (tcol.baseTheme && typeof tcol.baseTheme.reportVersionAtImport === 'string') ? tcol.baseTheme.reportVersionAtImport : '5.61';
        const visualStyles = {}; want.forEach((m, t) => { visualStyles[t] = { '*': Object.fromEntries([...m].map(([o, props]) => [o, [props]])) }; });
        patches.push({ op: 'add', file: rel, to: { name: ADDED_THEME, visualStyles } });   // (its name is its file's, as Desktop writes it: PBIR_THEME_FILE_NAME_MISMATCH)
        patches.push({ file: 'definition/report.json', pointer: '/themeCollection/customTheme', from: null, to: { name: ADDED_THEME, reportVersionAtImport: ver, type: 'RegisteredResources' }, create: true });
        const i = pk ? pk.findIndex((x) => x && x.type === 'RegisteredResources' && Array.isArray(x.items)) : -1;
        if (i >= 0) patches.push({ file: 'definition/report.json', pointer: `/resourcePackages/${i}/items/${pk[i].items.length}`, from: null, to: item });
        else if (pk) patches.push({ file: 'definition/report.json', pointer: `/resourcePackages/${pk.length}`, from: null, to: { name: 'RegisteredResources', type: 'RegisteredResources', items: [item] } });
        else patches.push({ file: 'definition/report.json', pointer: '/resourcePackages', from: null, to: [{ name: 'RegisteredResources', type: 'RegisteredResources', items: [item] }] });
        themeSaid = `the report has no theme file (only Power BI's base theme): the copy adds ${ADDED_THEME} with the text set alone, as visual styles per visual type (titles, axes, labels, table text), where Power BI Desktop draws them; no text class and no colour (colours and the rest stay the base theme's), and names it in report.json`;
      }
    }
  }
  // a theme's own visual style for a type wins over its text class: said; (CS2) its font and size are set to the text set
  const styles = []; items.forEach(({ v }) => rolesOf(v.type).forEach((r) => ['family', 'size'].forEach((prop) => { const tv = themeValue(theme, r.cls, prop, v.type, r.object, r.props); if (tv.style && !styles.includes(`${tv.style} ${r.props[prop]}`)) styles.push(`${tv.style} ${r.props[prop]}`); })));
  Object.assign(out, {
    mode, set: Object.entries(set).map(([cls, x]) => ({ class: cls, what: CLASSES[cls], font: shownValue('family', x.family), size: shownValue('size', x.size), ...(x.shownBy.family || x.shownBy.size ? { alreadyShownBy: x.shownBy } : {}) })),
    boldItalic: 'a theme\'s text class holds no bold or italic (Microsoft\'s theme schema): each visual\'s own bold and italic is removed, so the theme\'s default governs',
    theme: themeSaid, removed: removed.length, removedHow: 'each visual\'s removals are listed with its changes (pages[].changes[].text: class, property, from -> to)', ...(kept.length ? { kept } : {}), ...(untouched.length ? { untouched } : {}),
    ...(styles.length ? { themeStyles: `the theme sets these for a visual type itself, which governs over its text class: ${styles.map(safeName).join(', ')}${styleSet.length ? `; set to the text set: ${styleSet.map(safeName).join(', ')}` : '; kept as they are'}` } : {})
  });
  return { out, patches, perVisual, problems };
}
