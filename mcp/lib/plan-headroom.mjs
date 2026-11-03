// (0.3.2 HR1, B-293) the plan answer's headroom. A bilingual plan with every option on answered past the one answer
// limit (40,328 characters on the large fixture), so capAnswer cut its flip cards. Before the cap has to cut, the plan's
// answer says once what it repeated (the owner's choice, 3 Nov: "Remove repeats"):
//   - flipCards: the back, when every card's is the same; the helper measures' names, when they follow the rule
//     (NAMES); a card whose names differ (a name the model already had took another number) keeps its own list
//   - gulfDates.candidates: once the person confirmed the date, that one and how many others there were (before it,
//     every candidate: they are the question's choices); each relationship by its other end only
//   - slots[].galleryWhy: said on gallery.slots for that page and title
// (0.3.2 HR2, B-295) the bilingual step before the Arabic texts (no plan id yet) answered 42,710 and capAnswer cut
// bilingual.notTranslated, the texts the person labels; past AIM it now says too:
//   - bilingual.notTranslated by its why: each why (and whyAr) once, its texts (each text and where) under it
//   - bilingual.terminology.sheet[].why: the why of a status that two rows or more share, once in whyByStatus
//   - forAuthoring[].position: when every one is its slot's (slots[], by role: x, y, w, h) and its tabOrder its z,
//     each { role, kind, z } and the rule once (forAuthoringPosition)
// Only an answer past AIM (95% of ANSWER_MAX) changes: every other answer stays byte for byte as it was. Answer only:
// the plan's data, its binding and the approval page read their own copies, never this one.
import { ANSWER_MAX, out } from './answer.mjs';

export const AIM = Math.floor(ANSWER_MAX * 0.95);
export const NAMES = 'Each card adds three measures on each page it is on: "<its measure> (flip front)", "(flip back)" and "(flip backdrop)", with " 2" after them on its second page, " 3" on a third; a card whose names differ lists its own (measures).';

const size = (o) => JSON.stringify(out(o)).length;
const ruleNames = (c) => { const m = /\[(.*)\]$/.exec(c.measure || ''); if (!m || !Array.isArray(c.pages)) return null;
  return c.pages.flatMap((p, i) => ['front', 'back', 'backdrop'].map((f) => `${m[1]} (flip ${f})${i ? ' ' + (i + 1) : ''}`)); };

function flipOnce(fc) {
  const cards = fc.cards || [], backs = cards.map((c) => JSON.stringify(c.back)), same = cards.length > 1 && backs.every((b) => b === backs[0]);
  const ruled = cards.map((c) => { const r = ruleNames(c); return !!r && JSON.stringify(c.measures) === JSON.stringify(r); });
  if (!same && !ruled.some(Boolean)) return fc;
  const o = {};
  Object.entries(fc).forEach(([k, v]) => {
    if (k !== 'cards') { o[k] = v; return; }
    o.cards = cards.map((c, i) => { const x = Object.assign({}, c); if (same) delete x.back; if (ruled[i]) delete x.measures; return x; });
    if (same) o.back = cards[0].back;
    if (ruled.some(Boolean)) o.measureNames = NAMES;
  });
  return o;
}

function datesOnce(g) {
  const list = g.candidates || [], mine = list.find((c) => c.status === 'confirmed');
  const to = (c) => Object.assign({}, c, { relationship: typeof c.relationship === 'string' && c.relationship.startsWith(`${c.field} -> `) ? `to ${c.relationship.slice(c.field.length + 4)}` : c.relationship });
  const o = {};
  Object.entries(g).forEach(([k, v]) => {
    if (k !== 'candidates') { o[k] = v; return; }
    o.candidates = (mine ? [mine] : list).map(to);
    if (mine && list.length > 1) o.otherCandidates = list.length - 1;
  });
  return o;
}

// insert `extra` right after key `after` (the answer keeps its order)
const withAfter = (o, after, fn, extra) => { const x = {}; Object.entries(o).forEach(([k, v]) => { x[k] = k === after ? fn(v) : v; if (k === after) Object.assign(x, extra); }); return x; };

function notTranslatedOnce(nt) {
  if (!nt.every((x) => x && typeof x === 'object' && typeof x.why === 'string')) return null;
  const groups = new Map();
  nt.forEach(({ why, whyAr, ...t }) => { const k = JSON.stringify([why, whyAr == null ? null : whyAr]); if (!groups.has(k)) groups.set(k, Object.assign({ why }, whyAr == null ? {} : { whyAr }, { texts: [] })); groups.get(k).texts.push(t); });
  return groups.size < nt.length ? [...groups.values()] : null;
}

function termsOnce(t) {
  const n = {}; t.sheet.forEach((r) => { if (r && typeof r.why === 'string') { const m = n[r.status] = n[r.status] || {}; m[r.why] = (m[r.why] || 0) + 1; } });
  const by = {}; Object.entries(n).forEach(([st, m]) => { const [w, k] = Object.entries(m).sort((a, b) => b[1] - a[1])[0]; if (k > 1) by[st] = w; });
  if (!Object.keys(by).length) return t;
  return withAfter(t, 'sheet', (sh) => sh.map((r) => { if (!r || by[r.status] !== r.why) return r; const { why, ...x } = r; return x; }), { whyByStatus: by });
}

const POS = ['x', 'y', 'z', 'width', 'height', 'tabOrder'];
function authoringOnce(a) {
  const slots = a.slots, roles = slots.map((s) => s && s.role);
  const ok = a.forAuthoring.length > 0 && a.forAuthoring.every((f) => { const p = f && f.position, i = roles.indexOf(f && f.role), sl = slots[i];
    return p && sl && roles.lastIndexOf(f.role) === i && sl.kind === f.kind && Object.keys(p).every((k) => POS.includes(k)) && p.z != null && p.tabOrder === p.z && p.x === sl.x && p.y === sl.y && p.width === sl.w && p.height === sl.h; });
  if (!ok) return a;
  return withAfter(a, 'forAuthoring', (fa) => fa.map(({ position, ...f }) => Object.assign(f, { z: position.z })), { forAuthoringPosition: 'Each visual\'s x, y, width and height are its slot\'s (slots, by role: x, y, w, h); its tab order is its z.' });
}

/** The plan's answer, with its repeats said once when it is past AIM; otherwise the same object. */
export function fitRepeats(a) {
  if (!a || typeof a !== 'object' || size(a) <= AIM) return a;
  const o = Object.assign({}, a);
  if (o.flipCards && Array.isArray(o.flipCards.cards)) o.flipCards = flipOnce(o.flipCards);
  if (o.gulfDates && Array.isArray(o.gulfDates.candidates)) o.gulfDates = datesOnce(o.gulfDates);
  if (o.bilingual && typeof o.bilingual === 'object') {
    const b = Object.assign({}, o.bilingual), g = Array.isArray(b.notTranslated) ? notTranslatedOnce(b.notTranslated) : null;
    if (g) b.notTranslated = g;
    if (b.terminology && Array.isArray(b.terminology.sheet)) b.terminology = termsOnce(b.terminology);
    o.bilingual = b;
  }
  if (o.gallery && Array.isArray(o.slots)) o.slots = o.slots.map((s) => { if (!s || s.galleryWhy == null) return s; const { galleryWhy, ...x } = s; return x; });
  return Array.isArray(o.forAuthoring) && Array.isArray(o.slots) ? authoringOnce(o) : o;
}
