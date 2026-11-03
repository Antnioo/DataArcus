// RD4 (0.3.2 R&D) the seasonal skins' prototype: research only, never a product file. Run from mcp/:
//   node research/rd4/measure.mjs
// Made-up only: copies fixtures/twin-project (a made-up report) into os.tmpdir() and runs the redesign's own functions
// on it (planRedesign, buildCopy, verifyCopy). The 6 palettes are made up here, after each season's or flag's colours;
// none is an "official" colour set. Prints one JSON object; nothing is written outside os.tmpdir().
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..', '..');
const TMP0 = fs.realpathSync(os.tmpdir()); process.env.DATAARCUS_ROOT = process.env.DATAARCUS_ROOT || TMP0;
const R = await import(path.join(MCP, 'lib/redesign.mjs')), M = await import(path.join(MCP, 'lib/model.mjs')), D = await import(path.join(MCP, 'lib/design.mjs'));
const E = D.E;

// ---- the 6 made-up palettes (light page; card white; text dark). Data: the first 4 carry the season, 4 more neutrals ----
// good, neutral, bad: one made-up status set for all six (a palette that leaves them out is a plan problem: Got 2)
const ST = { good: '#2e7d32', neutral: '#9a6700', bad: '#c62828' };
const SKINS = {
  ramadan: { ar: 'رمضان', data: ['#1e3a5f', '#b8860b', '#2a7f62', '#7b3f61', '#4a6fa5', '#8c6d1f', '#5b8a72', '#6c757d'], ui: { background: '#f7f4ec', card: '#ffffff', text: '#1b2433', accent: '#1e3a5f', ...ST } },
  eid: { ar: 'العيد', data: ['#0f766e', '#c2410c', '#a16207', '#9d174d', '#1d4ed8', '#4d7c0f', '#7e22ce', '#6b7280'], ui: { background: '#f6f7f2', card: '#ffffff', text: '#1f2933', accent: '#0f766e', ...ST } },
  uae: { ar: 'اليوم الوطني الإماراتي', data: ['#00732f', '#c8102e', '#1a1a1a', '#7a8c99', '#3c9a5f', '#e0525f', '#555555', '#a3b1bb'], ui: { background: '#f5f6f5', card: '#ffffff', text: '#1a1a1a', accent: '#00732f', ...ST } },
  ksa: { ar: 'اليوم الوطني السعودي', data: ['#006c35', '#9bb05b', '#2f4f3a', '#b08d3c', '#4f9d69', '#c9d6a3', '#5d6d63', '#8a8a8a'], ui: { background: '#f4f7f4', card: '#ffffff', text: '#1d2a22', accent: '#006c35', ...ST } },
  qatar: { ar: 'اليوم الوطني القطري', data: ['#8a1538', '#c06c84', '#4a0d1f', '#9a8f97', '#b5385c', '#d9a5b3', '#6e5560', '#7a7a7a'], ui: { background: '#f8f4f5', card: '#ffffff', text: '#2a1a1f', accent: '#8a1538', ...ST } },
  kuwait: { ar: 'اليوم الوطني الكويتي', data: ['#007a3d', '#ce1126', '#1a1a1a', '#8c8c8c', '#3da26b', '#e2525f', '#4d4d4d', '#b3b3b3'], ui: { background: '#f5f6f5', card: '#ffffff', text: '#1a1a1a', accent: '#007a3d', ...ST } }
};

// ---- colour: sRGB -> linear -> Lab; CVD by Machado, Oliveira and Fernandes (2009), severity 1; deltaE 2000 ----
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4), gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
};
const sim = (h, k) => { const l = hex(h).map(lin); if (!k) return l; const m = MACHADO[k]; return m.map((r) => Math.min(1, Math.max(0, r[0] * l[0] + r[1] * l[1] + r[2] * l[2]))); };
const lab = (l) => {
  const X = (0.4124 * l[0] + 0.3576 * l[1] + 0.1805 * l[2]) / 0.95047, Y = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2], Z = (0.0193 * l[0] + 0.1192 * l[1] + 0.9505 * l[2]) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
};
function de2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G), C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h = (b, a) => { const x = Math.atan2(b, a) / rad; return x < 0 ? x + 360 : x; }, h1 = h(b1, a1p), h2 = h(b2, a2p);
  const dL = L2 - L1, dC = C2p - C1p; let dh = h2 - h1; if (C1p * C2p === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin(dh * rad / 2), Lb = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hb = h1 + h2; if (C1p * C2p !== 0) hb = Math.abs(h1 - h2) > 180 ? (h1 + h2 + (h1 + h2 < 360 ? 360 : -360)) / 2 : (h1 + h2) / 2;
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad);
  const SL = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2), SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T;
  const RT = -2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hb - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}
