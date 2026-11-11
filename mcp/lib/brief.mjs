// 0.3.3 OX1 (the owner, 11 Nov, D-1111-15; mcp/work/OX1.md): the brief check, stage 1. The person's questions as a
// report's acceptance test, from the files only. (0.3.3 OX2: check_report's section briefCheck reads it; a question
// answered by a visual grouped by its columns and more is "answered", worded SPLIT_FURTHER, the owner's D-1111-16.)
//   visualsOf(model, report)             each visual's numbers (measures, columns it sums) and groups (columns, levels)
//   checkVisuals(model, report)          each (number, group) pair of each visual: can the group move the number?
//   checkBrief(model, report, questions) each question { id, measure, by: [{ table, column }] }: can this model answer
//                                        it, and which visual does
// model: the TMSL JSON a model.bim holds (loadModel's tmsl); report: { files: [{ path, json }] } (lineage.mjs's shape).
// THE RULE (a pair's verdict). A filter on the group's table travels a relationship from its one side to its many
// side, both ways when the relationship says so (lineage.mjs's rule; the model's graph is lineage's modelGraph, never
// a copy). The number reads the tables under it: its DAX's, those of the measures it calls, a summed column's table.
//   moves         the group's table is one the number reads, or a filter on it reaches one
//   one value     it reaches none: every row of the group shows the same number (the forum's "same value on every row")
//   constant      the number reads no table of the model: one value on any group is what it means; never a finding
//   cannot tell   a field parameter's or a calculation group's column, a report measure whose definition was not read
//                 (0.3.3 OX2: a report measure is judged through lineage's own node, reportMeasures)
// IN DOUBT, NO FINDING: USERELATIONSHIP or CROSSFILTER anywhere under the number makes every relationship a path both
// ways, active or not; a name the model lacks is said as "not in the model", never judged. Not measured in Desktop
// yet (NOT_PROVED says so): a later stage measures the rule on a made-up model before any public word.
// Never a value: names (through safeName) and words; a question's text never enters (its id does). Pure: nothing is
// read or written here.
import { createRequire } from 'node:module';
import { modelGraph, reportMeasures } from './lineage.mjs';
import { questionOf } from './same-question.mjs';
import { safeName } from './read-report.mjs';

const require = createRequire(import.meta.url);
const { K } = require('../../assets/js/model-index.js');

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
const lc = (s) => String(s == null ? '' : s).toLowerCase();
// at most this many findings, pairs and visuals listed (the rest counted): the share a tool's answer can give them
export const LISTED_MAX = 60;
export const VERDICTS = ['moves', 'one value', 'constant', 'cannot tell'];
// (0.3.3 OX2, D-1111-16) the words for a visual grouped by the question's columns and more: answered, never "partly"
export const SPLIT_FURTHER = 'answers it, split further';
export const PROVES = 'From the files only: for each visual, whether a filter on each column it groups by can reach a table each number it shows reads (through the model\'s relationships, by their direction, or because the number\'s DAX names that table). "One value" means it cannot: every row of that column shows the same number.';
export const NOT_PROVED = 'It runs no query and reads no data, so it does not say a number is right. The rule is not yet measured in Power BI Desktop. A field parameter, a calculation group and a report measure whose definition was not read are not judged (cannot tell); a measure with USERELATIONSHIP or CROSSFILTER is never called one value. Whether a question\'s measure and columns are the ones the person meant is theirs to confirm.';

