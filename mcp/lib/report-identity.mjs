// LAYER reading (0.3.2 SP21, the split of read-report.mjs): an existing report's theme identity, as a design needs
// it. Pure: the inventory read-report.mjs read (the theme files' JSON as its one read boundary gave them: themeJson,
// baseJson, the pages and visuals) in, the identity out. It imports nothing and reads no file: read-report.mjs keeps
// reportIdentity (read, then identityOf) and existingTheme (which reports to read), and re-exports what is here.
// Text moved verbatim from read-report.mjs (behaviour identical: test-0.3.2-sp21.mjs).

// ---- an existing report's identity, as a design needs it (0.2.9, KEEP THE DASHBOARD'S IDENTITY: the owner's go, 12 Oct) ----
// A new report started from the plain Corporate preset whenever the chat named no colours, even when the model already
// had a designed report. The design block's default (lib/design.mjs) now starts from that report's own colours; this
// reading gives it the colours and three style settings, nothing else: hex colours only (#rgb or #rrggbb, checked; any
// other value is left out), never a model value, never a text.
// (the laptop's inventory of nine real dashboards, 12 Oct: only 4 had a full palette in their theme; 3 were 8-colour
// "Custom" stubs whose first 1-3 colours are their own and the rest the base theme's; on 5 the identity was in colours
// written on the visuals themselves.) So three sources, in this order: the custom theme's colours that differ from the
// report's base theme (read from the base theme file the report carries, never from a list of ours), then the colours
// written on its pages and visuals by how often, then nothing (the design's own default).
const hex6 = (c) => { const m = typeof c === 'string' ? /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim()) : null; return m ? '#' + (m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1]).toLowerCase() : null; };
const firstOf = (x) => (Array.isArray(x) && x[0] && typeof x[0] === 'object' ? x[0] : null);
const solidOf = (x) => { const e = firstOf(x); return e && e.color && e.color.solid ? hex6(e.color.solid.color) : null; };
// saturation and lightness of a hex colour (HSL)
const sl = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255), mx = Math.max(...v), mn = Math.min(...v), l = (mx + mn) / 2;
  return { s: mx === mn ? 0 : l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn), l }; };
// a colour that can lead a palette (coloured, neither near white nor near black), and a dark grey that reads as text
const isDataColour = (h) => { const { s, l } = sl(h); return s >= 0.25 && l >= 0.2 && l <= 0.8; };
const isTextColour = (h) => { const { s, l } = sl(h); return s < 0.25 && l < 0.35; };
// { name, dataColors (the theme's own, up to 8: those of the base theme left out when base is given), background (the
// page), card (the visuals, only when solid), cardTransparent (the visuals' transparency, %, when the theme makes them
// see-through: made for a page picture, never copied), border, text (foreground), accent (tableAccent), good, neutral,
// bad, radius, shadow, font } | null (a report with a base theme only). base: the base theme's JSON, when read.
export function reportTheme(inv, base) {
  const t = inv && inv.themeRef ? inv.themeJson : null;
  if (!t || typeof t !== 'object' || Array.isArray(t)) return null;
  const vs = t.visualStyles && typeof t.visualStyles === 'object' ? t.visualStyles : {};
  const at = (v) => { const o = vs[v] && vs[v]['*']; return o && typeof o === 'object' ? o : {}; };
  const b = base && typeof base === 'object' ? base : {}, inBase = new Set((Array.isArray(b.dataColors) ? b.dataColors : []).map(hex6).filter(Boolean));
  const own = (c, baseC) => { const h = hex6(c); return h && h !== hex6(baseC) ? h : null; };
  const vbg = firstOf(at('*').background), transp = vbg ? +vbg.transparency || 0 : 0, title = (t.textClasses && t.textClasses.title) || {}, font = typeof title.fontFace === 'string' ? title.fontFace.split(',')[0].replace(/'/g, '').trim() : null;
  const border = firstOf(at('*').border), shadow = firstOf(at('*').dropShadow);
  const out = { name: inv.theme.name, dataColors: (Array.isArray(t.dataColors) ? t.dataColors : []).map(hex6).filter((h) => h && !inBase.has(h)).slice(0, 8),
    background: solidOf(at('page').background), card: transp > 0 ? null : solidOf(at('*').background) || own(t.background, b.background), cardTransparent: transp > 0 ? transp : null,
    border: solidOf(at('*').border), text: own(t.foreground, b.foreground), accent: own(t.tableAccent, b.tableAccent),
    good: hex6(t.good) || hex6(t.maximum), neutral: hex6(t.neutral) || hex6(t.center), bad: hex6(t.bad) || hex6(t.minimum),
    radius: border && Number.isFinite(+border.radius) && +border.radius >= 0 && +border.radius <= 24 ? +border.radius : null, shadow: shadow && shadow.show === true ? true : null, font };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length)));
}
// the colours written on a report's pages and visuals (a fill, a data colour, a background, a border: a literal hex
// colour; a theme colour reference is the theme's), counted: [[hex, how often]], the most used first
export function paintedColours(inv) {
  const n = new Map();
  const walkC = (o, d) => {
    if (!o || typeof o !== 'object' || d > 40) return;
    if (Array.isArray(o)) { o.forEach((x) => walkC(x, d + 1)); return; }
    const lit = o.solid && o.solid.color && o.solid.color.expr && o.solid.color.expr.Literal;
    if (lit) { const h = hex6(String(lit.Value == null ? '' : lit.Value).replace(/'/g, '')); if (h) n.set(h, (n.get(h) || 0) + 1); }
    Object.values(o).forEach((v) => walkC(v, d + 1));
  };
  (inv.pages || []).forEach((p) => { walkC(p.raw && p.raw.objects, 0); (p.visuals || []).forEach((x) => walkC(x.json && (x.json.visual || x.json.visualGroup), 0)); });
  return [...n.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}
// a report's identity: { name (the theme's, or null), themeColours, painted (data colours written on it, by how often,
// neither the base's nor the theme's), text, ...reportTheme's other colours and styles } | null when it has none
// (SP21) of an inventory already read: read-report.mjs's reportIdentity reads it, then calls this
export function identityOf(inv) {
  const base = inv.baseJson || null;
  const th = reportTheme(inv, base) || {}, inBase = new Set(((base && Array.isArray(base.dataColors)) ? base.dataColors : []).map(hex6).filter(Boolean));
  const own = th.dataColors || [], counted = paintedColours(inv);
  const painted = counted.map(([h]) => h).filter((h) => isDataColour(h) && !inBase.has(h) && !own.includes(h)).slice(0, 8);
  const text = th.text || (counted.find(([h]) => isTextColour(h)) || [])[0] || null;
  const ours = ((inv.report || {}).annotations || []).some((x) => x && x.name === 'generatedBy' && /DataArcus/.test(String(x.value)));
  if (!own.length && !painted.length) return { ours, identity: null };
  const { dataColors, ...rest } = th;
  return { ours, identity: Object.assign({}, rest, { name: inv.themeRef ? th.name || inv.theme.name : null, themeColours: own, painted }, text ? { text } : {}) };
}