const minPair = (cols, k) => { let m = { d: Infinity }; for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) { const d = de2000(lab(sim(cols[i], k)), lab(sim(cols[j], k))); if (d < m.d) m = { d, pair: [i + 1, j + 1] }; } return { deltaE: +m.d.toFixed(1), pair: m.pair }; };
// the dataviz validator's floors as used here (Decisions I made 3): 3:1 on the card for each series; deltaE 2000 of
// 10 or more between any two of the first 4 series, under normal vision and each of the three simulations
const DE_MIN = 10, CR_MIN = 3;

// ---- the report: a made-up copy in os.tmpdir() ----
const ROOT = fs.mkdtempSync(path.join(TMP0, 'rd4-'));
const PROJ = path.join(ROOT, 'proj'); fs.cpSync(path.join(MCP, 'fixtures', 'twin-project'), PROJ, { recursive: true });
const PBIP = path.join(PROJ, 'Twin Sales.pbip'), REP = path.join(PROJ, 'Twin Sales.Report');
const model = M.loadModel(PROJ);
const read = (dir) => Object.fromEntries(walk(dir).map((r) => [r, fs.readFileSync(path.join(dir, ...r.split('/')))]));
function walk(dir, at = '') { return fs.readdirSync(path.join(dir, at), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(dir, at + e.name + '/') : [at + e.name])); }
const THEME = 'StaticResources/RegisteredResources/twin-theme.json';
const src = read(REP), origTheme = src[THEME];

const out = { at: 'integration/0.3.2 e3f0123', fixture: 'fixtures/twin-project (Twin Sales: 3 pages, 2 bookmarks, a custom visual)', files: Object.keys(src).length, skins: {} };
// today's input: is a palette refused at the tool layer? (report-inputs.mjs:114 is strict)
const I = await import(path.join(MCP, 'lib/report-inputs.mjs'));
const z = I.CREATE_REPORT_INPUTS && I.CREATE_REPORT_INPUTS.restyle;
out.inputTakesPalette = z ? z.safeParse({ palette: { data: ['#000000'] } }).success : 'not found';
out.inputTakesPreset = z ? z.safeParse({ preset: 'Desert Gulf' }).success : 'not found';