// ---- a field of a visual (same-question.mjs's fieldOf key) -> what it is in the model ----
// number: { key (the graph's node, null for a report measure), label, report }; group: { table, column, label }
function readField(f, G) {
  const k = String(f.k || ''), m = /^(rm|m|col|level) (\[.*\])$/.exec(k), agg = !m && /^[A-Za-z0-9]+\((col \[.*\])\)$/.exec(k);
  let parts = null; try { parts = JSON.parse(m ? m[2] : agg ? agg[1].slice(4) : 'null'); } catch (e) { parts = null; }
  if (!Array.isArray(parts)) return null;   // a visual calculation or an expression: built on the visual's other fields
  const [t, n, lvl] = parts.map(String), table = G.IX.tables.get(lc(t));
  // (0.3.3 OX2) a report measure: lineage's own node (reportMeasures), judged by what its DAX reads; unread: cannot tell
  if (m && m[1] === 'rm') return { number: { key: G.nodes.has('x:' + lc(n)) ? 'x:' + lc(n) : null, label: f.l, report: !G.nodes.has('x:' + lc(n)) } };
  if (m && m[1] === 'm') return { number: { key: G.nodes.has(K.m(n)) ? K.m(n) : null, label: f.l, missing: !G.nodes.has(K.m(n)) } };
  if (agg) return { number: { key: G.nodes.has(K.c(t, n)) ? K.c(t, n) : null, label: f.l, missing: !G.nodes.has(K.c(t, n)), missingLabel: `${safeName(t)}[${safeName(n)}]` } };
  if (m[1] === 'level') {
    const h = table && arr(table.hierarchies).find((x) => lc(x.name) === lc(n)), level = h && arr(h.levels).find((l) => lc(l.name) === lc(lvl));
    const column = level ? level.column : lvl;
    return { group: { table: lc(t), column: lc(column), label: f.l, missing: !table } };
  }
  return { group: { table: lc(t), column: lc(n), label: f.l, missing: !G.nodes.has(K.c(t, n)) } };
}

// the model's graph with the report's own measures in it (lineage's reportMeasures)
const graphOf = (model, report) => { const G = modelGraph(model); reportMeasures(G, filesOf(report)); return G; };
const filesOf = (report) => arr(isObj(report) ? report.files : null).filter((f) => f && typeof f.path === 'string' && isObj(f.json));
function readVisuals(G, report) {
  const files = filesOf(report), out = [];
  files.forEach((f) => {
    const vm = /(^|\/)pages\/([^/]+)\/visuals\/([^/]+)\/visual\.json$/.exec(f.path); if (!vm) return;
    const q = questionOf(f.json), v = { page: safeName(vm[2]), visual: safeName(vm[3]), id: vm[2] + '/' + vm[3], type: q ? q.type : safeName(String((isObj(f.json.visual) && f.json.visual.visualType) || 'unknown')), numbers: [], groups: [] };
    const seen = new Set();
    Object.values(q ? q.roles : {}).flat().forEach((fl) => {
      if (seen.has(fl.k)) return; seen.add(fl.k);
      const r = readField(fl, G); if (!r) return;
      if (r.number) v.numbers.push(r.number); else v.groups.push(r.group);
    });
    out.push(v);
  });
  return out;
}

