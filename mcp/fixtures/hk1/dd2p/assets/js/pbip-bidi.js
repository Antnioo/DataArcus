/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's bidi isolation (0.3.2 SP43, moved from pbip-export.js unchanged): a report's visible texts made to
// read in order where Arabic and Latin runs mix.
//   isolateFiles(files, names, o) -> n
//     in:  files, the generated file map as the writer built it (a list of { path, data }; only *.Report/**.json texts
//          are read); names, the model's approved display names (only those with Arabic and a Latin run count); o.all:
//          every mixed text (an Arabic build) instead of the names
//     out: the same list, each changed file's data replaced by its isolated JSON (in place, as the writer has always
//          done: no other file, path or order changes), and n, how many texts changed
//   No state, no IO; the one rule it applies is text-measure.js's (isolateLatin, isolateNames, isolateWhole, isolateRuns).
// In Node required by pbip-export.js (which gives isolateFiles on its API, as the MCP's terminology.mjs reads it); in the
// browser loaded before it (theme-generator.js's BUILDER list, after text-measure.js): DAPbipBidi.
(function (root) {
  'use strict';
  // (SQ15b, J18-S2: the isolate rule, text-measure.js, loaded first on the website)
  const Measure = (typeof module !== 'undefined' && module.exports ? require('./text-measure.js') : root.DataArcusTextMeasure);
  // A report's visible texts isolated (0.3.0 J18; moved here from the MCP's terminology.mjs by SQ15b, J18-S2, so the
  // website's Arabic download is isolated as the MCP's report), in its files ({ path, data }) as the writer built them: the
  // formatting literals of pages, visuals and phone layouts (titles, alt texts, text boxes, button texts and tooltips), text
  // box runs, the display names of projections, page and bookmark names, and the texts of the report's Text measures
  // (their DAX string literals). Never a filter's values, a measure's or visual's name, or anything else. names: the
  // approved Arabic names whose Latin runs are isolated (isolateNames); o.all (F1, the owner's decision of 20 Oct: the
  // held-back line): EVERY mixed Arabic/Latin text (isolateLatin), a name kept in English inside an Arabic text too, page
  // and tooltip tab names included (the proof: the Arabic tooltip tab "Tooltip · Month Short" read with the English
  // first). Returns how many texts changed.
  const lit = (v) => (v && v.expr && v.expr.Literal && typeof v.expr.Literal.Value === 'string' && /^'.*'$/s.test(v.expr.Literal.Value) ? v.expr.Literal.Value : null);
  // (0.3.1 TT1) whole: a visual's title text and alt text (its title, said whole) that are English, isolated as a whole
  // (isolateWhole); parent: the object the properties belong to ('title', 'general')
  const TITLED = { title: 'text', general: 'altText' };
  function walkVisual(o, change, whole, parent) {
    if (Array.isArray(o)) { o.forEach((x) => walkVisual(x, change, whole, parent)); return; }
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'filterConfig' || k === 'selector') continue;
      if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) Object.entries(v).forEach(([pk, p]) => { const L = lit(p); if (L) { const raw = L.slice(1, -1).replace(/''/g, "'"), out = (whole && TITLED[parent] === pk ? whole(change(raw)) : change(raw)); if (out !== raw) p.expr.Literal.Value = "'" + out.replace(/'/g, "''") + "'"; } });
      if (k === 'textRuns' && Array.isArray(v)) v.forEach((r) => { if (r && typeof r.value === 'string') { const out = change(r.value); if (out !== r.value) r.value = out; } });
      if (k === 'projections' && Array.isArray(v)) v.forEach((p) => { if (p && typeof p.displayName === 'string') { const out = change(p.displayName); if (out !== p.displayName) p.displayName = out; } });
      walkVisual(v, change, whole, k);
    }
  }
  // (0.3.1 BD2) a Text measure's literals take the isolates (V1) and, where one did, the whole text is wrapped at run time
  // in U+2067 ... U+2069 (the measured rule, text-measure.js isolateLatin), once: a text joined from parts at run time
  // is wrapped whole, never each part
  const WRAP_OPEN = 'UNICHAR ( 8295 ) & ( ', WRAP_CLOSE = ' ) & UNICHAR ( 8297 )';
  const daxTexts = (expr, change) => {
    let hit = false;
    const out = String(expr).replace(/"((?:[^"]|"")*)"/g, (m, inner) => { const raw = inner.replace(/""/g, '"'), o = change(raw); if (o === raw) return m; hit = true; return '"' + o.replace(/"/g, '""') + '"'; });
    return hit && !(out.startsWith(WRAP_OPEN) && out.endsWith(WRAP_CLOSE)) ? WRAP_OPEN + out + WRAP_CLOSE : out;
  };
  function isolateFiles(files, names, o) {
    // names: the approved Arabic names with a Latin run (the others need nothing), longest first
    const list = [...new Set((names || []).map(String).filter((x) => Measure.ARABIC.test(x) && /[A-Za-z]/.test(x) && !Measure.ISOLATED.test(x)))].sort((a, b) => b.length - a.length);
    const all = !!(o && o.all);
    if (!list.length && !all) return 0;
    let n = 0; const change = (s) => { const out = all ? Measure.isolateLatin(s) : Measure.isolateNames(s, list); if (out !== s) n++; return out; };
    // (0.3.1 TT1, the owner's rule of 27 Oct) an Arabic build (all): an English title or alt text isolated as a whole
    const whole = all ? (s) => { const out = Measure.isolateWhole(s); if (out !== s) n++; return out; } : null;
    // a DAX literal is a part of its measure's text: its isolates only, the wrap goes round the whole expression (daxTexts)
    const part = (s) => { let out = all ? Measure.isolateRuns(s) : Measure.isolateNames(s, list); if (out !== s && !all && Measure.wrapped(out)) out = out.slice(1, -1); if (out !== s) n++; return out; };
    for (const f of files || []) {
      if (typeof f.data !== 'string' || !/\.Report\/.+\.json$/.test(String(f.path))) continue;
      const p = String(f.path); let j; try { j = JSON.parse(f.data); } catch (e) { continue; }
      if (!j || typeof j !== 'object') continue;
      const before = n;
      if (/\/(page|visual|mobile)\.json$/.test(p)) { if (/\/page\.json$/.test(p) && typeof j.displayName === 'string') j.displayName = change(j.displayName); walkVisual(/\/page\.json$/.test(p) ? j.objects : j, change, whole); }
      else if (/\.bookmark\.json$/.test(p) && typeof j.displayName === 'string') j.displayName = change(j.displayName);
      else if (/\/reportExtensions\.json$/.test(p) && Array.isArray(j.entities)) j.entities.forEach((e) => (e && Array.isArray(e.measures) ? e.measures : []).forEach((m) => { if (m && m.dataType === 'Text' && typeof m.expression === 'string') m.expression = daxTexts(m.expression, part); }));
      if (n !== before) f.data = JSON.stringify(j, null, 2) + (/\n$/.test(f.data) ? '\n' : '');
    }
    return n;
  }

  const api = { isolateFiles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipBidi = api;
})(typeof self !== 'undefined' ? self : this);