for (const [k, s] of Object.entries(SKINS)) {
  const t0 = Date.now();
  const P = R.planRedesign(PBIP, model, { logicalId: '00000000-0000-4000-8000-000000000004', keepPositions: true, restyle: { palette: { data: s.data, ui: s.ui } } });
  const ms = Date.now() - t0;
  const copy = R.buildCopy(src, P.patches, '00000000-0000-4000-8000-000000000004');
  const checks = R.verifyCopy(src, copy, P.patches, P.themeRel);
  const changed = Object.keys(src).filter((r) => !Buffer.from(src[r]).equals(Buffer.from(copy[r])));
  const th = JSON.parse(copy[THEME].toString('utf8'));
  const card = th.background;
  const contrasts = th.dataColors.map((c) => +E.contrast(c, card).toFixed(2));
  const cvd = Object.fromEntries([null, 'protan', 'deutan', 'tritan'].map((m) => [m || 'normal', minPair(th.dataColors.slice(0, 4), m)]));
  // what the skin can't reach today: the page colour (visualStyles.page) and the title colour (textClasses.title)
  const td = D.themeDesign({ palette: { data: s.data, ui: s.ui }, pageTint: false }), full = E.buildTheme(td.design, 'en');
  // ---- the undo, three ways ----
  // U1: today's restyle again, from the skinned copy, with the original's colours as a palette
  const SK = path.join(ROOT, k); fs.mkdirSync(SK); const skDir = path.join(SK, 'Twin Sales.Report');
  P.tree.forEach((f) => { const p = path.join(SK, ...f.path.split('/')); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
  fs.cpSync(path.join(PROJ, 'Twin Sales.SemanticModel'), path.join(SK, 'Twin Sales.SemanticModel'), { recursive: true });
  const skPbip = path.join(SK, path.basename(P.loc.outPbip)), skSrc = read(path.join(SK, path.basename(P.loc.outDir)));
  const o = JSON.parse(origTheme.toString('utf8'));
  const U1 = R.planRedesign(skPbip, M.loadModel(SK), { logicalId: '00000000-0000-4000-8000-000000000005', keepPositions: true, restyle: { palette: { data: o.dataColors, ui: { background: '#ffffff', card: o.background, text: o.foreground, accent: o.tableAccent, ...ST } } } });
  const u1 = U1.problems.length ? null : R.buildCopy(skSrc, U1.patches, 'x')[THEME];
  // U2: a token restore (set each token to the original's value, remove what the original lacks): a patch kind that does
  // not exist yet (op remove is allowed only for a visual's text setting today), run with buildCopy directly
  const restore = R.TOKENS.map((t) => (t in o ? { file: THEME, pointer: '/' + t, to: o[t] } : t in th ? { file: THEME, pointer: '/' + t, op: 'remove' } : null)).filter(Boolean);
  const u2 = R.buildCopy(skSrc, restore, 'x')[THEME];
  // U3: the theme file's bytes taken from the original (the "off" path proposed in c)
  const u3 = origTheme;
  out.skins[k] = {
    arabicName: s.ar, planMs: ms, problems: P.problems,
    tokensChanged: Object.keys((P.answer.theme || {}).tokens || {}), patches: P.patches.length,
    filesChanged: changed, filesByteIdentical: Object.keys(src).length - changed.length, verifyCopy: checks ? 'passed' : 'failed',
    dataOnCard: { card, contrasts, under3: contrasts.map((c, i) => (c < CR_MIN ? i + 1 : null)).filter(Boolean) },
    first4: cvd, engineCrossCheck: Object.fromEntries(['protan', 'deutan'].map((m) => { const c = th.dataColors.slice(0, 4).map((x) => E.hexToLab(E.simulateCvd(x, m))); let d = Infinity; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) d = Math.min(d, E.deltaE(c[i], c[j])); return [m, +d.toFixed(1)]; })),
    tuned: (() => { const cols = th.dataColors, ok = cols.map((c) => E.contrast(c, card) >= CR_MIN); let best = null;
      for (let a = 1; a < cols.length; a++) for (let b = a + 1; b < cols.length; b++) for (let c = b + 1; c < cols.length; c++) { if (!ok[a] || !ok[b] || !ok[c]) continue; const four = [cols[0], cols[a], cols[b], cols[c]]; const m = Math.min(...[null, 'protan', 'deutan', 'tritan'].map((k) => minPair(four, k).deltaE)); if (!best || m > best.min) best = { min: m, order: [1, a + 1, b + 1, c + 1] }; }
      return best ? Object.assign(best, { pass: best.min >= DE_MIN }) : null; })(),
    first4Pass: Object.values(cvd).every((x) => x.deltaE >= DE_MIN),
    textOnCard: +E.contrast(th.foreground, card).toFixed(2),
    notReachedToday: { pageColour: full.visualStyles.page['*'].background[0].color.solid.color, titleColour: full.textClasses.title.color, why: 'visualStyles.page and textClasses are outside ALLOW (redesign.mjs:121-125); restyle also forces pageTint false (:337)' },
    undo: {
      U1_restyleAgain: u1 ? { byteIdentical: Buffer.from(u1).equals(origTheme), sameJson: JSON.stringify(JSON.parse(u1.toString())) === JSON.stringify(o), extraKeys: Object.keys(JSON.parse(u1.toString())).filter((x) => !(x in o)), dataColors: JSON.parse(u1.toString()).dataColors.length } : { problems: U1.problems },
      U2_tokenRestore: { byteIdentical: Buffer.from(u2).equals(origTheme), sameJson: JSON.stringify(JSON.parse(u2.toString())) === JSON.stringify(o), bytes: [u2.length, origTheme.length], lastByte: [u2[u2.length - 1], origTheme[origTheme.length - 1]] },
      U3_bytesFromOriginal: { byteIdentical: Buffer.from(u3).equals(origTheme) }
    }
  };
}
fs.rmSync(ROOT, { recursive: true, force: true });
if (process.argv[2] === '--full') console.log(JSON.stringify(out, null, 1));
else { console.log(JSON.stringify({ inputTakesPalette: out.inputTakesPalette, inputTakesPreset: out.inputTakesPreset, files: out.files }));
  Object.entries(out.skins).forEach(([k, x]) => console.log(JSON.stringify({ k, problems: x.problems.length, tokens: x.tokensChanged.join(' '), changed: x.filesChanged.length, same: x.filesByteIdentical, verify: x.verifyCopy, under3: x.dataOnCard.under3, minContrast: Math.min(...x.dataOnCard.contrasts), first4: Object.fromEntries(Object.entries(x.first4).map(([m, v]) => [m, v.deltaE + ' (' + v.pair + ')'])), engine: x.engineCrossCheck, pass: x.first4Pass, tuned: x.tuned, notReached: [x.notReachedToday.pageColour, x.notReachedToday.titleColour], undo: { U1: x.undo.U1_restyleAgain.problems ? 'problems: ' + x.undo.U1_restyleAgain.problems.length : x.undo.U1_restyleAgain, U2: x.undo.U2_tokenRestore, U3: x.undo.U3_bytesFromOriginal.byteIdentical }, ms: x.planMs }))); }