// ---- the tables a number reads: everything under its node; turns: a text that can switch a relationship ----
function readsOf(G, key, cache) {
  if (cache.has(key)) return cache.get(key);
  const tables = new Set(), seen = new Set([key]), stack = [key]; let turns = false;
  while (stack.length) {
    const k = stack.pop(), n = G.nodes.get(k); if (!n) continue;
    if (n.turns) turns = true;
    if (k.startsWith('t:')) tables.add(k.slice(2)); else if (k.startsWith('c:')) tables.add(k.slice(2).split('|')[0]);
    n.deps.forEach((d) => { if (!seen.has(d)) { seen.add(d); stack.push(d); } });
  }
  const res = { tables, turns }; cache.set(key, res); return res;
}
// the tables a filter on `table` reaches (itself too); every: each relationship both ways, active or not
function reachOf(G, table, every, cache) {
  const ck = table + (every ? '|every' : ''); if (cache.has(ck)) return cache.get(ck);
  const seen = new Set([table]), stack = [table];
  while (stack.length) {
    const n = stack.pop();
    G.relationships.forEach((r) => {
      if (!every && !r.active) return;
      if (r.to === n && !seen.has(r.from)) { seen.add(r.from); stack.push(r.from); }
      if ((every || r.both) && r.from === n && !seen.has(r.to)) { seen.add(r.to); stack.push(r.to); }
    });
  }
  cache.set(ck, seen); return seen;
}
const tableName = (G, t) => { const x = G.IX.tables.get(t); return safeName(x ? x.name : t); };
// a field parameter (a calculated table of NAMEOF) or a calculation group: its column switches what is shown
const switches = (G, t) => { const x = G.IX.tables.get(t); return !!x && (!!x.calcGroup || /\bNAMEOF\s*\(/i.test(String(x.calcExpr || ''))); };

function verdictOf(G, number, group, C) {
  if (number.report || !number.key || switches(G, group.table)) return { verdict: 'cannot tell' };
  const reads = readsOf(G, number.key, C.reads);
  if (!reads.tables.size) return { verdict: 'constant' };
  const reach = reachOf(G, group.table, reads.turns, C.reach);
  if ([...reads.tables].some((t) => reach.has(t))) return { verdict: 'moves' };
  const gt = tableName(G, group.table), read = [...reads.tables].sort().map((t) => tableName(G, t));
  return { verdict: 'one value', why: `No relationship lets a filter on ${gt} reach what ${number.label} reads (${read.slice(0, 4).join(', ')}${read.length > 4 ? ` and ${read.length - 4} more` : ''}), and its DAX does not name ${gt}: every ${group.label} would show the same ${number.label}.` };
}

function judge(model, report) {
  const G = graphOf(model, report), visuals = readVisuals(G, report), C = { reads: new Map(), reach: new Map() };
  const pairs = [], notInModel = [];
  visuals.forEach((v) => {
    v.numbers.filter((n) => n.missing).forEach((n) => notInModel.push({ page: v.page, visual: v.visual, name: n.missingLabel || n.label }));
    v.groups.filter((g) => g.missing).forEach((g) => notInModel.push({ page: v.page, visual: v.visual, name: g.label }));
    v.numbers.filter((n) => !n.missing).forEach((n) => v.groups.filter((g) => !g.missing).forEach((g) => pairs.push(Object.assign({ page: v.page, visual: v.visual, type: v.type, number: n.label, by: g.label }, verdictOf(G, n, g, C)))));
  });
  return { G, visuals, pairs, notInModel, C };
}

export function visualsOf(model, report) {
  return readVisuals(graphOf(model, report), report).map((v) => ({ page: v.page, visual: v.visual, type: v.type, numbers: v.numbers.map((n) => n.label), groups: v.groups.map((g) => g.label) }));
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function checkVisuals(model, report) {
  const { visuals, pairs, notInModel } = judge(model, report);
  const count = (v) => pairs.filter((p) => p.verdict === v).length, findings = pairs.filter((p) => p.verdict === 'one value');
  const res = { visuals: visuals.length, withNumbers: visuals.filter((v) => v.numbers.length).length, moves: count('moves'), oneValue: count('one value'), constant: count('constant'), cannotTell: count('cannot tell') };
  res.said = `${res.moves} of ${pairs.length} pairs of a number and a column it is grouped by: the column can move the number`
    + (res.moves === pairs.length ? ' (every column can move its number)' : '')
    + (res.oneValue ? `; ${res.oneValue} would show one value on every row (listed)` : '') + (res.constant ? `; ${res.constant} constant by its own DAX` : '')
    + (res.cannotTell ? `; ${res.cannotTell} not judged` : '') + (notInModel.length ? `; ${plural(notInModel.length, 'name is', 'names are')} not in the model` : '') + '.';
  // every pair stays in the library's answer (a tool's stage caps it); the findings and the missing names are capped here
  res.pairs = pairs.map(({ why, ...p }) => p);
  res.findings = findings.slice(0, LISTED_MAX);
  if (findings.length > LISTED_MAX) res.notListed = findings.length - LISTED_MAX;
  res.notInModel = notInModel.slice(0, LISTED_MAX);
  if (notInModel.length > LISTED_MAX) res.notInModelNotListed = notInModel.length - LISTED_MAX;
  return Object.assign(res, { proves: PROVES, notProved: NOT_PROVED });
}

// ---- the questions: { id, measure: 'Revenue' or '[Revenue]', by: [{ table, column }] } ----
const bare = (s) => String(s == null ? '' : s).trim().replace(/^\[([\s\S]*)\]$/, '$1');
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

export function checkBrief(model, report, questions) {
  const { G, visuals, C } = judge(model, report), tied = new Set();
  const named = (list) => list.slice(0, LISTED_MAX).map((v) => ({ page: v.page, visual: v.visual, type: v.type }));
  const results = arr(questions).map((qn, i) => {
    const id = safeName(isObj(qn) && qn.id != null ? qn.id : 'q' + (i + 1));
    if (!isObj(qn) || typeof qn.measure !== 'string' || !bare(qn.measure) || (qn.by != null && !Array.isArray(qn.by)) || arr(qn.by).some((b) => !isObj(b) || typeof b.table !== 'string' || typeof b.column !== 'string'))
      return { id, status: 'not read', why: 'A question needs a measure\'s name and the columns to group it by, each a column of a table (Table[Column]; an empty list for a total).', answeredBy: [], shownBy: [] };
    const name = bare(qn.measure), key = G.nodes.has(K.m(name)) || !G.nodes.has('x:' + lc(name)) ? K.m(name) : 'x:' + lc(name), label = `[${safeName(name)}]`;
    const by = arr(qn.by).map((b) => ({ table: lc(b.table), column: lc(b.column), key: lc(b.table) + '|' + lc(b.column), label: `${safeName(b.table)}[${safeName(b.column)}]`, missing: !G.nodes.has(K.c(b.table, b.column)) }));
    const out = { id, measure: label, by: by.map((b) => b.label), answeredBy: [], shownBy: [] };
    // the visuals that show the measure; of those, the ones grouped by exactly the question's columns
    const showing = visuals.filter((v) => v.numbers.some((n) => n.key === key));
    const exact = showing.filter((v) => sameSet(v.groups.map((g) => g.table + '|' + g.column), by.map((b) => b.key)));
    // (0.3.3 OX2, the owner's D-1111-16) grouped by the question's columns and more: it answers it, split further
    const further = showing.filter((v) => { const gs = v.groups.map((g) => g.table + '|' + g.column); return gs.length > by.length && by.every((b) => gs.includes(b.key)); });
    const lacks = [G.nodes.has(key) ? null : label].concat(by.filter((b) => b.missing).map((b) => b.label)).filter(Boolean);
    if (lacks.length) return Object.assign(out, { status: 'cannot answer', why: `not in the model: ${lacks.join(', ')}` });
    const verdicts = by.map((b) => verdictOf(G, { key, label }, b, C)), stuck = verdicts.find((v) => v.verdict === 'one value'), flat = by.length && verdicts.every((v) => v.verdict === 'constant');
    if (stuck || flat) { exact.concat(further).forEach((v) => tied.add(v.id)); return Object.assign(out, { status: 'cannot answer', why: stuck ? stuck.why : `${label} reads no table of the model: it is one value on any column.`, shownBy: named(exact.concat(further)) }); }
    if (verdicts.some((v) => v.verdict === 'cannot tell')) out.notJudged = 'a column of a field parameter or a calculation group: whether it moves the measure is not judged';
    if (exact.length) { exact.forEach((v) => tied.add(v.id)); return Object.assign(out, { status: 'answered', answeredBy: named(exact) }); }
    if (further.length) {
      further.forEach((v) => tied.add(v.id));
      const extra = [...new Set(further.flatMap((v) => v.groups.filter((g) => !by.some((b) => b.key === g.table + '|' + g.column)).map((g) => g.label)))];
      return Object.assign(out, { status: 'answered', how: SPLIT_FURTHER, answeredBy: named(further), splitBy: extra.slice(0, LISTED_MAX) });
    }
    if (showing.length) { showing.forEach((v) => tied.add(v.id)); return Object.assign(out, { status: 'partly', why: `${label} is shown, but no visual groups it by ${by.length ? 'exactly ' + by.map((b) => b.label).join(' and ') : 'nothing (a total)'}.`, shownBy: named(showing) }); }
    return Object.assign(out, { status: 'not answered', why: `The model can answer it; no visual shows ${label}.` });
  });
  const n = (s) => results.filter((r) => r.status === s).length;
  const res = { questions: results.length, answered: n('answered'), splitFurther: results.filter((r) => r.how === SPLIT_FURTHER).length, partly: n('partly'), notAnswered: n('not answered'), cannotAnswer: n('cannot answer'), notRead: n('not read') };
  res.otherVisuals = visuals.filter((v) => v.numbers.length && !tied.has(v.id)).length;
  res.said = `${res.answered} of ${plural(res.questions, 'question', 'questions')} answered by a visual${res.splitFurther ? ` (${res.splitFurther} by a visual that ${SPLIT_FURTHER})` : ''}; ${res.partly} partly; ${res.notAnswered} not answered; ${res.cannotAnswer} this model cannot answer as asked`
    + (res.notRead ? `; ${res.notRead} not read` : '') + `. ${plural(res.otherVisuals, 'visual with a number is', 'visuals with a number are')} tied to no question.`;
  return Object.assign(res, { results: results.slice(0, LISTED_MAX) }, results.length > LISTED_MAX ? { notListed: results.length - LISTED_MAX } : {}, { proves: PROVES, notProved: NOT_PROVED });
}
