/*
 * DataArcus SVG KPI Designer: page UI.
 * Phase 1: pick a starter design, map it to your own measure names, preview it, copy the DAX.
 * The design is compiled by svg-kpi-compiler.js; the preview is the exact image URL the DAX returns.
 * (c) DataArcus. All rights reserved.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params); };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const K = window.SVGKPI, T = window.SVGKPITemplates;
  if (!K || !T || !$('stage')) return;
  const STORE = 'dataarcus-svg-kpi-v1';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---------- state ----------
  let design = null;
  try { design = JSON.parse(localStorage.getItem(STORE)); } catch (e) { design = null; }
  if (!design || !Array.isArray(design.layers)) design = clone(T.TEMPLATES[0]);
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(design)); } catch (e) { /* private mode */ } };

  const samples = () => {
    const m = {};
    design.values.forEach((v) => { if (v.kind === 'measure' && v.sample !== '' && v.sample != null && isFinite(+v.sample)) m[v.measure] = +v.sample; });
    return m;
  };
  const byId = (id) => design.values.find((v) => v.id === id);
  const KIND = { ratio: '÷', diff: '−', pct: '% change vs' };

  // ---------- render ----------
  const renderStarters = () => {
    $('starters').innerHTML = T.TEMPLATES.map((t) => `<button class="kd-starter${t.id === design.id ? ' active' : ''}" type="button" data-t="${t.id}">${esc(t.name)}</button>`).join('');
  };
  const renderValues = () => {
    const rows = design.values.map((v, i) => {
      if (v.kind === 'measure') {
        return `<div>${esc(v.label)}</div><input data-i="${i}" data-f="measure" value="${esc(v.measure)}" aria-label="${esc(v.label)} measure name" spellcheck="false"><input data-i="${i}" data-f="sample" type="number" step="any" value="${esc(v.sample)}" aria-label="${esc(v.label)} sample value">`;
      }
      const a = byId(v.a), b = byId(v.b);
      return `<div>${esc(v.label)}</div><div class="calc" style="grid-column: span 2">${esc(a ? a.label : v.a)} ${KIND[v.kind] || v.kind} ${esc(b ? b.label : v.b)}</div>`;
    });
    $('values').innerHTML = '<div class="h">Value</div><div class="h">Measure name</div><div class="h">Sample</div>' + rows.join('');
  };
  const renderOutput = () => {
    const out = K.toImageUrl(design, samples());
    const scale = Math.min(3, 300 / Math.max(design.w, design.h));
    $('stage').innerHTML = out.url
      ? `<img src="${esc(out.url)}" width="${Math.round(design.w * scale)}" height="${Math.round(design.h * scale)}" alt="Preview of ${esc(design.name)}">`
      : '<span class="text-white-50 small">Blank: the measure returns nothing for this row (the main measure is blank).</span>';
    const d = K.toDax(design);
    $('dax').textContent = d.dax;
    const errs = out.errors.concat(d.errors).filter((e, i, a) => a.indexOf(e) === i);
    $('errors').textContent = errs.join(' · ');
    save();
  };
  const renderAll = () => { renderStarters(); renderValues(); renderOutput(); };

  // ---------- events ----------
  $('starters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    const t = T.TEMPLATES.find((x) => x.id === b.dataset.t); if (!t) return;
    // keep the measure names and samples the visitor already typed
    const old = {}; design.values.forEach((v) => { if (v.kind === 'measure') old[v.id] = v; });
    design = clone(t);
    design.values.forEach((v) => { if (old[v.id]) { v.measure = old[v.id].measure; v.sample = old[v.id].sample; } });
    renderAll(); track('svgkpi_template_select', { template: t.id });
  });
  $('values').addEventListener('input', (e) => {
    const el = e.target; if (el.dataset.i == null) return;
    const v = design.values[+el.dataset.i];
    if (el.dataset.f === 'measure') v.measure = el.value.replace(/^\[|\]$/g, '');
    else v.sample = el.value === '' ? '' : +el.value;
    renderOutput();
  });

  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 1800); };
  $('copyBtn').addEventListener('click', () => {
    const text = $('dax').textContent;
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('dax')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selected. Press Ctrl+C to copy'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('DAX copied'), fallback); else fallback();
    track('svgkpi_copy', { template: design.id || 'custom' });
  });

  renderAll();
});
