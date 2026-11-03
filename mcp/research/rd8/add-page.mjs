// RD8 prototype: add ONE page (plan_layout's own design, built by reportRun) to a COPY of an existing report.
// Research only (no product file changes); made-up reports in os.tmpdir() only. node research/rd8/add-page.mjs
import '../../test-env.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..', '..');
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'rd8-')));
process.env.DATAARCUS_ROOT = ROOT;
fs.cpSync(path.join(MCP, 'fixtures', 'twin-project'), path.join(ROOT, 'T'), { recursive: true });
const { sampleFiles } = await import('../../lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const { serverClient } = await import('../../test-0.2.9.mjs');
const { reportRun } = await import('../../lib/report-run.mjs');
const { danglingOf } = await import('../../lib/redesign.mjs');
const { checkArtifact } = await import('../../lib/artifact.mjs');
const s = await serverClient(ROOT, {});
const CLI = path.join(MCP, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');

const J = (b) => { const t = Buffer.from(b); return JSON.parse((t[0] === 0xef ? t.subarray(3) : t).toString('utf8')); };
const json2 = (o) => Buffer.from(JSON.stringify(o, null, 2), 'utf8');
const readTree = (dir) => { const out = {}; const walk = (d, rel) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const r = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) walk(path.join(d, e.name), r); else out[r] = fs.readFileSync(path.join(d, e.name)); }); walk(dir, ''); return out; };
const writeTree = (dir, files) => Object.entries(files).forEach(([r, b]) => { const p = path.join(dir, ...r.split('/')); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, b); });
const pageIdsOf = (f) => Object.keys(f).map((r) => /^definition\/pages\/([^/]+)\/page\.json$/.exec(r)).filter(Boolean).map((m) => m[1]);
const AR = /[؀-ۿ]/;
// the report's language, read from its own texts (page names, text boxes, titles): Arabic when most letters are
function langOf(files) {
  let ar = 0, all = 0;
  const said = []; const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if ((k === 'Value' || k === 'displayName' || k === 'value') && typeof v === 'string') said.push(v); else walk(v); }); };
  Object.keys(files).filter((r) => /^definition\/pages\/.+\.json$/.test(r)).forEach((r) => walk(J(files[r])));
  for (const c of said.join(' ')) if (/\p{L}/u.test(c)) { all++; if (AR.test(c)) ar++; }
  return ar > all * 0.3 ? 'ar' : 'en';
}

