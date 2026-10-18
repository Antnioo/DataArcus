/*! DataArcus page preview | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// A picture of a planned report page (0.3.0 step 1, "Preview before Approve", the owner's go of 18 Oct 2026): the MCP's
// approval window shows it above Approve, and the lab page shows it for its download. One renderer for both. Browser and
// Node (module.exports / window.DAPagePreview).
// The privacy promise: the picture is drawn from the PLAN only (visual types, positions, sizes, titles, field names,
// theme colours). It never shows a data value and never makes one up: each visual gets a grey placeholder shape (bars,
// a line, a ring, rows), with no text and no number in it, and the page is labelled "preview".
// A page: { name, w, h, rtl, colors: { background, card, ink, accent }, visuals: [{ type (Power BI's visualType),
// x, y, w, h (page units, as the page places them: a right-to-left page is already mirrored), z, title }] }.
(function (root) {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // (control and format characters out of a name: they could reorder what the picture shows)
  const clean = (s) => String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g, '').trim();
  const n = (v) => String(Math.round((+v || 0) * 10) / 10);
  const hex = (c, d) => (/^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c) : d);

  // Power BI's visual types, by the shape the preview draws for them
  const KIND = [
    [/^(barChart|clusteredBarChart|stackedBarChart|hundredPercentStackedBarChart)$/, 'bar'],
    [/^(columnChart|clusteredColumnChart|stackedColumnChart|hundredPercentStackedColumnChart|waterfallChart|ribbonChart)$/, 'column'],
    [/^(lineChart|areaChart|stackedAreaChart|hundredPercentStackedAreaChart|lineClusteredColumnComboChart|lineStackedColumnComboChart)$/, 'line'],
    [/^(donutChart|pieChart)$/, 'donut'],
    [/^(card|cardVisual|multiRowCard|kpi)$/, 'card'],
    [/^(tableEx|pivotTable)$/, 'table'],
    [/^(slicer|advancedSlicerVisual|listSlicer|textSlicer)$/, 'slicer'],
    [/^textbox$/, 'text'],
    [/^image$/, 'image'],
    [/^(actionButton|pageNavigator|bookmarkNavigator)$/, 'button'],
    [/^(shape|basicShape)$/, 'shape'],
    [/^(map|filledMap|azureMap|shapeMap)$/, 'map'],
    [/^(gauge|treemap|funnel|scatterChart|decompositionTreeVisual|keyDriversVisual)$/, 'chart']
  ];
  const kindOf = (v) => (v && v.panel ? 'panel' : (KIND.find(([re]) => re.test(String(v && v.type || ''))) || [0, 'other'])[1]);
  const DATA = new Set(['bar', 'column', 'line', 'donut', 'card', 'table', 'slicer', 'map', 'chart']);
  const CHARTS = new Set(['bar', 'column', 'line', 'donut', 'table', 'map', 'chart']);

  // The layout check's own geometric flags. The numbers: OVERLAP and COVER as the MCP's design lint has them
  // (mcp/lib/design-lint.mjs, chosen, not measured); the smallest sizes are CHOSEN, NOT MEASURED: below them a chart, a card
  // or a slicer is worth a look (on the 720 grid; scaled with the page's height)
  const LIMITS = {
    PAGE_SLACK: { value: 1, source: 'chosen: a box this far past the page edge is still on the page (rounding), as the design lint' },
    OVERLAP_SHARE: { value: 0.1, source: 'chosen, not measured: an overlap above this share of the smaller visual, as the design lint' },
    COVER_NEAR: { value: 3, source: 'chosen, not measured: a card within this of another visual\'s box lies over it on purpose (a "no data" message), as the design lint' },
    MIN_CHART: { value: [140, 100], source: 'chosen, not measured: a chart or table narrower or lower than this (720 grid) is too small to read' },
    MIN_CARD: { value: [70, 40], source: 'chosen, not measured: a card smaller than this (720 grid)' },
    MIN_SLICER: { value: [70, 28], source: 'chosen, not measured: a slicer smaller than this (720 grid)' }
  };
  const V = (k) => LIMITS[k].value;

  /** The flags of a page's layout: [{ i (the visual's index), kind: 'cut' | 'overlap' | 'small', other? }]. */
  function check(page) {
    const W = +page.w || 0, H = +page.h || 0, s = H ? H / 720 : 1, out = [], vs = page.visuals || [];
    const add = (i, kind, other) => { if (!out.some((f) => f.i === i && f.kind === kind)) out.push(other == null ? { i, kind } : { i, kind, other }); };
    vs.forEach((v, i) => {
      const k = kindOf(v), sl = V('PAGE_SLACK');
      if (k !== 'panel' && W && H && (v.x < -sl || v.y < -sl || v.x + v.w > W + sl || v.y + v.h > H + sl)) add(i, 'cut');
      const min = CHARTS.has(k) ? V('MIN_CHART') : k === 'card' ? V('MIN_CARD') : k === 'slicer' ? V('MIN_SLICER') : null;
      if (min && (v.w < min[0] * s || v.h < min[1] * s)) add(i, 'small');
    });
    const data = vs.map((v, i) => ({ v, i, k: kindOf(v) })).filter((x) => DATA.has(x.k));
    const near = (a, b) => Math.abs(a - b) <= V('COVER_NEAR');
    for (let a = 0; a < data.length; a++) for (let b = a + 1; b < data.length; b++) {
      const A = data[a].v, B = data[b].v;
      const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (ox <= 2 || oy <= 2) continue;
      // (a card on another visual at the same place is a "no data" message, or a table's panel: meant, not an overlap)
      if ((data[a].k === 'card' || data[b].k === 'card') && near(A.x, B.x) && near(A.y, B.y) && near(A.w, B.w)) continue;
      if (ox * oy / Math.max(1, Math.min(A.w * A.h, B.w * B.h)) > V('OVERLAP_SHARE')) { add(data[a].i, 'overlap', data[b].i); add(data[b].i, 'overlap', data[a].i); }
    }
    return out;
  }

  const WORDS = {
    en: { preview: 'preview', cut: 'cut off', overlap: 'overlap', small: 'too small', page: 'Preview of the page', visuals: 'visuals', flags: 'to check' },
    ar: { preview: 'معاينة', cut: 'مقطوع', overlap: 'تداخل', small: 'صغير جدًا', page: 'معاينة الصفحة', visuals: 'عناصر', flags: 'للمراجعة' }
  };
  const GREY = '#A3ACBB', WARN = '#B7791F';

  // a placeholder shape inside a box (local 0..1 coordinates mapped to the box; mirrored right to left): never text
  function shape(k, b, rtl, c, u) {
    const X = (f) => (rtl ? b.x + b.w * (1 - f) : b.x + b.w * f), Y = (f) => b.y + b.h * f;
    const R = (f0, g0, fw, gh, fill, op) => { const x0 = rtl ? X(f0 + fw) : X(f0); return `<rect x="${n(x0)}" y="${n(Y(g0))}" width="${n(b.w * fw)}" height="${n(b.h * gh)}" rx="${n(Math.min(b.w * fw, b.h * gh, 24 * u) * 0.2)}" fill="${fill || GREY}"${op ? ` opacity="${op}"` : ''}/>`; };
    switch (k) {
      case 'bar': return [0.86, 0.7, 0.56, 0.42, 0.3].map((f, i) => R(0.06, 0.08 + i * 0.18, f * 0.88, 0.11)).join('');
      case 'column': return [0.5, 0.78, 0.6, 0.9, 0.66, 0.8].map((f, i) => R(0.07 + i * 0.145, 0.95 - f * 0.88, 0.1, f * 0.88)).join('');
      case 'line': {
        const pts = [[0, 0.7], [0.17, 0.52], [0.33, 0.6], [0.5, 0.36], [0.67, 0.45], [0.83, 0.24], [1, 0.32]].map(([f, g]) => `${n(X(0.04 + f * 0.92))},${n(Y(0.05 + g * 0.85))}`).join(' ');
        return `<polyline points="${pts}" fill="none" stroke="${GREY}" stroke-width="${n(Math.max(2, b.h * 0.035))}" stroke-linejoin="round" stroke-linecap="round"/><line x1="${n(X(0.04))}" y1="${n(Y(0.96))}" x2="${n(X(0.96))}" y2="${n(Y(0.96))}" stroke="${GREY}" stroke-width="${n(Math.max(1, b.h * 0.008))}" opacity=".6"/>`;
      }
      case 'donut': { const r = Math.min(b.w, b.h) * 0.36; return `<circle cx="${n(b.x + b.w / 2)}" cy="${n(b.y + b.h / 2)}" r="${n(r)}" fill="none" stroke="${GREY}" stroke-width="${n(r * 0.42)}"/>`; }
      case 'card': return R(0.06, 0.25, 0.46, 0.4);
      case 'table': return R(0, 0, 1, 0.13, GREY, '.9') + [0.24, 0.42, 0.6, 0.78].map((g) => R(0, g, 1, 0.07, GREY, '.45')).join('');
      case 'slicer': {
        // (drop-downs of a fixed height, as many as the box holds, up to 3: a filter panel's slicers)
        const dh = Math.min(b.h, 26 * u), k2 = Math.max(1, Math.min(3, Math.floor(b.h / (dh * 1.6))));
        return Array.from({ length: k2 }, (x, j) => { const y = b.y + j * dh * 1.6, bw = b.w * 0.5, bx = rtl ? b.x + b.w - 6 * u - bw : b.x + 6 * u;
          return `<rect x="${n(b.x)}" y="${n(y)}" width="${n(b.w)}" height="${n(dh)}" rx="${n(4 * u)}" fill="none" stroke="${GREY}" stroke-width="${n(u)}"/><rect x="${n(bx)}" y="${n(y + dh * 0.36)}" width="${n(bw)}" height="${n(dh * 0.28)}" rx="${n(dh * 0.1)}" fill="${GREY}"/>`; }).join('');
      }
      case 'text': return R(0, 0.2, 0.7, 0.22) + R(0, 0.58, 0.45, 0.22);
      case 'image': return `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" fill="none" stroke="${GREY}" stroke-dasharray="${n(Math.max(3, b.h * 0.08))}"/>`;
      case 'button': return `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" rx="${n(b.h / 2)}" fill="none" stroke="${GREY}" stroke-width="${n(Math.max(1, b.h * 0.06))}"/>`;
      case 'shape': return `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" fill="${c.accent}" opacity=".55"/>`;
      case 'map': return `<ellipse cx="${n(b.x + b.w / 2)}" cy="${n(b.y + b.h / 2)}" rx="${n(b.w * 0.34)}" ry="${n(b.h * 0.3)}" fill="${GREY}" opacity=".6"/>`;
      case 'panel': return '';
      default: return R(0.3, 0.3, 0.4, 0.4, GREY, '.5');
    }
  }

  /** The SVG picture of a page. opts: { lang: 'en' | 'ar', width (display width, px; default 800), flags (more flags,
   *  [{ i, kind }], from the layout check; a page's own flags are drawn too) }. Deterministic: the same page and options give the same string. */
  function render(page, opts) {
    const o = opts || {}, lang = o.lang === 'ar' ? 'ar' : 'en', T = WORDS[lang], W = Math.max(1, +page.w || 1280), H = Math.max(1, +page.h || 720), rtl = !!page.rtl;
    const width = Math.max(160, Math.round(+o.width || 800)), height = Math.round(width * H / W), u = W / width;   // u: page units per pixel
    const c = Object.assign({ background: '#F4F6FA', card: '#FFFFFF', ink: '#14213D', accent: '#0F7C90' }, page.colors || {});
    const col = { background: hex(c.background, '#F4F6FA'), card: hex(c.card, '#FFFFFF'), ink: hex(c.ink, '#14213D'), accent: hex(c.accent, '#0F7C90') };
    const fs = 11 * u, pad = 8 * u, vs = page.visuals || [];
    const flags = check(page);
    (page.flags || []).concat(o.flags || []).forEach((f) => { if (f && vs[f.i] && /^(cut|overlap|small)$/.test(f.kind) && !flags.some((g) => g.i === f.i && g.kind === f.kind)) flags.push({ i: f.i, kind: f.kind }); });
    // (a title shortened with "…" by an estimate of its width: a picture, not a measurement)
    const fit = (s, room) => { const t = clean(s), max = Math.max(1, Math.floor(room / (fs * 0.56))); return t.length > max ? t.slice(0, Math.max(1, max - 1)) + '…' : t; };
    const order = vs.map((v, i) => i).sort((a, b) => ((+vs[a].z || 0) - (+vs[b].z || 0)) || a - b);
    const font = `font-family="'Segoe UI', Tahoma, Arial, sans-serif"`;
    const body = order.map((i) => {
      const v = vs[i], k = kindOf(v), b = { x: +v.x || 0, y: +v.y || 0, w: Math.max(0, +v.w || 0), h: Math.max(0, +v.h || 0) };
      const title = clean(v.title), boxed = !/^(text|image|button|shape)$/.test(k);
      const panel = boxed ? `<rect class="box" x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" rx="${n(6 * u)}" fill="${col.card}" stroke="${GREY}" stroke-opacity=".35" stroke-width="${n(u)}"/>`
        : `<rect class="box" x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" fill="none"/>`;
      if (k === 'panel') return `<g class="v" data-i="${i}" data-kind="panel">${panel}</g>`;
      const showTitle = title && b.h >= fs * 1.6 && b.w >= fs * 3;
      const head = showTitle ? fs * 1.9 : 0, tx = rtl ? b.x + b.w - pad : b.x + pad;
      const t = showTitle ? `<text class="t" x="${n(tx)}" y="${n(b.y + pad + fs * 0.9)}" ${font} font-size="${n(fs)}" font-weight="600" fill="${col.ink}" text-anchor="${rtl ? 'end' : 'start'}">${esc(fit(title, b.w - 2 * pad))}</text>` : '';
      // (the shape below the title, inside the box's padding; a text box or a button is only its title or its outline)
      const inner = k === 'text' && showTitle ? '' : k === 'image' || k === 'button' || k === 'shape' ? shape(k, b, rtl, col, u)
        : shape(k, { x: b.x + pad, y: b.y + head + pad * 0.5, w: Math.max(0, b.w - 2 * pad), h: Math.max(0, b.h - head - pad * 1.5) }, rtl, col, u);
      return `<g class="v" data-i="${i}" data-kind="${k}">${panel}${inner ? `<g class="ph">${inner}</g>` : ''}${t}</g>`;
    }).join('');
    // the flags: a dashed outline in a calm amber and the flag's word in a small tag at the box's top corner (inside the page)
    const marks = flags.map((f) => {
      const v = vs[f.i], word = T[f.kind], tw = word.length * fs * 0.58 + 2 * pad * 0.7, th = fs * 1.5;
      const bx = Math.min(Math.max(0, +v.x), W - tw), by = Math.min(Math.max(0, +v.y), H - th);
      const x0 = rtl ? bx : Math.min(W - tw, Math.max(0, +v.x + +v.w - tw)), stack = flags.filter((g) => g.i === f.i).indexOf(f) * (th + 2 * u);
      return `<g class="flag" data-i="${f.i}" data-flag="${f.kind}"><rect x="${n(v.x)}" y="${n(v.y)}" width="${n(v.w)}" height="${n(v.h)}" rx="${n(6 * u)}" fill="none" stroke="${WARN}" stroke-width="${n(2 * u)}" stroke-dasharray="${n(6 * u)} ${n(4 * u)}"/>`
        + `<rect x="${n(x0)}" y="${n(by + stack)}" width="${n(tw)}" height="${n(th)}" rx="${n(th / 2)}" fill="#FFF7E6" stroke="${WARN}" stroke-width="${n(u)}"/>`
        + `<text x="${n(x0 + tw / 2)}" y="${n(by + stack + th * 0.7)}" ${font} font-size="${n(fs * 0.9)}" fill="#7A4E00" text-anchor="middle">${esc(word)}</text></g>`;
    }).join('');
    const tag = `<text class="pv" x="${n(rtl ? 6 * u : W - 6 * u)}" y="${n(H - 6 * u)}" ${font} font-size="${n(fs)}" fill="${GREY}" text-anchor="${rtl ? 'start' : 'end'}" font-style="italic">${esc(T.preview)}</text>`;
    const label = `${T.page} ${clean(page.name)}: ${vs.filter((v) => kindOf(v) !== 'panel').length} ${T.visuals}${flags.length ? `, ${flags.length} ${T.flags}` : ''}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(W)} ${n(H)}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">`
      + `<rect class="page" x="0" y="0" width="${n(W)}" height="${n(H)}" fill="${col.background}" stroke="${GREY}" stroke-opacity=".5" stroke-width="${n(u)}"/>${body}${marks}${tag}</svg>`;
  }

  // ---- the pages, from what the report writer writes or from the design engine's slots ----
  const txt = (d) => (typeof d === 'string' ? d : new TextDecoder().decode(d));
  const lit = (p) => { const v = p && p.expr && p.expr.Literal && p.expr.Literal.Value; return typeof v === 'string' && /^'.*'$/s.test(v) ? v.slice(1, -1).replace(/''/g, "'") : null; };
  // a visual's title as the plan sets it: its text, or the report measure a Top N title is made by ("Title: <title>")
  const titleOf = (j) => {
    const t = ((((j.visual || {}).visualContainerObjects || {}).title) || []).find((e) => e && !e.selector && e.properties) || {}, p = t.properties || {};
    if (p.show && p.show.expr && p.show.expr.Literal && String(p.show.expr.Literal.Value) === 'false') return '';
    const l = lit(p.text); if (l != null) return l;
    const m = p.text && p.text.expr && p.text.expr.Measure; return m && /^Title: /.test(String(m.Property || '')) ? String(m.Property).slice(7) : '';
  };
  const textOf = (j) => ((((j.visual || {}).objects || {}).general || [])[0] || { properties: {} }).properties.paragraphs ? j.visual.objects.general[0].properties.paragraphs.map((p) => (p.textRuns || []).map((r) => String(r.value || '')).join('')).join(' ') : '';
  const hasFields = (j) => Object.values(((j.visual || {}).query || {}).queryState || {}).some((r) => r && Array.isArray(r.projections) && r.projections.length);

  /** The pages a report shows, from the files the report writer gives ([{ path, data }], PBIR): page order, size,
   *  every shown visual at its page position (inside groups too); the tooltip and hidden pages and hidden visuals left
   *  out. A card with no field and no title, or a text box with no text, is a panel (the writer's panel behind a chart,
   *  the header band, the filter rail). The visuals in their drawing
   *  order (z, then place: the writer's names are random, so they never decide it). opts: { rtl, colors }. */
  function fromFiles(files, opts) {
    const o = opts || {}, by = new Map();
    (files || []).forEach((f) => { const m = /(?:^|\/)definition\/pages\/(.+)$/.exec(String(f.path || '')); if (m) by.set(m[1], f.data); });
    const json = (rel) => { try { return by.has(rel) ? JSON.parse(txt(by.get(rel))) : null; } catch (e) { return null; } };
    const order = ((json('pages.json') || {}).pageOrder || []).map(String);
    return order.map((id) => ({ id, pj: json(`${id}/page.json`) })).filter((p) => p.pj && p.pj.type !== 'Tooltip' && p.pj.visibility !== 'HiddenInViewMode').map(({ id, pj }) => {
      const list = [...by.keys()].filter((k) => k.startsWith(id + '/visuals/') && /\/visual\.json$/.test(k)).map((k) => json(k)).filter(Boolean)
        .sort((a, b) => ((+(a.position || {}).z || 0) - (+(b.position || {}).z || 0)) || (+(a.position || {}).y || 0) - (+(b.position || {}).y || 0) || (+(a.position || {}).x || 0) - (+(b.position || {}).x || 0));
      const byName = new Map(list.map((j) => [String(j.name), j]));
      const at = (j) => { let x = +(j.position || {}).x || 0, y = +(j.position || {}).y || 0, g = j.parentGroupName, hid = !!j.isHidden, d = 0; while (g && byName.has(g) && d++ < 10) { const q = byName.get(g); x += +(q.position || {}).x || 0; y += +(q.position || {}).y || 0; hid = hid || !!q.isHidden; g = q.parentGroupName; } return { x, y, hid }; };
      const visuals = list.filter((j) => !j.visualGroup && j.visual).map((j) => {
        const p = at(j), type = String(j.visual.visualType || 'unknown'), title = type === 'textbox' ? textOf(j) : titleOf(j);
        return p.hid ? null : Object.assign({ type, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, w: +(j.position || {}).width || 0, h: +(j.position || {}).height || 0, z: +(j.position || {}).z || 0, title },
          (/^(card|cardVisual|multiRowCard)$/.test(type) && !hasFields(j) || type === 'textbox') && !title ? { panel: true } : {});
      }).filter(Boolean);
      return { name: String(pj.displayName || id), w: +pj.width || 0, h: +pj.height || 0, rtl: !!o.rtl, colors: o.colors || null, visuals };
    });
  }

  // the design engine's slot kinds, as Power BI's visual types
  const SLOT = { kpi: 'cardVisual', line: 'lineChart', bar: 'clusteredBarChart', column: 'clusteredColumnChart', donut: 'donutChart', table: 'tableEx', slicer: 'slicer', filters: 'slicer', text: 'textbox', title: 'textbox', logo: 'image' };
  /** A page from the design engine's slots ({ kind, role, x, y, w, h }), the plan before the writer lays it out. */
  function fromSlots(slots, page, opts) {
    const o = opts || {};
    return { name: String(o.name || ''), w: +(page || {}).w || 1280, h: +(page || {}).h || 720, rtl: !!o.rtl, colors: o.colors || null,
      visuals: (slots || []).map((s) => ({ type: SLOT[s.kind] || String(s.kind || 'unknown'), x: +s.x || 0, y: +s.y || 0, w: +s.w || 0, h: +s.h || 0, title: s.title || s.role || '' })) };
  }

  const api = { render, check, fromFiles, fromSlots, kindOf, LIMITS, WORDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPagePreview = api;
})(typeof self !== 'undefined' ? self : this);
