/*
 * DataArcus - the field picker (the theme generator's "your own model": which field goes in each visual).
 * Draws one row per choice from the fields of a model's catalog and the current binding, and gives back the binding
 * the visitor's choices make. It reads no model, no file and nothing from the network: pbip-bind.js reads the model,
 * makes the catalog ({measures, columns}) and the binding (build), and calls render through its renderPicker.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const key = (x) => (x ? JSON.stringify([x.t, x.m != null ? 'm' : 'c', x.m != null ? x.m : x.c]) : '');
  // el: the picker's element; fields: the catalog's { measures, columns }; bind: the binding shown (its choices);
  // L(en, ar): the page's words; build(choices) -> binding and iso(name) (a field name keeps its own direction inside an
  // Arabic page) are pbip-bind.js's. Returns the getter of the binding the visitor's choices make.
  // rows: [label, kind ('m' measure, 'c' column), current choice, path in the choices]
  function render(el, fields, bind, L, { build, iso }) {
    const { measures, columns } = fields;
    const ch = bind.choices;
    const opts = (list, kind, cur) => {
      const byTable = {};
      list.forEach((x) => { (byTable[x.t] = byTable[x.t] || []).push(x); });
      return `<option value="">${esc(L('(leave empty)', '(اتركه فارغًا)'))}</option>` + Object.keys(byTable).map((t) => `<optgroup label="${esc(iso(t))}">${byTable[t].map((x) => {
        const k = key(x); return `<option value="${esc(k)}"${k === key(cur) ? ' selected' : ''}>${esc(iso(kind === 'm' ? x.m : x.c))}</option>`; }).join('')}</optgroup>`).join('');
    };
    const row = (label, kind, cur, path) => `<label class="tg-bind-row"><span>${esc(label)}</span><select class="form-select form-select-sm" data-path="${path}" data-kind="${kind}">${opts(kind === 'm' ? measures : columns, kind, cur)}</select></label>`;
    el.innerHTML = [
      `<div class="tg-bind-sec">${esc(L('KPI cards', 'بطاقات المؤشرات'))}</div>`,
      ...ch.kpis.map((k, i) => row(L('KPI ', 'المؤشر ') + (i + 1), 'm', k, 'kpis.' + i)),
      `<div class="tg-bind-sec">${esc(L('Charts', 'المخططات'))}</div>`,
      row(L('Main measure', 'المقياس الرئيسي'), 'm', ch.main, 'main'),
      row(L('Time axis (trend)', 'محور الزمن (الاتجاه)'), 'c', ch.date, 'date'),
      row(L('Category (bar, donut)', 'الفئة (أعمدة أفقية، دائري)'), 'c', ch.catA, 'catA'),
      row(L('Second category (column, table)', 'فئة ثانية (أعمدة، جدول)'), 'c', ch.catB, 'catB'),
      `<div class="tg-bind-sec">${esc(L('Filters', 'الفلاتر'))}</div>`,
      ...[0, 1, 2].map((i) => row(L('Slicer ', 'المقسم ') + (i + 1), 'c', ch.slicers[i], 'slicers.' + i))
    ].join('');
    const all = { m: measures, c: columns };
    let current = bind;
    // drawn again when the layout changes: the previous picker's listener goes
    if (el.daPick) el.removeEventListener('change', el.daPick);
    el.addEventListener('change', el.daPick = (e) => {
      const s = e.target.closest('select[data-path]'); if (!s) return;
      const pick = all[s.dataset.kind].find((x) => key(x) === s.value) || null;
      const [a, i] = s.dataset.path.split('.');
      const next = Object.assign({}, current.choices, { kpis: current.choices.kpis.slice(), slicers: current.choices.slicers.slice() });
      if (i != null) next[a][+i] = pick; else next[a] = pick;
      current = build(next);
    });
    return () => current;
  }
  const api = { render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAFieldPicker = api;
})(typeof self !== 'undefined' ? self : this);