// ---- the one new page, out of reportRun's build: its page, its tooltip pages, the pictures they name, its extension measures
function pageOutOf(built, base) {
  const F = Object.fromEntries(built.files.map((f) => [f.path.startsWith(base + '.Report/') ? f.path.slice(base.length + 8) : '#' + f.path, Buffer.from(f.data)]));
  const order = J(F['definition/pages/pages.json']).pageOrder, kind = (id) => J(F[`definition/pages/${id}/page.json`]).type;
  const main = order.find((id) => kind(id) !== 'Tooltip');
  const tips = new Set();
  Object.keys(F).filter((r) => r.startsWith(`definition/pages/${main}/visuals/`) && r.endsWith('/visual.json')).forEach((r) => { const t = ((((J(F[r]).visual || {}).visualContainerObjects || {}).visualTooltip || [])[0] || {}).properties || {}; const v = t.section && t.section.expr && t.section.expr.Literal && String(t.section.expr.Literal.Value).replace(/'/g, ''); if (v) tips.add(v); });
  const ids = [main, ...tips], files = {};
  ids.forEach((id) => Object.keys(F).filter((r) => r.startsWith(`definition/pages/${id}/`)).forEach((r) => { files[r] = F[r]; }));
  const text = Object.values(files).map((b) => b.toString('utf8')).join('\n');
  const pics = Object.keys(F).filter((r) => /^StaticResources\/RegisteredResources\/.+\.(png|jpe?g|svg)$/i.test(r) && text.includes(path.basename(r)));
  pics.forEach((r) => { files[r] = F[r]; });
  return { main, tips: [...tips], files, pics, ext: F['definition/reportExtensions.json'] ? J(F['definition/reportExtensions.json']) : null, theme: J(F[Object.keys(F).find((r) => /RegisteredResources\/.+-theme\.json$/.test(r))]), F };
}

// ---- the copy: the original's bytes, plus the page; four files of the original change, each only by additions
function addPage(src, pg, copyName) {
  const out = Object.assign({}, src), changed = [], taken = new Set(pageIdsOf(src).map((x) => x.toLowerCase()));
  // page ids: a new one where the built one clashes (case-insensitive: Windows folders)
  const ren = new Map(); [pg.main, ...pg.tips].forEach((id) => { let n = id; while (taken.has(n.toLowerCase())) n = crypto.createHash('sha1').update(n).digest('hex').slice(0, 20); ren.set(id, n); taken.add(n.toLowerCase()); });
  const clashes = [...ren].filter(([a, b]) => a !== b).length;
  Object.entries(pg.files).forEach(([r, b]) => {
    let rr = r, data = b;
    const m = /^definition\/pages\/([^/]+)\//.exec(r);
    if (m) { rr = r.replace(m[1], ren.get(m[1])); let t = b.toString('utf8'); ren.forEach((to, from) => { if (to !== from) t = t.split(from).join(to); }); data = Buffer.from(t, 'utf8'); }
    if (rr in src) throw new Error('would write over ' + rr);
    out[rr] = data;
  });
  // pages.json: the new page after the original's, its tooltip pages after it; the active page unchanged
  const PJ = 'definition/pages/pages.json', pj = J(src[PJ]); pj.pageOrder = (pj.pageOrder || pageIdsOf(src)).concat([pg.main, ...pg.tips].map((x) => ren.get(x))); out[PJ] = json2(pj); changed.push(PJ);
  // report.json: the page's pictures registered in RegisteredResources
  if (pg.pics.length) { const RJ = 'definition/report.json', rj = J(src[RJ]); rj.resourcePackages = rj.resourcePackages || []; let pk = rj.resourcePackages.find((x) => x.name === 'RegisteredResources'); if (!pk) rj.resourcePackages.push(pk = { name: 'RegisteredResources', type: 'RegisteredResources', items: [] });
    pg.pics.forEach((r) => { const n = path.basename(r); if (pk.items.some((x) => x.name === n)) throw new Error('picture name taken: ' + n); pk.items.push({ name: n, path: n, type: 'Image' }); }); out[RJ] = json2(rj); changed.push(RJ); }
  // reportExtensions.json: the page's extension measures, merged by entity; a clash refuses
  let extClash = 0, extSame = 0;
  if (pg.ext) { const EX = 'definition/reportExtensions.json', have = src[EX] ? J(src[EX]) : null;
    if (!have) out[EX] = json2(pg.ext); else { const e = have; (pg.ext.entities || []).forEach((en) => { const t = (e.entities = e.entities || []).find((x) => x.name === en.name); if (!t) e.entities.push(en); else en.measures.forEach((mm) => { const o = (t.measures || []).find((x) => x.name === mm.name); if (o) { if (JSON.stringify(o) === JSON.stringify(mm)) extSame++; else extClash++; } else (t.measures = t.measures || []).push(mm); }); }); out[EX] = json2(e); changed.push(EX); } }
  // .platform: the copy's name and a new logical id
  const pl = src['.platform'] ? J(src['.platform']) : { metadata: { type: 'Report' }, config: { version: '2.0' } }; pl.metadata.displayName = copyName; pl.config.logicalId = crypto.randomUUID(); out['.platform'] = json2(pl); changed.push('.platform');
  return { out, changed, clashes, extClash, extSame, ren };
}

// ---- the measurements
function themeGap(pg, srcFiles) {
  const rj = J(srcFiles['definition/report.json']), ct = (rj.themeCollection || {}).customTheme, own = ct ? J(srcFiles['StaticResources/RegisteredResources/' + path.basename(ct.name)]) : {};
  const types = new Set(Object.keys(pg.files).filter((r) => r.endsWith('/visual.json')).map((r) => (J(pg.files[r]).visual || {}).visualType).filter(Boolean));
  const theirs = own.visualStyles || {}, ours = pg.theme.visualStyles || {};
  const lost = [...types].filter((t) => ours[t] && !theirs[t]);
  // literal colours the new page writes itself (they stay whatever the report's theme)
  let literal = 0, themeRefs = 0; Object.entries(pg.files).filter(([r]) => r.endsWith('.json')).forEach(([, b]) => { const t = b.toString('utf8'); literal += (t.match(/"Value": "'#[0-9A-Fa-f]{6}'"/g) || []).length; themeRefs += (t.match(/ThemeDataColor/g) || []).length; });
  const bake = lost.reduce((n, t) => n + Object.values(ours[t]).reduce((m, o) => m + Object.values(o || {}).reduce((k, arr) => k + (Array.isArray(arr) ? arr.reduce((q, e) => q + Object.keys(e || {}).length, 0) : 0), 0), 0), 0);
  return { stylePropertiesToBakeOntoVisuals: bake, visualTypes: [...types].sort(), stylesTheDataArcusThemeSetsButTheReportsDoesNot: lost, literalColoursOnThePage: literal, themeColourRefs: themeRefs, reportThemeHasVisualStyles: Object.keys(theirs).length };
}
function validate(dir) { const r = spawnSync(process.execPath, [CLI, 'validate', dir], { encoding: 'utf8' }); try { const d = JSON.parse(r.stdout).data; return { errors: d.errorCount, warnings: d.warningCount, byCode: Object.fromEntries(Object.entries(d.diagnostics || {}).map(([k, v]) => [k, v.severity + ' x' + (v.items || []).length])) }; } catch (e) { return { raw: String(r.stdout || r.stderr).slice(0, 300) }; } }
const sizes = (files, ids) => ids.map((id) => { const p = J(files[`definition/pages/${id}/page.json`]); return `${p.width}x${p.height}${p.type ? ' ' + p.type : ''}`; });
const bookmarksWhere = (files) => Object.keys(files).filter((r) => /\.bookmark\.json$/.test(r)).map((r) => { const b = J(files[r]); return [b.name, (b.explorationState || {}).activeSection]; });

async function run(label, reportDir, modelPath, extra) {
  const src = readTree(reportDir), lang = langOf(src), p0 = J(src['definition/pages/pages.json']).pageOrder.map((id) => J(src[`definition/pages/${id}/page.json`])).find((x) => x.type !== 'Tooltip');
  const args = Object.assign({ name: 'Added', path: modelPath, page: `${p0.width}x${p0.height}`, layout: 'exec', kpis: 2, lang }, extra || {});
  let R0 = await s.call("plan_layout", args), plan = R0.j || { err: R0.t };
  if (lang === 'ar' && plan.arabicNames) { args.displayNames = Object.assign({}, plan.arabicNames.inThePlan || {}, plan.arabicNames.suggestedDisplayNames || {}); plan = (await s.call('plan_layout', args)).j || {}; }
  if (!plan.design) throw new Error(label + ": no design: " + JSON.stringify(plan.planProblems || plan).slice(0, 900));
  const built = reportRun(Object.assign({}, args, { design: plan.design }), 'build');
  const pg = pageOutOf(built, 'Added');
  const base = path.basename(reportDir).replace(/\.Report$/, ''), copyName = base + ' plus';
  const { out, changed, clashes, extClash, extSame, ren } = addPage(src, pg, copyName);
  const before = Object.keys(src), same = before.filter((r) => Buffer.from(src[r]).equals(Buffer.from(out[r])));
  const dir = path.join(ROOT, 'out-' + label, copyName + '.Report'); writeTree(dir, out);
  const dA = danglingOf(src), dB = danglingOf(out);
  const art = await checkArtifact(Object.entries(out).map(([r, b]) => ({ path: copyName + '.Report/' + r, data: b })), built.m.tables, lang, { skip: ['validator'] });
  const newPageRules = Object.fromEntries(Object.entries(art.byRule || {}));
  const orig = await checkArtifact(Object.entries(src).map(([r, b]) => ({ path: base + '.Report/' + r, data: b })), built.m.tables, lang, { skip: ['validator'] });
  const vOrig = validate(reportDir), vCopy = validate(dir);
  const newPj = J(out[`definition/pages/${ren.get(pg.main)}/page.json`]);
  return {
    label, lang, planId: plan.plan && plan.plan.planId, colours: plan.colours && plan.colours.from,
    pages: { before: pageIdsOf(src).length, after: pageIdsOf(out).length, added: [pg.main, ...pg.tips].length, tooltipPagesAdded: pg.tips.length },
    files: { before: before.length, byteIdentical: same.length, changed, added: Object.keys(out).length - before.length },
    clashes: { pageIds: clashes, extensionMeasuresDiffering: extClash, extensionMeasuresIdentical: extSame },
    pageSize: { original: sizes(src, pageIdsOf(src)), newPage: `${newPj.width}x${newPj.height}`, displayOption: newPj.displayOption },
    bookmarks: { before: bookmarksWhere(src), after: bookmarksWhere(out), same: JSON.stringify(bookmarksWhere(src)) === JSON.stringify(bookmarksWhere(out)) },
    dangling: { before: dA.length, after: dB.length, fresh: dB.filter((x) => !dA.includes(x)) },
    validator: { original: vOrig, copy: vCopy },
    rules: { original: orig.byRule, copy: newPageRules, copyStatus: art.status, originalStatus: orig.status, blocking: [...new Set((art.blocking || []).map((b) => b.rule))] },
    theme: themeGap(pg, src),
    pageBindingNames: (() => { const n = Object.keys(out).filter((r) => /^definition\/pages\/[^/]+\/page\.json$/.test(r)).map((r) => (J(out[r]).pageBinding || {}).name).filter(Boolean); return { count: n.length, unique: new Set(n).size === n.length }; })(),
    nameRule: Object.keys(out).filter((r) => /^definition\/pages\//.test(r)).every((r) => r.split('/').slice(2, -1).every((seg) => /^[\w-]+$/.test(seg))),
    newPageRtl: (() => { const t = Object.entries(pg.files).filter(([r]) => r.endsWith('.json')).map(([, b]) => b.toString('utf8')).join(''); const xs = Object.entries(pg.files).filter(([r]) => r.startsWith(`definition/pages/${pg.main}/visuals/`) && r.endsWith('/visual.json')).map(([, b]) => J(b)).filter((v) => v.visual && v.visual.visualType === 'cardVisual').map((v) => v.position.x); return { arabicLetters: (t.match(/[؀-ۿ]/g) || []).length, textAlignRight: (t.match(/'right'/g) || []).length, textAlignLeft: (t.match(/'left'/g) || []).length, cardXs: xs.sort((a, b) => a - b) }; })()
  };
}

const results = [];
results.push(await run('twin', path.join(ROOT, 'T', 'Twin Sales.Report'), 'T/Twin Sales.pbip'));
results.push(await run('sample', path.join(ROOT, 'S', 'Gulf Retail.Report'), 'S/Gulf Retail.pbip'));
// lab report 3: an Arabic report (built by DataArcus from the sample model, lang ar, 1280x720), then a page added to it
{
  const args = { name: 'Gulf AR', path: 'S/Gulf Retail.pbip', page: '1280x720', layout: 'ops', kpis: 3, lang: 'ar' };
  let p = (await s.call('plan_layout', args)).j || {}; args.displayNames = Object.assign({}, (p.arabicNames || {}).inThePlan || {}, (p.arabicNames || {}).suggestedDisplayNames || {}); p = (await s.call('plan_layout', args)).j || {};
  const b = reportRun(Object.assign({}, args, { design: p.design }), 'build');
  b.files.forEach((f) => { const q = path.join(ROOT, 'A', f.path); fs.mkdirSync(path.dirname(q), { recursive: true }); fs.writeFileSync(q, f.data); });
  fs.cpSync(path.join(ROOT, 'S', 'Gulf Retail.SemanticModel'), path.join(ROOT, 'A', 'Gulf Retail.SemanticModel'), { recursive: true });
  const pbir = path.join(ROOT, 'A', 'Gulf AR.Report', 'definition.pbir'); console.error('A pbir:', fs.readFileSync(pbir, 'utf8').replace(/\s+/g, ' '));
  results.push(await run('arabic', path.join(ROOT, 'A', 'Gulf AR.Report'), 'S/Gulf Retail.pbip', { layout: 'exec' }));
}
await s.close();
fs.writeFileSync(path.join(HERE, 'results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 1));
fs.rmSync(ROOT, { recursive: true, force: true });
