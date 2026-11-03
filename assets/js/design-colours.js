/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Design colours: the design engine's colour math, with no page and no design (0.3.2 SP6, moved from
 * design-engine.js as it was). Hex colours, contrast (WCAG), HSL, harmonies, the calm palette, CIE Lab and CIEDE2000,
 * colour-vision simulation and the colours of a logo. Every input is an argument: nothing here reads a design, a
 * default palette, the page or a language. design-engine.js (DAEngine) re-exports every name; the generator pages load
 * this file before design-engine.js (browser global DAColours), Node requires it.
 */
(function (root) {
  // ---------- color math ----------
  // #1a2b3c, 1a2b3c or the short #abc form, spaces around allowed; anything else is not a color (null)
  const clampHex = (v) => { v = (v || '').trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-fA-F]{3}$/.test(v)) v = '#' + [...v.slice(1)].map((c) => c + c).join(''); return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null; };
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbToHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const lum = (h) => { const c = hexToRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hexToHsl = (h) => {
    let [r, g, b] = hexToRgb(h).map((v) => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let hh = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; }
    return [hh, s, l];
  };
  const hslToHex = (h, s, l) => {
    h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
  };
  // (polish round P1, RESCORE-5: adventureworks' lead 1.6:1 and property's 1.8:1 on their cards: thin lines and flat
  // bars) a colour under min:1 on the card, its hue and saturation kept, stepped to the first lightness at min:1
  // (darker on a light card, lighter on a dark one); moved here from the MCP so the writer chooses with it too
  const toContrast = (c, card, min) => {
    if (contrast(c, card) >= min) return c;
    const [h, sat, l0] = hexToHsl(c), darker = lum(card) > 0.45;
    for (let i = 1; i <= 100; i++) { const l = darker ? l0 - i / 100 : l0 + i / 100; if (l < 0 || l > 1) break; const x = hslToHex(h, sat, l); if (contrast(x, card) >= min) return x; }
    return c;
  };
  // Status hues (P1, RESCORE-5; shared with the MCP since P3): red under 15 or 345 and over, amber 35 to 55, green 90 to
  // 150 degrees, at saturation 0.35 and over (a grey or a muted colour is never a status colour); null otherwise
  const STATUS_HUES = { bad: (h) => h < 15 || h >= 345, neutral: (h) => h >= 35 && h <= 55, good: (h) => h >= 90 && h <= 150 };
  const statusHue = (c) => { const x = clampHex(c || ''); if (!x) return null; const [h, sat] = hexToHsl(x); return sat >= 0.35 ? Object.keys(STATUS_HUES).find((k) => STATUS_HUES[k](h)) || null : null; };
  // The second chart's colour (P1+, the laptop's LAB-POLISH section 5; P3, RESCORE-6 N26: complaints and ecommerce got
  // #E63946, inspection its own status red): the palette's next colour that is not a status colour (a red, amber or green
  // hue, or one of st's good/neutral/bad), stands at least 30 degrees of hue from the lead (a grey, saturation under 0.15,
  // has no hue to tell apart) and 3:1 on the card; with none at 3:1, the first such hue taken to 3:1 (toContrast); with
  // none in the palette, the first calm colour (CALM, below) that passes, taken to 3:1. st: { good, neutral, bad }
  const secondColour = (data, card, st) => {
    const lead = clampHex((data || [])[0] || ''); if (!lead || !clampHex(card || '')) return null;
    const own = ['good', 'neutral', 'bad'].map((k) => clampHex(((st || {})[k]) || '')).filter(Boolean);
    const [h0, s0] = hexToHsl(lead), far = (c) => { const [h, sat] = hexToHsl(c); if (sat < 0.15) return false; if (s0 < 0.15) return true; const d = Math.abs(h - h0) % 360; return Math.min(d, 360 - d) >= 30; };
    const ok = (c) => c && far(c) && !statusHue(c) && !own.includes(c);
    const rest = data.slice(1).map((c) => clampHex(c || '')).filter(ok);
    const pick = rest.find((c) => contrast(c, card) >= 3) || rest[0] || CALM.find(ok);
    return pick ? toContrast(pick, card, 3) : null;
  };
  // The ends of a bar's fade by value (P3, RESCORE-6 N25: a darkened lead faded the other way, the largest bars brown):
  // the strong end is the chart's colour exactly, never past it; the weak end the lightest tint of it towards the card
  // that still stands 3:1 there, or, where none does (the colour itself near 3:1), a soft tint halfway (soft: true); a
  // colour under 3:1 itself does not fade (null: every bar keeps it, round 13's rule)
  const fadeEnds = (base, card) => {
    const b = clampHex(base || ''), k = clampHex(card || ''); if (!b || !k || contrast(b, k) < 3) return null;
    for (let n = 12; n >= 3; n--) { const low = mix(b, k, n / 20); if (contrast(low, k) >= 3 && contrast(low, k) < contrast(b, k)) return { low, high: b }; }
    return { low: mix(b, k, 0.45), high: b, soft: true };
  };
  const generate = (base, mode) => {
    const [h, s0, l0] = hexToHsl(base); const s = Math.max(0.45, s0), l = Math.min(0.55, Math.max(0.4, l0));
    const plans = {
      analogous: [[0, 0], [30, 0.05], [-30, 0.05], [60, 0.12], [-60, 0.1], [0, 0.2], [30, -0.12], [-30, -0.12]],
      complementary: [[0, 0], [180, 0], [0, 0.18], [180, 0.18], [0, -0.14], [180, -0.14], [30, 0.1], [210, 0.1]],
      triadic: [[0, 0], [120, 0], [240, 0], [0, 0.18], [120, 0.18], [240, 0.18], [60, 0.05], [180, 0.05]],
      mono: [[0, -0.2], [0, -0.1], [0, 0], [0, 0.1], [0, 0.18], [0, 0.26], [0, 0.32], [0, 0.38]]
    };
    // The 0.15 floor is never reached today: the base lightness is held at 0.4-0.55 and no step above goes down more
    // than 0.2, so the darkest colour is 0.2. It stays as a safety limit in case the steps change.
    return plans[mode].map(([dh, dl]) => hslToHex(h + dh, s, Math.min(0.85, Math.max(0.15, l + dl))));
  };
  // A calm palette beside a brand colour (0.2.9, the reviewer of 11 Oct: the analogous harmony gave loud colours beside
  // the owner's brand; moved here from the MCP by the cross-review's G7, so the website and the MCP give the same one):
  // the brand exactly, then up to 7 calm colours told apart by hue (one within 25 degrees of the brand's is skipped), each
  // mixed towards the text colour until it stands 3:1 on the visuals' background (card)
  const CALM = ['#2f6e9e', '#b86e00', '#1f7a70', '#6a4c93', '#b5452f', '#56636f', '#5e7f3a', '#8e5b2e', '#a23b72', '#3d7ea6'];
  const calmPalette = (brand, card, text) => {
    const near = (a, b) => { const [h1, s1] = hexToHsl(a), [h2, s2] = hexToHsl(b), d = Math.abs(h1 - h2) % 360; return s1 > 0.15 && s2 > 0.15 && Math.min(d, 360 - d) < 25; };
    const out = [];
    for (const c0 of CALM) {
      if (out.length === 7) break;
      if (near(c0, brand)) continue;
      let c = c0; for (let t = 0.1; contrast(c, card) < 3 && t <= 1; t += 0.1) c = mix(c0, text, t);
      if (!out.includes(c) && c !== brand) out.push(c);
    }
    return [brand].concat(out).slice(0, 8);
  };

  // ---------- a theme from a logo (0.3.0 step 6) ----------
  // The visitor's logo is read in the browser only: the page draws it on a small canvas and hands its pixels (RGBA, as
  // getImageData gives them) to logoColours; nothing here sees a file or a network. logoTheme builds the palette from
  // those colours with generate() (the generator's "Generate" from one brand colour), never a second palette system.
  // CIE Lab (D65, 2 degrees) from sRGB [r, g, b] 0-255
  const toLinear = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const fromLinear = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  const rgbToLab = (rgb) => {
    const [r, g, b] = rgb.map(toLinear), f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
    const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047), y = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b), z = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  const hexToLab = (h) => rgbToLab(hexToRgb(h));
  // CIEDE2000 between two Lab colours (Sharma, Wu, Dalal 2005): under 2-3 most eyes see one colour
  const deltaE = (p, q) => {
    const rad = Math.PI / 180, [L1, a1, b1] = p, [L2, a2, b2] = q, s7 = (c) => Math.sqrt(Math.pow(c, 7) / (Math.pow(c, 7) + Math.pow(25, 7)));
    const G = 0.5 * (1 - s7((Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2)), A1 = (1 + G) * a1, A2 = (1 + G) * a2;
    const C1 = Math.hypot(A1, b1), C2 = Math.hypot(A2, b2), hue = (b, a) => (b === 0 && a === 0 ? 0 : (Math.atan2(b, a) / rad + 360) % 360);
    const h1 = hue(b1, A1), h2 = hue(b2, A2), both = C1 * C2 !== 0;
    let dh = both ? h2 - h1 : 0; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
    const dH = 2 * Math.sqrt(C1 * C2) * Math.sin(dh * rad / 2), Lm = (L1 + L2) / 2, Cm = (C1 + C2) / 2;
    let hm = h1 + h2; if (both) { if (Math.abs(h1 - h2) > 180) hm += hm < 360 ? 360 : -360; hm /= 2; }
    const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
    const SL = 1 + 0.015 * (Lm - 50) * (Lm - 50) / Math.sqrt(20 + (Lm - 50) * (Lm - 50)), SC = 1 + 0.045 * Cm, SH = 1 + 0.015 * Cm * T;
    const RT = -2 * s7(Cm) * Math.sin(60 * Math.exp(-Math.pow((hm - 275) / 25, 2)) * rad), dC = (C2 - C1) / SC, dHs = dH / SH;
    return Math.sqrt(Math.pow((L2 - L1) / SL, 2) + dC * dC + dHs * dHs + RT * dC * dHs);
  };
  // How a colour looks with no red cones (protanopia) or no green cones (deuteranopia): Machado, Oliveira and Fernandes
  // (2009), severity 1, applied in linear RGB. 'normal' (or anything else) gives the colour back.
  const CVD = { protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]] };
  const simulateCvd = (hex, kind) => {
    const c = clampHex(hex || ''), M = CVD[kind]; if (!c || !M) return c;
    const l = hexToRgb(c).map(toLinear);
    return rgbToHex(M.map((r) => fromLinear(Math.max(0, Math.min(1, r[0] * l[0] + r[1] * l[1] + r[2] * l[2])))));
  };
  // What counts as background in a logo: a pixel under half opaque; a near-white or near-black one with almost no colour
  // (Lab lightness 90+ or 12-, chroma under 12: a white page, a light frame, a black outline); a grey (chroma under 8)
  // is no hue and counts only when the logo has nothing else. Colours are clustered (k-means in Lab, weighted by pixels,
  // seeded the same way every time), clusters closer than 12 (CIEDE2000) merged, a cluster that is only the blend of a
  // heavier one with white, black or another (the soft edge a canvas draws) dropped, and clusters under 4% of the
  // coloured pixels left out; the 3 largest are the brand colours, each the logo's own most frequent colour in it.
  const LOGO = { alpha: 128, light: 90, dark: 12, flat: 12, grey: 8, k: 6, merge: 12, blend: 6, share: 0.04, max: 3, apart: 20 };
  const logoColours = (px) => {
    px = px || []; const counts = new Map(), skipped = { transparent: 0, light: 0, dark: 0 };
    for (let i = 0; i + 3 < px.length; i += 4) {
      if (px[i + 3] < LOGO.alpha) { skipped.transparent++; continue; }
      const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2]; counts.set(key, (counts.get(key) || 0) + 1);
    }
    const hues = [], greys = [], darks = [];
    counts.forEach((w, key) => {
      const rgb = [(key >> 16) & 255, (key >> 8) & 255, key & 255], lab = rgbToLab(rgb), C = Math.hypot(lab[1], lab[2]), p = { hex: rgbToHex(rgb), lab, w };
      if (lab[0] >= LOGO.light && C < LOGO.flat) skipped.light += w;
      else if (lab[0] <= LOGO.dark && C < LOGO.flat) { skipped.dark += w; darks.push(p); }
      else (C < LOGO.grey ? greys : hues).push(p);
    });
    // a logo with no hue (black, grey): its own dark or grey colour, said as mono
    const pts = hues.length ? hues : greys.length ? greys : darks, mono = !hues.length;
    if (!pts.length) return { colours: [], mono: false, skipped };
    const d2 = (a, b) => (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]) + (a[2] - b[2]) * (a[2] - b[2]);
    const P = pts.slice().sort((a, b) => b.w - a.w || (a.hex < b.hex ? -1 : 1));
    const cs = [P[0].lab.slice()];
    while (cs.length < Math.min(LOGO.k, P.length)) {
      let best = null, bd = 0;
      for (const p of P) { const d = Math.min(...cs.map((c) => d2(c, p.lab))) * p.w; if (d > bd) { bd = d; best = p; } }
      if (!best) break; cs.push(best.lab.slice());
    }
    const as = new Array(P.length).fill(-1);
    for (let it = 0; it < 30; it++) {
      let moved = false;
      P.forEach((p, i) => { let bi = 0, bd = Infinity; cs.forEach((c, j) => { const d = d2(c, p.lab); if (d < bd) { bd = d; bi = j; } }); if (as[i] !== bi) { as[i] = bi; moved = true; } });
      if (!moved) break;
      const sum = cs.map(() => [0, 0, 0, 0]);
      P.forEach((p, i) => { const s = sum[as[i]]; for (let k = 0; k < 3; k++) s[k] += p.lab[k] * p.w; s[3] += p.w; });
      sum.forEach((s, j) => { if (s[3]) cs[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
    }
    let groups = cs.map((c, j) => { const m = P.filter((_, i) => as[i] === j); return m.length ? { members: m, w: m.reduce((a, p) => a + p.w, 0) } : null; }).filter(Boolean)
      .map((g) => Object.assign(g, { top: g.members[0] })).sort((a, b) => b.w - a.w || (a.top.hex < b.top.hex ? -1 : 1));
    // merge near ones into the heavier
    const merged = [];
    for (const g of groups) { const into = merged.find((m) => deltaE(m.top.lab, g.top.lab) < LOGO.merge); if (into) { into.w += g.w; into.members = into.members.concat(g.members); } else merged.push(g); }
    // drop the soft edges: a colour between a heavier cluster and white, black or another heavier cluster
    const ends = (i) => ['#ffffff', '#000000'].concat(merged.slice(0, i).map((m) => m.top.hex));
    groups = merged.filter((g, i) => i === 0 || !merged.slice(0, i).some((m) => ends(i).some((e) => e !== m.top.hex && [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].some((t) => deltaE(hexToLab(mix(m.top.hex, e, t)), g.top.lab) < LOGO.blend))));
    const total = groups.reduce((a, g) => a + g.w, 0);
    const kept = groups.filter((g) => g.w / total >= LOGO.share).slice(0, LOGO.max), all = kept.reduce((a, g) => a + g.w, 0);
    return { colours: kept.map((g) => ({ hex: g.top.hex, share: Math.round(g.w / all * 1000) / 1000 })), mono, skipped };
  };
  // The palette from a logo's colours (hex strings or { hex }, the lead first; at most 3 are used): the logo's colours,
  // then generate(lead, harmony) and, if that leaves too few apart, CALM, skipping any within 15 (CIEDE2000) of one taken.
  // Every colour is taken to 3:1 on the visuals' background where it is under (toContrast: WCAG 2.1 1.4.11, bars, lines
  // and large shapes); the logo's own ones are listed in adjusted (logo: true) so the page can say so. Then the order:
  // the lead stays first and the other 7 are put in the order whose closest neighbours are farthest apart for normal
  // vision, deuteranopia and protanopia (every order is tried; the logo's other colours keep places 2-3 when that costs
  // under 10% of the best, or their closest neighbours still stand 20 apart: clearly two colours). ui: the design's page colours. null when no colour is given.
  const deCache = new Map();
  const visionsOf = (c) => { if (!deCache.has(c)) deCache.set(c, ['normal', 'deutan', 'protan'].map((v) => hexToLab(simulateCvd(c, v)))); return deCache.get(c); };
  const apart = (a, b) => { const A = visionsOf(a), B = visionsOf(b); return [0, 1, 2].map((v) => deltaE(A[v], B[v])); };
  // (0.3.2 SP6) ui: the page colours already repaired (the engine's logoTheme(brand, o) passes colours({ ui: o.ui }).ui)
  const logoTheme = (brand, o, ui) => {
    o = o || {};
    const own = []; (brand || []).forEach((c) => { const h = clampHex(typeof c === 'string' ? c : (c && c.hex) || ''); if (h && !own.includes(h) && own.length < 3) own.push(h); });
    if (!own.length) return null;
    const card = ui.card, harmony = ['analogous', 'complementary', 'triadic', 'mono'].includes(o.harmony) ? o.harmony : 'analogous';
    const picked = own.slice();
    for (const c of generate(own[0], harmony).concat(CALM)) { if (picked.length === 8) break; if (picked.every((p) => deltaE(hexToLab(p), hexToLab(c)) >= 15)) picked.push(c); }
    const adjusted = [], r2 = (x) => Math.round(x * 100) / 100, before = [];
    picked.forEach((c, i) => {
      const t = toContrast(c, card, 3);
      if (t !== c) adjusted.push({ from: c, to: t, before: r2(contrast(c, card)), after: r2(contrast(t, card)), logo: i < own.length });
      if (!before.includes(t)) before.push(t);
    });
    for (const c of CALM) {
      if (before.length === 8) break; const t = toContrast(c, card, 3); if (before.includes(t)) continue;
      before.push(t); if (t !== c) adjusted.push({ from: c, to: t, before: r2(contrast(c, card)), after: r2(contrast(t, card)), logo: false });
    }
    // the order: every order of colours 2-8 (5040), scored by the closest neighbours over the three visions
    const n = before.length, D = before.map((a) => before.map((b) => (a === b ? [0, 0, 0] : apart(a, b))));
    const score = (ord) => { let m = Infinity; for (let i = 1; i < ord.length; i++) m = Math.min(m, ...D[ord[i - 1]][ord[i]]); return m; };
    let best = null, bestS = -1, keep = null, keepS = -1;
    const ownAt = own.map((h) => before.indexOf(toContrast(h, card, 3)));
    const perm = (arr, k) => {
      if (k === arr.length) {
        const ord = [0].concat(arr), s = score(ord);
        if (s > bestS + 1e-9) { bestS = s; best = ord.slice(); }
        if (ownAt.every((j, i) => i === 0 || ord[i] === j) && s > keepS + 1e-9) { keepS = s; keep = ord.slice(); }
        return;
      }
      for (let i = k; i < arr.length; i++) { [arr[k], arr[i]] = [arr[i], arr[k]]; perm(arr, k + 1); [arr[k], arr[i]] = [arr[i], arr[k]]; }
    };
    perm(Array.from({ length: n - 1 }, (_, i) => i + 1), 0);
    const ord = keep && (keepS >= 0.9 * bestS || keepS >= LOGO.apart) ? keep : best, data = ord.map((i) => before[i]);
    const near = (v) => r2(Math.min(...data.slice(1).map((c, i) => apart(data[i], c)[v])));
    const cvd = { normal: near(0), deutan: near(1), protan: near(2) }; cvd.min = Math.min(cvd.normal, cvd.deutan, cvd.protan);
    const table = data.map((hex) => { const onCard = r2(contrast(hex, card)); return { hex, onCard, onPage: r2(contrast(hex, ui.background)), shapes: onCard >= 3, text: onCard >= 4.5 }; });
    return { data, accent: data[0], brand: own, harmony, before, adjusted, table, cvd };
  };

  const api = { clampHex, hexToRgb, rgbToHex, mix, lum, contrast, hexToHsl, hslToHex, toContrast, secondColour, statusHue, fadeEnds, generate, calmPalette, CALM, rgbToLab, hexToLab, deltaE, simulateCvd, logoColours, logoTheme };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAColours = api;
})(typeof self !== 'undefined' ? self : this);
