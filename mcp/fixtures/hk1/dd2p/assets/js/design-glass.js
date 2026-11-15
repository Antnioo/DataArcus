/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Design glass: the glass look (0.3.1 GL1-GD2), moved from design-engine.js as it was (0.3.2 SP6). The
 * look's numbers, its contrast checks, its soft background picture (pixels and PNG), the PNG's mark, the theme's
 * picture and the cards' and tables' styles. No page, no language and no globals: make() is given what it reads from
 * the engine (colours and roles of a design, the page and its units, the PNG writer) and returns the look's functions;
 * design-engine.js (DAEngine) calls it once and re-exports every name. The generator pages load this file before
 * design-engine.js (browser global DAGlass), Node requires it.
 */
(function (root) {
  const C = typeof module !== 'undefined' && module.exports ? require('./design-colours.js') : root.DAColours;
  const { hexToRgb, rgbToHex, mix, lum, contrast } = C;
  // ---------- the glass look (0.3.1 GL1, the owner's idea of 26 Oct) ----------
  // Power BI has no blur behind a visual. The look is made of what Power BI has: each visual's background colour with
  // transparency, a light 1-pixel border at the design's corners, a soft shadow, and the page's background picture,
  // which DataArcus draws already soft: the page colour with four soft colour fields of the theme's own colours (no
  // photo, no text). Seen through the see-through cards, the picture reads as frosted glass. The theme schema
  // (Microsoft's reportThemeSchema-2.159, commonCards; the validator's VCO catalog): background { show, color,
  // transparency }, border { show, color, radius, width }, dropShadow { show, color, position, preset, transparency,
  // shadowBlur, shadowDistance, shadowSpread }, each number without a range in the schema (transparency in %, 0-100).
  // t: the cards' transparency asked (%), lowered by glassLook until the contrast holds; strength: how far a colour field
  // reaches into the page colour at its centre (lowered until the page's text holds); fields: [x, y (0-1 of the page),
  // radius (of the page's height), the colour: data colour 1-3 or the accent]; the shadow at 1080 high, scaled with the
  // page; grid: the samples the contrast is checked on (the picture is the same at any size). To be picked from the
  // laptop's lab (mcp/lab/GLASS-LAB.md): t, the rim, the shadow. band: the alpha (%) of a banded table's alternate rows
  // (GL2: the solid look's 8% of the accent), raised in transparency until the text and the grid lines stand on it.
  const GLASS = { t: 35, max: 60, band: 8, strength: { light: 0.42, dark: 0.55 }, fields: [[0.1, 0.15, 0.55, 0], [0.9, 0.22, 0.6, 1], [0.6, 1, 0.65, 2], [0.02, 0.98, 0.45, 'accent']],
    // (GL2: the laptop of 27 Oct, Desktop 2.159: GL1's dark shadow, 55 / 18 / 4, barely shows on a dark page) the dark
    // shadow stronger: less transparent, wider, further; GL1's and a light halo are rows of the lab's dark page
    shadow: { light: { transparency: 85, blur: 18, distance: 4 }, dark: { transparency: 30, blur: 24, distance: 6 } }, grid: [192, 108], margin: 0.02 };
  const isGlass = (d) => !!(d && d.chart && d.chart.look === 'glass');
  // the picture's pixels (RGB, 8 bits, rows top to bottom) at w x h for colours cc ({ ui, data }) at strength s: each
  // field's weight is s * exp(-2 d^2 / r^2), taken as a row factor times a column factor (the same number, made once).
  // A page picture (960 wide or more) is drawn in squares of 2 x 2 pixels: the same soft picture (neighbours never more
  // than 2 levels apart), half the PNG's bytes
  const glassRgb = (cc, s, w, h) => {
    const u = cc.ui, bg = hexToRgb(u.background), out = new Uint8Array(w * h * 3), a = w / h, q2 = w >= 960 ? 2 : 1, at = (v, n) => (Math.floor(v / q2) * q2 + q2 / 2) / n;
    const F = GLASS.fields.map(([fx, fy, r, k]) => ({ c: hexToRgb(k === 'accent' ? u.accent : cc.data[k % cc.data.length]),
      cx: Float64Array.from({ length: w }, (_, x) => Math.exp(-2 * Math.pow((at(x, w) - fx) * a, 2) / (r * r))),
      cy: Float64Array.from({ length: h }, (_, y) => Math.exp(-2 * Math.pow(at(y, h) - fy, 2) / (r * r))) }));
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 3) {
      let r0 = bg[0], g0 = bg[1], b0 = bg[2];
      for (let f = 0; f < F.length; f++) { const q = F[f], t = s * q.cx[x] * q.cy[y]; r0 += (q.c[0] - r0) * t; g0 += (q.c[1] - g0) * t; b0 += (q.c[2] - b0) * t; }
      out[i] = Math.round(r0); out[i + 1] = Math.round(g0); out[i + 2] = Math.round(b0);
    }
    return out;
  };
  // the darkest and the lightest pixel (by luminance) of RGB pixels
  const extremesOf = (px) => { let lo = 0, hi = 0, l0 = Infinity, l1 = -1;
    const at = (i) => rgbToHex([px[i], px[i + 1], px[i + 2]]);
    for (let i = 0; i < px.length; i += 3) { const l = lum(at(i)); if (l < l0) { l0 = l; lo = i; } if (l > l1) { l1 = l; hi = i; } }
    return { darkest: at(lo), lightest: at(hi) }; };
  // The page's background picture of the glass look, a PNG at w x h (the page's own size: 1280 x 720, 1920 x 1080...)
  // (GD1) the glass picture says what it is in a tEXt chunk right after its header, so the Arabic twin knows a page
  // background that is DataArcus's soft picture (colour fields, no panels) from a picture with panels a mirrored page
  // would leave (twin-plan's pictures): the twin mirrors a glass page as it mirrors a page without a picture
  const GLASS_MARK = 'DataArcus glass look';
  const MARK_AT = 33, MARK = [...'tEXtComment\0' + GLASS_MARK].map((ch) => ch.charCodeAt(0));
  const isGlassPng = (b) => !!b && b.length > MARK_AT + 4 + MARK.length && MARK.every((c, i) => b[MARK_AT + 4 + i] === c) && ((b[MARK_AT] << 24) | (b[MARK_AT + 1] << 16) | (b[MARK_AT + 2] << 8) | b[MARK_AT + 3]) === MARK.length - 4;

  // (0.3.1 GL2, the owner, 27 Oct: "tables are not cleared of alternate rows formating") the look's tables and matrices:
  // no fill of their own. Without one Power BI's default style fills every cell (the theme's background and
  // backgroundLight) over the see-through card. Their cards have no transparency (Microsoft's capabilities for tableEx
  // and pivotTable, @microsoft/powerbi-core-visual-schema): each back colour is the card's colour with alpha 00
  // (#RRGGBBAA, the report theme schema's colour pattern), a banded table's alternate rows the look's tint; the grid
  // lines the look's own colour (their show and width stay the table style's). tb: glassLook(d).table
  const glassTables = (tb) => {
    const fill = (h) => ({ solid: { color: h } }), clear = fill(tb.clear), both = ['tableEx', 'pivotTable'];
    return [[both, 'values', { backColor: clear, backColorPrimary: clear, backColorSecondary: tb.band ? fill(tb.band) : clear }], [both, 'columnHeaders', { backColor: clear }],
      [both, 'total', { backColor: clear }], [['pivotTable'], 'rowHeaders', { backColor: clear }], [['pivotTable'], 'subTotals', { backColor: clear }],
      [['pivotTable'], 'rowTotal', { backColor: clear }], [['pivotTable'], 'columnTotal', { backColor: clear }],
      [both, 'grid', { gridHorizontalColor: fill(tb.grid), gridVerticalColor: fill(tb.grid) }]];
  };

  // e: { colours (a design's colours, the default palette's where not valid), roles (the colours a theme derives),
  // page (a layout's page { w, h, s }), toPage (design units to page units), encodePng (w, h, rgb, text, opt) }
  const make = (e) => {
    const { colours, roles, page, toPage, encodePng } = e;
    const glassCache = new Map();
    // The look for a design: { asked, t (the transparency written, %), rim, strength, shadow { transparency, blur, distance },
    // image { darkest, lightest }, checks [{ id, ratio, min, pass }] }. The worst case: the card's colour at t blended over
    // the darkest and the lightest pixel of the picture under it; text and labels 4.5:1, colour 1 3:1 (WCAG 1.4.3, 1.4.11),
    // t lowered one point at a time until all pass (0, a solid card, when none does); the page's own text 4.5:1 on the
    // picture (the strength lowered until it does). opt.t: another transparency to ask (the lab's variants).
    const glassLook = (d, opt) => {
      const cc = colours(d), u = cc.ui, l = (d && d.layout) || {}, asked = Math.max(0, Math.min(GLASS.max, Math.round(opt && opt.t != null ? +opt.t : GLASS.t)));
      const banded = !!(d && d.chart && d.chart.table === 'banded'), key = JSON.stringify([u, cc.data, page(l).h, asked, banded]);
      if (glassCache.has(key)) return glassCache.get(key);
      const light = lum(u.background) > 0.45, R = roles(u), [gw, gh] = GLASS.grid, mg = GLASS.margin;
      let s = light ? GLASS.strength.light : GLASS.strength.dark, ends = null;
      for (;; s = Math.max(0, Math.round((s - 0.02) * 100) / 100)) {
        ends = extremesOf(glassRgb(cc, s, gw, gh));
        if (s === 0 || [ends.darkest, ends.lightest].every((p) => contrast(u.text, p) >= 4.5 + mg)) break;
      }
      const over = (t, fg) => Math.min(...[ends.darkest, ends.lightest].map((p) => contrast(fg, mix(p, u.card, 1 - t / 100))));
      // the labels (the theme's secondary text) as close to the text colour as they need to stand 4.5:1 at the asked
      // transparency (roles' mix of 0.35 towards the card, less in steps of 0.05), so a pale label does not make the cards solid
      let labels = R.secondary;
      for (let r = 0.3; r >= 0 && over(asked, labels) < 4.5 + mg; r = Math.round((r - 0.05) * 100) / 100) labels = mix(u.text, u.card, r);
      const pairs = [['textOnGlass', u.text, 4.5], ['labelsOnGlass', labels, 4.5], ['color1OnGlass', cc.data[0], 3]];
      let t = asked; while (t > 0 && !pairs.every(([, fg, min]) => over(t, fg) >= min + mg)) t--;
      const k = page(l).h / 1080, sh = light ? GLASS.shadow.light : GLASS.shadow.dark;
      // (GL2) tables and matrices keep no fill of their own (glassTables): their cells are the glass card. The grid lines
      // stand at least what they stand on the solid card, darkened towards the text (steps of 0.05) until they do over
      // the glass; a banded table's alternate rows: the accent at GLASS.band % alpha, one point more transparent at a
      // time until the text (4.5:1) and the grid lines stand on it; all over the darkest and the lightest pixel
      const glass = [ends.darkest, ends.lightest].map((p) => mix(p, u.card, 1 - t / 100)), gmin = contrast(R.grid, u.card);
      const worst = (fg, xs) => Math.min(...xs.map((b) => contrast(fg, b))), bandsAt = (a) => glass.map((b) => mix(b, u.accent, a / 100));
      let grid = R.grid;
      for (let r = 0.8; r > 0 && worst(grid, glass) < gmin; r = Math.round((r - 0.05) * 100) / 100) grid = mix(u.text, u.card, r);
      let a = banded ? GLASS.band : 0;
      while (a > 0 && !(worst(u.text, bandsAt(a)) >= 4.5 + mg && worst(grid, bandsAt(a)) >= gmin)) a--;
      const table = { clear: u.card + '00', band: banded ? u.accent + Math.round(a * 255 / 100).toString(16).padStart(2, '0') : null, bandAlpha: a, grid };
      const checks = pairs.map(([id, fg, min]) => ({ id, ratio: over(t, fg), min })).concat([{ id: 'textOnPicture', ratio: Math.min(contrast(u.text, ends.darkest), contrast(u.text, ends.lightest)), min: 4.5 },
        { id: 'gridOnGlass', ratio: worst(grid, glass), min: gmin }], banded ? [{ id: 'textOnBand', ratio: worst(u.text, bandsAt(a)), min: 4.5 }, { id: 'gridOnBand', ratio: worst(grid, bandsAt(a)), min: gmin }] : [])
        .map((x) => Object.assign(x, { pass: x.ratio >= x.min }));
      const out = { asked, t, labels, rim: light ? '#ffffff' : mix(u.card, '#ffffff', 0.25), strength: s, mode: light ? 'light' : 'dark',
        shadow: { transparency: sh.transparency, blur: Math.max(1, Math.round(sh.blur * k)), distance: Math.max(1, Math.round(sh.distance * k)) }, image: ends, table, checks };
      if (glassCache.size > 50) glassCache.clear();
      glassCache.set(key, out);
      return out;
    };
    // The gate (GD1): glass only where it keeps everything readable: the cards keep some transparency (t > 0) and every
    // glass check passes, except the page's own text on its own colour once the picture is plain (strength 0), which the
    // plain look fails the same way. { fits, failed: [{ id, ratio, min }], t }
    const glassFit = (d) => {
      const g = glassLook(d), failed = g.checks.filter((c) => !c.pass && !(c.id === 'textOnPicture' && g.strength === 0)).map((c) => ({ id: c.id, ratio: c.ratio, min: c.min }));
      return { fits: g.t > 0 && !failed.length, failed, t: g.t };
    };
    // the picture's pixels at w x h (RGB), as glassLook's strength makes them
    const glassPixels = (d, w, h, opt) => glassRgb(colours(d), glassLook(d, opt).strength, Math.max(1, Math.round(+w)), Math.max(1, Math.round(+h)));
    // (0.3.1 GD2) a theme used alone, with pages DataArcus does not write (hand-placed, an existing report): the glass look's
    // picture goes in the theme itself, as its page background image. Microsoft's report theme schema
    // (powerbi-desktop-samples, reportThemeSchema-2.159.json) has visualStyles.page["*"].background[] { color, image { name,
    // url, scaling Normal|Fit|Fill }, transparency }; the url is the picture as a data URI, at the theme's page size,
    // scaling "Fit" (the schema's "Stretch", as the report writer's page.json sets it). A copy of theme with it; the theme
    // given is not changed. Whether Desktop draws a theme's picture: measured on the laptop (mcp/work/GD2.md)
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const base64 = (b) => { let out = ''; for (let i = 0; i < b.length; i += 3) { const n = (b[i] << 16) | ((b[i + 1] || 0) << 8) | (b[i + 2] || 0);
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < b.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < b.length ? B64[n & 63] : '='); } return out; };
    const withGlassPicture = (theme, d) => {
      if (!isGlass(d)) return theme;
      const p = page((d && d.layout) || {}), t = JSON.parse(JSON.stringify(theme)), vs = (t.visualStyles = t.visualStyles || {});
      const pg = (vs.page = vs.page || { '*': {} })['*'] = vs.page['*'] || {}, bg = (pg.background = Array.isArray(pg.background) && pg.background.length ? pg.background : [{}]);
      bg[0] = Object.assign({}, bg[0], { image: { name: 'DataArcus glass ' + p.w + 'x' + p.h + '.png', url: 'data:image/png;base64,' + base64(glassPng(d, p.w, p.h)), scaling: 'Fit' }, transparency: 0 });
      return t;
    };
    // (GD1: glass is the default, so every new report draws it, in its plan and again in its write: the last few pictures
    // are kept, by their colours, strength and size; each call gets its own copy)
    const pngCache = new Map();
    const glassPng = (d, w, h, opt) => { const W = Math.max(1, Math.round(+w)), H = Math.max(1, Math.round(+h)), cc = colours(d), key = JSON.stringify([cc.ui, cc.data, glassLook(d, opt).strength, W, H]);
      if (!pngCache.has(key)) { if (pngCache.size >= 8) pngCache.delete(pngCache.keys().next().value); pngCache.set(key, encodePng(W, H, glassPixels(d, W, H, opt), GLASS_MARK)); }
      return pngCache.get(key).slice(); };
    // the look's cards in the theme: background, border, shadow (see GLASS); t: the visual type
    const glassCards = (u, l, g, t) => ({
      background: [{ show: true, color: { solid: { color: u.card } }, transparency: g.t }],
      border: [Object.assign({ show: true, color: { solid: { color: g.rim } }, width: 1 }, t === 'cardVisual' ? {} : { radius: toPage(+l.radius || 0, l) })],
      dropShadow: [l && l.shadow ? { show: true, color: { solid: { color: '#000000' } }, position: 'Outer', preset: 'Bottom', transparency: g.shadow.transparency, shadowBlur: g.shadow.blur, shadowDistance: g.shadow.distance, shadowSpread: 0 } : { show: false }]
    });
    return { glassLook, glassFit, glassPixels, withGlassPicture, glassPng, glassCards };
  };

  const api = { GLASS, isGlass, glassRgb, GLASS_MARK, isGlassPng, glassTables, make };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAGlass = api;
})(typeof self !== 'undefined' ? self : this);
