// The Arabic twin: the PBIR visual helpers its steps share (a visual's box, type and literals, boxes that hold or overlap,
// new ids, a text's look, colours).
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import crypto from 'node:crypto';
import { isObj } from './twin-read.mjs';

// ---- what the Arabic texts need (rc.24, the laptop's proof of rc.23): buttons and table headers cut in the twin ----
export const num = (p) => (p && p.expr && p.expr.Literal ? parseFloat(p.expr.Literal.Value) : NaN);
export const posOf = (v) => (isObj(v) && isObj(v.position) && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(v.position[k])) ? v.position : null);
export const typeOf = (v) => (isObj(v) && isObj(v.visual) ? String(v.visual.visualType || '') : isObj(v) && isObj(v.visualGroup) ? 'group' : '');
export const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
export const litStr = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
export const Lv = (v) => ({ expr: { Literal: { Value: v } } }), Ls = (t) => Lv("'" + String(t).replace(/'/g, "''") + "'");
const linkOf = (v) => { const vco = isObj(v) && isObj(v.visual) && isObj(v.visual.visualContainerObjects) ? v.visual.visualContainerObjects : {}; return (Array.isArray(vco.visualLink) ? vco.visualLink : []).find((e) => isObj(e) && isObj(e.properties) && !e.selector) || null; };
export const isPageBtn = (v) => typeOf(v) === 'actionButton' && litStr((linkOf(v) || { properties: {} }).properties.type) === 'PageNavigation';
export const overlaps = (a, b) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
export const holdsBox = (a, b) => a.x <= b.x + 0.5 && a.x + a.width >= b.x + b.width - 0.5 && a.y <= b.y + 0.5 && a.y + a.height >= b.y + b.height - 0.5;
// a visual's box on the page (a grouped visual's position is relative to its group, groups inside groups too)
export const absBox = (visuals, v) => { const p = posOf(v); if (!p) return null; let x = p.x, y = p.y, g = v; for (let n = 0; g && g.parentGroupName != null && n < 20; n++) { g = visuals.find((u) => isObj(u) && u.name === g.parentGroupName); const q = g && posOf(g); if (!q) break; x += q.x; y += q.y; } return { x, y, width: p.width, height: p.height }; };
// new names: 20 hex digits of a hash of what they stand for, never one already taken (the same names at the plan and the write)
export function idMaker(taken) { const used = new Set([...taken].map((x) => String(x).toLowerCase())); return (seed) => { for (let k = 0; ; k++) { const id = crypto.createHash('sha256').update('dataarcus-en-ar\u0000' + seed + (k ? '\u0000' + k : '')).digest('hex').slice(0, 20); if (!used.has(id)) { used.add(id); return id; } } }; }
export const textLook = (v) => { const es = isObj(v) && isObj(v.visual) && isObj(v.visual.objects) && Array.isArray(v.visual.objects.text) ? v.visual.objects.text.filter((e) => isObj(e) && isObj(e.properties)) : [];
  const d = es.find((e) => isObj(e.selector) && e.selector.id === 'default') || es.find((e) => !e.selector) || { properties: {} };
  return { size: parseFloat(litStr(d.properties.fontSize)), font: litStr(d.properties.fontFamily), bold: litStr(d.properties.bold) === 'true' }; };

// The language button of a page: its look is the page's own page tab's (one not bold, the tabs' other pages), else a plain
// button; its text on one line by the measured rules (the larger of 0.45 em a character and the page button's letter by
// letter measure: report-rules.js, as check_report measures it), as high as the tab; the show switch of each card in its
// own entry with no selector, the look with selector default (mcp/docs/RULES-POWERBI.md). It goes where it covers no visual (a visual
// holding it whole, the header's band, is its panel): the tabs' group (else the top of the page), from its end, the right on
// an English page, the left on an Arabic page. On the phone (when the page has a phone layout): the tabs' row, as wide as
// the writer's phone tab rule (phoneTabWidth), from the same end. Returns { json, mobile, phone, why } or { json: null, why }
// (0.3.1 R1: a real user's report without page tabs drew its 4 language buttons as empty white boxes) the plain button
// sets what every button DataArcus writes sets (pbip-page.js: the tabs, Reset, Open and Close filters): its text colour,
// and its container's background, border and shadow off. Left unset, the text took Power BI's own button colour (a theme
// default: Microsoft's "Create custom report themes", structural colours) over the theme's white visual panel. The text
// is the theme's own text colour, at 4.5:1 against the page behind the button (else Power BI's dark or white text,
// whichever reads); the outline the same colour. No text margins: Desktop ignored them (round 13, DESKTOP-TESTS.md)
export const HEX = /^#[0-9a-f]{6}$/i, hexOf = (c) => (typeof c === 'string' && HEX.test(c) ? c : isObj(c) && isObj(c.solid) ? hexOf(typeof c.solid.color === 'string' ? c.solid.color : litStr(c.solid.color)) : null);
export const solid = (c) => ({ solid: { color: Lv("'" + c + "'") } });
