#!/usr/bin/env node
// Standalone metadata-only lab. No dependency installation and no product edits.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(process.argv[2] || '/workspace/DataArcus');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const SEED = Number(arg('--seed', 20261102)), COUNT = Number(arg('--cases', 2000));
const OUT = path.resolve(arg('--out', HERE));
const REPLAY = arg('--replay', null);
const EVIDENCE = arg('--evidence-ref', 'c9a151d9aae5a64efbc3360ff82658a8d9633a91');
if (Number(process.versions.node.split('.')[0]) !== 22) throw new Error('Use Node 22.');
if (!(OUT === HERE || OUT.startsWith(HERE + path.sep))) throw new Error('Output must be within the lab folder.');
fs.mkdirSync(OUT, { recursive: true });
if (!REPLAY && COUNT > 250 && !process.argv.includes('--worker')) {
  const {runCampaign}=await import('./campaign.mjs');await runCampaign({here:HERE,out:OUT,repo,seed:SEED,count:COUNT,evidence:EVIDENCE});process.exit(0);
}
const TMP = fs.mkdtempSync(path.join(OUT, '.run-'));
const ROOT = path.join(TMP, 'work'); fs.mkdirSync(ROOT);
process.env.DATAARCUS_ROOT = ROOT; process.env.TMPDIR = TMP;
const imp = (s) => import(pathToFileURL(path.join(repo, 'mcp', s)));
const require = createRequire(path.join(repo, 'mcp/package.json'));
const Plans = await imp('lib/plans.mjs');
const { digestOf } = await imp('lib/artifact.mjs');
const { register } = await imp('tools/create_arabic_twin.mjs');
const Mirror = require('../assets/js/report-mirror.js');
const { runReportValidation, getMetadataProvider } = await import(pathToFileURL(path.join(repo, 'mcp/node_modules/@microsoft/powerbi-report-authoring-cli/dist/index.js')));
const provider = await getMetadataProvider();
let handler; register({ registerTool(n, d, h) { if (n === 'create_arabic_twin') handler = h; } }, {});
const clone = (x) => structuredClone(x);
const sha = (x) => crypto.createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex');
const tree = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const disk = (d) => tree(d).map(f => ({ path: path.relative(d, f).split(path.sep).join('/'), data: fs.readFileSync(f, 'utf8') })).sort((a,b) => a.path.localeCompare(b.path));
const put = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof x === 'string' ? x : JSON.stringify(x, null, 2) + '\n'); };
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const schema = (s) => S + s + '/schema.json';
const VS = schema('item/report/definition/visualContainer/2.1.0');
const L = (v) => ({ expr: { Literal: { Value: String(v) } } });
const Q = (s) => L("'" + s + "'");
const obj = (p) => [{ properties: p }];
const col = (n) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
const mea = (n = 'Metric') => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
const query = (roles) => ({ queryState: Object.fromEntries(Object.entries(roles).map(([r, p]) => [r, { projections: p }])) });
const TYPES = ['card','textbox','tableEx','flatMatrix','groupedMatrix','heatmap','clusteredBarChart','clusteredColumnChart','lineChart','areaChart','donutChart','slicer','actionButton','shape','image','group'];
function visual(kind, n) {
  const v = { $schema: VS, name: 'v' + n, position: { x: 0, y: 0, width: 300, height: 220, z: n * 1000, tabOrder: n * 1000 } };
  if (kind === 'group') { v.visualGroup = { displayName: 'Synthetic group', groupMode: 'ScaleMode' }; return v; }
  v.visual = { visualType: /Matrix|heatmap/.test(kind) ? 'pivotTable' : kind };
  const a = v.visual;
  if (kind === 'textbox') a.objects = { general: obj({ paragraphs: [{ textRuns: [{ value: 'Synthetic heading', textStyle: { fontFamily: 'Segoe UI', fontSize: '14pt' } }], horizontalTextAlignment: 'left' }] }) };
  else if (kind === 'actionButton') a.objects = { text: obj({ show: L('true'), text: Q('Synthetic action') }), icon: obj({ show: L('true'), shapeType: Q('rightArrow'), placement: Q('left') }) };
  else if (kind === 'shape') a.objects = { shape: obj({ tileShape: Q('rectangle') }) };
  else if (kind === 'image') a.objects = { general: obj({ imageUrl: Q('synthetic.svg') }) };
  else {
    const matrix = a.visualType === 'pivotTable';
    a.query = query(matrix ? { Rows: kind === 'groupedMatrix' ? [col('Category'), col('Group')] : [col(kind === 'heatmap' ? 'Weekday' : 'Category')], ...(kind === 'heatmap' ? { Columns: [col('Hour')] } : {}), Values: [mea()] } : ['card','slicer','tableEx'].includes(kind) ? { Values: kind === 'card' ? [mea()] : kind === 'slicer' ? [col('Category')] : [col('Category'), mea()] } : { Category: [col(['clusteredColumnChart','lineChart','areaChart'].includes(kind) ? 'Date' : 'Category')], Y: [mea()], ...(kind === 'donutChart' ? { Series: [col('Group')] } : {}) });
    a.objects = matrix ? { subTotals: obj({ rowSubtotals: L('false'), columnSubtotals: L('false') }), grid: obj({ textSize: L('10D') }) } : kind === 'donutChart' ? { legend: obj({ show: L('true'), position: Q('Right') }) } : {};
    if (['lineChart','areaChart','clusteredColumnChart'].includes(kind)) a.query.sortDefinition = { sort: [{ field: col('Date').field, direction: 'Ascending' }], isDefaultSort: true };
    if (kind !== 'heatmap') a.visualContainerObjects = { title: obj({ show: L('true'), text: Q('Synthetic title') }) };
  }
  return v;
}
function rng(seed) { let x = seed >>> 0; return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function generate(seed) {
  const r = rng(seed), pick = (n) => Math.floor(r() * n), dims = [[1280,720],[1280,800],[1920,1080]];
  const pages = [];
  for (let p = 0, count = 1 + pick(3); p < count; p++) {
    const [width,height] = dims[pick(3)], pg = { id: 'p' + p, width, height, tooltip: p > 0 && pick(5) === 0, background: pick(13) === 0, visuals: [] };
    for (let i = 0, n = 1 + pick(25); i < n; i++) {
      const v = visual(TYPES[pick(TYPES.length)], i), w = 60 + pick(Math.floor(width * .43)), h = 30 + pick(Math.floor(height * .43));
      Object.assign(v.position, { width: w, height: h, x: pick(4) === 0 ? width - w : pick(width - w + 1), y: pick(4) === 0 ? height - h : pick(height - h + 1) });
      const group = pg.visuals.find(x => x.visualGroup && x.position.width >= w && x.position.height >= h);
      if (group && pick(4) === 0) { v.parentGroupName = group.name; v.position.x = pick(group.position.width - w + 1); v.position.y = pick(group.position.height - h + 1); }
      const labelUnique=(x)=>{if(!x||typeof x!=='object')return;for(const k of Object.keys(x)){if(typeof x[k]==='string')x[k]=x[k].replace(/Synthetic (heading|action|title)/g,'Synthetic $1 page '+p+' visual '+i);else labelUnique(x[k]);}};labelUnique(v);
      pg.visuals.push(v);
    }
    // Regular KPI icon pairs and overlapping heatmap/bar shapes, without outside-page inputs.
    if (seed % 7 === 0 && pg.visuals.length >= 2) {
      const a = visual('textbox', 0), b = visual('shape', 1);
      a.position = { x: 20, y: 20, width: 320, height: 60, z: 1, tabOrder: 1 };
      b.position = { x: 300, y: 25, width: 25, height: 25, z: 2, tabOrder: 2 };
      pg.visuals.splice(0,2,a,b);
      for(const v of pg.visuals)if(v.parentGroupName && !pg.visuals.some(g=>g.name===v.parentGroupName&&g.visualGroup)){delete v.parentGroupName;}
    }
    pages.push(pg);
  }
  return { pages };
}
// Preserve shape and query structure; replace all source names and discard filters/data expressions.
function evidenceShape(raw) {
  const kind = raw.visual?.visualType;
  const v = { $schema: VS, name: 'v0', position: clone(raw.position || { x: 20,y: 20,width: 300,height: 220,z: 0 }), ...(raw.visualGroup ? { visualGroup: { displayName: 'Synthetic group', groupMode: 'ScaleMode' } } : { visual: { visualType: kind } }) };
  if (v.visual) {
    const names = new Map(); let serial = 0;
    const fieldName = (s) => { if (!names.has(s)) names.set(s, /^(week ?day|day ?name|day of (the )?week|dayofweek|week ?day name)$/i.test(s) ? 'Weekday' : /hour/i.test(s) ? 'Hour' : /date|month|year/i.test(s) ? 'Date' : 'Field' + serial++); return names.get(s); };
    const oldRefs = new Map();
    const qs = raw.visual.query?.queryState;
    if (qs) v.visual.query = { queryState: Object.fromEntries(Object.entries(qs).map(([role, state]) => [role, { projections: (state.projections || []).map(p => {
      const f = p.field?.Measure || p.field?.Column || p.field?.Aggregation?.Expression?.Column;
      const n = fieldName(f?.Property || p.nativeQueryRef || p.queryRef || role), result = p.field?.Measure ? mea(n) : col(n);
      if (p.field?.Aggregation) { result.field = { Aggregation: { Expression: result.field, Function: p.field.Aggregation.Function } }; result.queryRef = 'Sum(Synthetic.' + n + ')'; }
      oldRefs.set(p.queryRef, result.queryRef); if (p.displayName != null) result.displayName = 'Synthetic header'; return result;
    }) }])) };
    const enums = new Set(['Left','Right','Center','Top','Bottom','TopCenter','BottomCenter','None','Compact','Tabular','Outline','Basic','Dropdown','Segoe UI','Arial','DIN','growToFit','default','Row','Column','true','false','rectangle','rightArrow','left','right','center']);
    const safe = (x, key = '') => {
      if (typeof x === 'number' || typeof x === 'boolean' || x == null) return x;
      if (Array.isArray(x)) return x.map(y => safe(y, key));
      if (typeof x === 'object') {
        if (x.expr && !x.expr.Literal && !x.expr.ThemeDataColor) return L('0D');
        return Object.fromEntries(Object.entries(x).filter(([k]) => !['filter','Filter','data','Values','Expression'].includes(k)).map(([k,val]) => [k,safe(val,k)]));
      }
      if (key === 'metadata') return oldRefs.get(x) || 'Synthetic.Field0';
      if (key === 'Value') { const s = x.replace(/^'|'$/g,''); return /^-?\d+(\.\d+)?[DL]?$/.test(x) || /^(true|false|null)$/.test(x) || /^#[0-9a-f]{6,8}$/i.test(s) || enums.has(s) ? x : "'Synthetic label'"; }
      if (enums.has(x) || /^\d+(pt|px)$/.test(x) || /^#[0-9a-f]{6,8}$/i.test(x)) return x;
      return 'Synthetic label';
    };
    for (const key of ['objects','visualContainerObjects']) if (raw.visual[key]) v.visual[key] = safe(raw.visual[key]);
    if (raw.visual.query?.sortDefinition && v.visual.query) { const first = Object.values(v.visual.query.queryState).flatMap(x => x.projections)[0]; if (first) v.visual.query.sortDefinition = { sort: [{ field: clone(first.field), direction: 'Ascending' }], isDefaultSort: true }; }
  }
  const w = Number(v.position.width) || 300, h = Number(v.position.height) || 220;
  const width = Math.max(1920, Math.ceil(w + Math.max(0,v.position.x || 0))), height = Math.max(1080, Math.ceil(h + Math.max(0,v.position.y || 0)));
  v.position.x = Math.max(0,v.position.x || 0); v.position.y = Math.max(0,v.position.y || 0); v.position.z ||= 0; v.position.tabOrder ||= 0;
  return { pages: [{ id: 'p0', width, height, visuals: [v] }] };
}
function modelFor(spec) {
  const fields = new Map([['Category','string'],['Group','string'],['Weekday','string'],['Hour','int64'],['Date','dateTime']]), measures = new Set(['Metric']);
  const walk = (x) => { if (!x || typeof x !== 'object') return; if (x.Column?.Property) fields.set(x.Column.Property, /Date/.test(x.Column.Property) ? 'dateTime' : 'string'); if (x.Measure?.Property) measures.add(x.Measure.Property); Object.values(x).forEach(walk); };
  walk(spec);
  return { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [{ name: 'Synthetic', columns: [...fields].map(([name,dataType]) => ({ name, dataType, sourceColumn: name })), measures: [...measures].map(name => ({ name, expression: 'BLANK()' })), partitions: [{ name: 'Synthetic', mode: 'import', source: { type: 'm', expression: 'let Source = #table({}, {}) in Source' } }] }] } };
}
function materialize(spec, dir, rename = false) {
  const wr = (f,x) => put(path.join(dir,f),x), D = 'Synthetic.Report/definition';
  wr('Synthetic.pbip', { $schema: schema('pbip/pbipProperties/1.0.0'), version:'1.0', artifacts:[{report:{path:'Synthetic.Report'}}], settings:{enableAutoRecovery:true} });
  wr('Synthetic.Report/.platform', {$schema:schema('gitIntegration/platformProperties/2.0.0'),metadata:{type:'Report',displayName:'Synthetic'},config:{version:'2.0',logicalId:'11111111-2222-4333-8444-555555555555'}});
  wr('Synthetic.Report/definition.pbir', { $schema:schema('item/report/definitionProperties/2.0.0'),version:'4.0',datasetReference:{byPath:{path:'../Synthetic.SemanticModel'}} });
  wr('Synthetic.SemanticModel/definition.pbism',{$schema:schema('item/semanticModel/definitionProperties/1.0.0'),version:'4.0',settings:{}});
  wr('Synthetic.SemanticModel/model.bim',modelFor(spec));
  wr(D+'/version.json',{$schema:schema('item/report/definition/versionMetadata/1.0.0'),version:'2.0.0'});
  wr(D+'/report.json',{$schema:schema('item/report/definition/report/2.1.0'),settings:{useStylableVisualContainerHeader:true}});
  const ids = spec.pages.map((p,i) => rename ? 'renamed' + (spec.pages.length-i) : p.id);
  wr(D+'/pages/pages.json',{$schema:schema('item/report/definition/pagesMetadata/1.0.0'),pageOrder:ids,activePageName:ids[0]});
  spec.pages.forEach((p,i) => {
    const pg = {$schema:schema('item/report/definition/page/2.0.0'),name:ids[i],displayName:'Synthetic page',displayOption:'FitToPage',width:p.width,height:p.height};
    if (p.tooltip) Object.assign(pg,{type:'Tooltip',visibility:'HiddenInViewMode',pageBinding:{name:'syntheticBinding',type:'Tooltip'}});
    if (p.background) pg.objects={background:obj({image:{image:{name:Q('synthetic.svg'),url:{expr:{ResourcePackageItem:{PackageName:'RegisteredResources',PackageType:1,ItemName:'synthetic.svg'}}},scaling:Q('Fit')}}})};
    wr(D+'/pages/'+ids[i]+'/page.json',pg);
    for (const v of p.visuals) wr(D+'/pages/'+ids[i]+'/visuals/'+v.name+'/visual.json',v);
  });
  // Text SVG only. The PNG flipping/rendering path is deliberately not claimed.
  if (spec.pages.some(p=>p.background)) wr('Synthetic.Report/StaticResources/RegisteredResources/synthetic.svg','<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#eeeeee"/></svg>');
  return ids;
}
// Observe writes during actual handler calls without changing the gate or write behavior.
let monitoring = false, writes = [], outside = [];
for (const key of ['writeFileSync','appendFileSync','mkdirSync','renameSync','linkSync','symlinkSync','unlinkSync','rmSync','openSync']) {
  const orig = fs[key]; fs[key] = function(...args) {
    if (monitoring && !(key==='openSync' && (typeof args[1]==='number' ? (args[1] & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_APPEND))===0 : typeof args[1]==='string' && /^r[ s]*$/.test(args[1])))) {
      const paths = ['renameSync','linkSync','symlinkSync'].includes(key) ? args.slice(0,2) : args.slice(0,1);
      for (const f of paths) if (typeof f==='string' || Buffer.isBuffer(f)) { const a=path.resolve(String(f)); writes.push({op:key,path:path.relative(ROOT,a),flag:key==='openSync'?args[1]:null}); if (!(a===ROOT || a.startsWith(ROOT+path.sep))) outside.push(key); }
    }
    return orig.apply(this,args);
  };
}
syncBuiltinESMExports();
async function call(a) {
  monitoring=true;
  try { const r=await handler(a), t=(r.content||[]).map(c=>c.text||'').join(''); let j; try {j=JSON.parse(t);} catch {} return {err:!!r.isError,j,t}; }
  finally {monitoring=false;}
}
const fail = (out,id,why,files=[]) => { (out[id] ||= []).push({why,files}); };
function canonFiles(files, ids, canonicalIds, normalizeId) {
  return files.map(f=> { let name=f.path, data=f.data; if (normalizeId && /\.platform$/.test(name)) { const j=JSON.parse(data); j.config.logicalId='NORMALIZED'; data=JSON.stringify(j); }
    ids.forEach((id,i)=>{ name=name.replaceAll('/'+id+'/', '/'+canonicalIds[i]+'/'); data=data.replaceAll('"'+id+'"','"'+canonicalIds[i]+'"'); }); return {path:name,data}; }).sort((a,b)=>a.path.localeCompare(b.path));
}
async function build(spec, variant, out, fast=false) {
  const dir=path.join(ROOT,variant); fs.mkdirSync(dir); const ids=materialize(spec,dir,variant==='renamed');
  const before=disk(dir), base={path:variant+'/Synthetic.pbip',arabicMonth:false};
  const labels={}; let offset=0, last=-1, answer;
  do {
    writes=[]; outside=[]; const p=await call({...base,textsFrom:offset});
    if (writes.length || outside.length || digestOf(disk(dir))!==digestOf(before)) fail(out,'S1','planning wrote files',writes.map(x=>JSON.stringify(x)));
    if(p.err || !p.j) throw new Error('plan refused'); answer=p.j;
    for(const t of answer.texts||[]) { labels[t.id]=['عنوان عربي','عنوان عربي تجريبي','عنوان عربي تجريبي طويل'][parseInt(sha(t.text||'').slice(0,4),16)%3]; if(t.altTextToo) labels[t.altTextToo]=labels[t.id]; }
    last=offset; offset=answer.moreTexts?.from ?? -1;
  } while(offset>=0 && offset>last);
  writes=[]; const p=await call({...base,labels});
  if (writes.length || digestOf(disk(dir))!==digestOf(before)) fail(out,'S1','label planning wrote files');
  const id=p.j?.plan?.planId, art=id && Plans.artifactOf(id);
  if(!id || !art) throw new Error('no executable plan');
  writes=[]; const no=fast?null:await call({...base,labels,planId:id});
  if(!fast && (!no.err || !/not approved yet/.test(no.t) || writes.length || digestOf(disk(dir))!==digestOf(before))) fail(out,'S1','unapproved write not refused without changes');
  Plans.approve(id,'user-in-browser');
  writes=[]; const bad=fast?null:await call({...base,labels:{'page:invalid':'مختلف'},planId:id});
  if(!fast && (!bad.err || !/Nothing was written/.test(bad.t) || writes.length || digestOf(disk(dir))!==digestOf(before))) fail(out,'S1','changed labels not refused without changes');
  outside=[]; const w=await call({...base,labels,planId:id});
  if(w.err || !w.j?.written) throw new Error('approved write refused');
  if(outside.length) fail(out,'S1','outside working-folder write observed');
  const now=disk(dir), originalPaths=new Set(before.map(f=>f.path));
  if(before.some(f=>!now.some(n=>n.path===f.path && n.data===f.data))) fail(out,'S1','original changed');
  const files=now.filter(f=>!originalPaths.has(f.path));
  if(digestOf(files)!==art.digest || p.j.exact?.digest!==art.digest || w.j.exact?.digest!==art.digest || files.length!==p.j.exact?.files) fail(out,'P1','approved digest does not match all written files');
  const unnamed=files.filter(f=>{if(f.path.endsWith('.platform'))return !p.t.includes(f.path);if(!f.path.endsWith('/visual.json'))return false;const src=before.find(x=>x.path===f.path.replace('Synthetic AR.Report/','Synthetic.Report/'));if(!src)return !p.t.includes(f.path);const en=JSON.parse(src.data),ar=JSON.parse(f.data);delete en.position;delete ar.position;return JSON.stringify(en)!==JSON.stringify(ar)&&!p.t.includes(f.path);});
  if(unnamed.length)fail(out,'P1','exact digest binds files but answer does not enumerate their paths',unnamed.map(f=>f.path));
  const answers=[p.t,w.t,no?.t||'',bad?.t||''];
  // No rows or value literals enter the fixture. Compare forbidden metadata payload keys as the safety tests do.
  if(answers.some(t=>/"(?:sampleRows|dataRows|rowValues|connectionString|password|accessToken)"\s*:/.test(t))) fail(out,'S1','forbidden data payload key in answer');
  return {dir,ids,files,plan:p.j,art,before};
}
async function validate(dir, ar) {
  const name='Synthetic'+(ar?' AR':''), reportDir=path.join(dir,name+'.Report');
  const r=await runReportValidation({reportDir,defDir:path.join(reportDir,'definition'),provider,skipSchema:true,pbipPath:path.join(dir,name+'.pbip')});
  return Object.fromEntries(Object.entries(r.diagnostics||{}).filter(([,d])=>d.severity==='error' && d.items?.length).map(([code,d])=>[code,d.items.map(it=>it.file ? path.relative(reportDir,it.file).split(path.sep).join('/') : '')]));
}
function visualMap(build) { const m=new Map(); for(const f of build.files) if(f.path.endsWith('/visual.json')) { const parts=f.path.split('/'); m.set(parts[3]+'/'+parts[5],JSON.parse(f.data)); } return m; }
function absolute(v, all) { let b=clone(v.position), p=v.parentGroupName, seen=new Set(); while(p && !seen.has(p)){seen.add(p);const g=all.find(x=>x.name===p);if(!g)break;b.x+=g.position.x;b.y+=g.position.y;p=g.parentGroupName;}return b; }
const overlap = (a,b) => Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>.5 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>.5;
function exceptions(plan,pg,v) {
  if(plan.pages?.find(p=>p.id===pg)?.leftToRight) return true;
  const name=pg+'/'+v;
  const s=JSON.stringify({mirrors:plan.mirrors?.filter(x=>x.kind==='heatmapNames'),cannot:plan.cannot,movedByRule:plan.movedByRule,keptTogether:plan.keptTogether,keptInView:plan.keptInView,pictureChecks:plan.pictureChecks,fitted:plan.fitted});
  return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')+'(?=[^A-Za-z0-9_]|$)').test(s) || Object.values(plan.fitted||{}).flat().some(x=>x?.page===pg && x?.visual===v);
}
const PROP=['V1','V2','D1','M1','B1','B2','B3','P1','T1','S1'];
let evaluations=0, validatorCalls=0;
async function evaluate(spec, target=null) {
  evaluations++; const out={}, extra={};
  try {
    const a=await build(spec,'a',out,!!target&&target!=='S1'), vm=visualMap(a);
    if(!target || target==='V1') {
      const en=await validate(a.dir,false), ar=await validate(a.dir,true); validatorCalls+=2; extra.validatorOriginal=Object.keys(en);
      for(const [code,files] of Object.entries(ar)) if(!en[code]) fail(out,'V1',code,files);
    }
    for(const f of a.files) if(f.path.endsWith('/visual.json') && !JSON.parse(f.data).$schema) fail(out,'V2','visual lacks $schema',[f.path]);
    if(!target || target==='D1') {
      const b=await build(spec,'b',out,!!target), c=target==='D1'?b:await build(spec,'renamed',out);
      const normalize=(x,id=false)=>canonFiles(x.files,x.ids,a.ids,id);
      if(JSON.stringify(normalize(a))!==JSON.stringify(normalize(b))) fail(out,'D1','byte difference between independent plans',a.files.filter(f=>!b.files.some(g=>g.path===f.path&&g.data===f.data)).map(f=>f.path));
      extra.normalizedRepeat=JSON.stringify(normalize(a,true))===JSON.stringify(normalize(b,true));
      extra.normalizedRenamed=JSON.stringify(normalize(a,true))===JSON.stringify(normalize(c,true));
      if(!extra.normalizedRepeat) fail(out,'D1','difference after logical ID normalization');
      if(!extra.normalizedRenamed) fail(out,'D1','page rename changes normalized output');
    }
    for(const pg of spec.pages) {
      const av=[...vm].filter(([k])=>k.startsWith(pg.id+'/')).map(([,v])=>v);
      for(const v of av) {
        const b=absolute(v,av);
        if(b.x<-.5 || b.y<-.5 || b.x+b.width>pg.width+.5 || b.y+b.height>pg.height+.5) fail(out,'B1','visual outside page',[pg.id+'/'+v.name]);
      }
      for(const en of pg.visuals) {
        const ar=vm.get(pg.id+'/'+en.name); if(!ar) {fail(out,'M1','original visual missing',[pg.id+'/'+en.name]);continue;}
        const kept=exceptions(a.plan,pg.id,en.name), parent=pg.visuals.find(v=>v.name===en.parentGroupName), width=parent?.position.width||pg.width;
        if(!kept && (Math.abs(width-ar.position.x-ar.position.width-en.position.x)>.5 || Math.abs(ar.position.y-en.position.y)>.5 || Math.abs(ar.position.width-en.position.width)>.5 || Math.abs(ar.position.height-en.position.height)>.5)) fail(out,'M1','double position reflection differs without disclosed exception',[pg.id+'/'+en.name, 'English '+JSON.stringify(en.position),'Arabic '+JSON.stringify(ar.position)]);
        if(!kept && (ar.position.width<en.position.width*.75-.5 || ar.position.width<59.5)) fail(out,'B3',ar.position.width===en.position.width?'unchanged source width already below 60 px':'width below threshold without disclosed exception',[pg.id+'/'+en.name,'English width '+en.position.width,'Arabic width '+ar.position.width]);
      }
      for(let i=0;i<pg.visuals.length;i++) for(let j=i+1;j<pg.visuals.length;j++) {
        const x=pg.visuals[i],y=pg.visuals[j],ax=vm.get(pg.id+'/'+x.name),ay=vm.get(pg.id+'/'+y.name);
        if(ax&&ay&&overlap(absolute(x,pg.visuals),absolute(y,pg.visuals))!==overlap(absolute(ax,av),absolute(ay,av))) fail(out,'B2',overlap(absolute(x,pg.visuals),absolute(y,pg.visuals))?'existing overlap lost':'new overlap introduced',[pg.id+'/'+x.name,pg.id+'/'+y.name]);
      }
      const nt=JSON.stringify(a.plan.notTranslated||[]);
      for(const v of av) for(const t of Mirror.textsOfVisual(pg.id,v)) if(/[A-Za-z]/.test(t.text) && !nt.includes(t.text)) fail(out,'T1','visible English text absent from notTranslated',[pg.id+'/'+v.name,t.id]);
      const pageFile=a.files.find(f=>f.path.endsWith('/'+pg.id+'/page.json'));
      if(pageFile){const n=JSON.parse(pageFile.data).displayName;if(/[A-Za-z]/.test(n)&&!nt.includes(n))fail(out,'T1','English page name absent from notTranslated',[pg.id]);}
    }
    return {failures:out,extra};
  } catch(e) { return {failures:out,extra,error:String(e.message).replaceAll(ROOT,'WORK')}; }
  finally { for(const n of ['a','b','renamed']) fs.rmSync(path.join(ROOT,n),{recursive:true,force:true}); }
}
const cache=new Map(); let shrinkChecks=0, cacheHits=0;
async function preserves(spec,prop) {
  if(spec.pages.some(p=>p.visuals.some(v=>v.parentGroupName&&!p.visuals.some(g=>g.name===v.parentGroupName&&g.visualGroup))))return false;
  const key=prop+':'+sha(spec); if(cache.has(key)){cacheHits++;return cache.get(key);}
  shrinkChecks++;const e=await evaluate(spec,prop), yes=!e.error && !!e.failures[prop];cache.set(key,yes);return yes;
}
// Delta debugging to a deletion fixed point. Mandatory PBIR identity/geometry keys stay valid.
async function shrink(input,prop) {
  let s=clone(input);
  async function reduceList(get,set,min) {
    let granularity=2;
    while(get(s).length>min){const list=get(s),step=Math.ceil(list.length/granularity);let changed=false;
      for(let i=0;i<list.length;i+=step){const rest=list.filter((_,j)=>j<i||j>=i+step);if(rest.length<min)continue;const c=clone(s);set(c,rest);if(await preserves(c,prop)){s=c;changed=true;granularity=2;break;}}
      if(!changed){if(granularity>=list.length)break;granularity=Math.min(list.length,granularity*2);}
    }
  }
  await reduceList(x=>x.pages,(x,l)=>{x.pages=l;},1);
  for(let p=0;p<s.pages.length;p++) await reduceList(x=>x.pages[p].visuals,(x,l)=>{x.pages[p].visuals=l;},0);
  // Try a canonical small shape before deleting optional properties. It is accepted only
  // after the same property fails through an approved real write. Identical candidates
  // reuse measured results, avoiding repeated validator work for thousands of seeds.
  if (['V1','V2','D1','P1'].includes(prop)) {
    const c=clone(s);
    c.pages.forEach((p,i)=>{p.id='p'+i;p.width=1280;p.height=720;
      const ids=new Map(p.visuals.map((v,j)=>[v.name,'v'+j]));
      p.visuals.forEach((v,j)=>{v.name='v'+j;if(v.parentGroupName)v.parentGroupName=ids.get(v.parentGroupName)||v.parentGroupName;v.position={x:20,y:20,width:320,height:240,z:j*1000,tabOrder:j*1000};});});
    if(await preserves(c,prop))s=c;
  }
  // Remove a missing parent's references as one dependency group. Removing just one
  // changes sibling membership and can incorrectly prevent cleanup of all references.
  for(let p=0;p<s.pages.length;p++) {
    const names=new Set(s.pages[p].visuals.map(v=>v.name));
    const dangling=new Set(s.pages[p].visuals.map(v=>v.parentGroupName).filter(n=>n&&!names.has(n)));
    for(const parent of dangling){const c=clone(s);for(const v of c.pages[p].visuals)if(v.parentGroupName===parent)delete v.parentGroupName;if(await preserves(c,prop))s=c;}
  }
  // Remove dangling group links so a minimal fixture is independently replayable.
  for(let p=0;p<s.pages.length;p++) for(let i=0;i<s.pages[p].visuals.length;i++) {const v=s.pages[p].visuals[i];if(v.parentGroupName&&!s.pages[p].visuals.some(g=>g.name===v.parentGroupName)){const c=clone(s);delete c.pages[p].visuals[i].parentGroupName;if(await preserves(c,prop))s=c;}}
  function removable(x,route=[],out=[]) {
    if(!x||typeof x!=='object')return out;
    for(const k of Object.keys(x)){
      if(['$schema','id','name','width','height','x','y','z','visualType','pages','visuals','position','visual','visualGroup','field','queryState','projections','queryRef','nativeQueryRef','Expression','SourceRef','Entity','Property'].includes(k)){removable(x[k],[...route,k],out);continue;}
      if(Array.isArray(x) && ['pages','visuals'].includes(route.at(-1))){removable(x[k],[...route,k],out);continue;}
      out.push([...route,k]);removable(x[k],[...route,k],out);
    }return out;
  }
  let changed=true;while(changed){changed=false;for(const route of removable(s).sort((a,b)=>a.length-b.length)) {const c=clone(s);let o=c;for(const k of route.slice(0,-1))o=o?.[k];if(!o)continue;const k=route.at(-1);if(Array.isArray(o))o.splice(Number(k),1);else delete o[k];if(await preserves(c,prop)){s=c;changed=true;break;}}}
  // Normalize IDs and dimensions only when the actual failure survives.
  const c=clone(s);c.pages.forEach((p,i)=>{p.id='p'+i;});if(await preserves(c,prop))s=c;
  return s;
}
const CAUSES={V1:'assets/js/report-mirror.js:577 constructs the names table without $schema; mcp/lib/twin-pages.mjs:554 writes built visuals.',V2:'assets/js/report-mirror.js:577 constructs the names table without $schema.',D1:'mcp/lib/twin-plan.mjs:331 chooses a fresh randomUUID per independent plan. Literal byte determinism conflicts with new artifact identity.',M1:'assets/js/report-mirror.js:697 groups visual units; mcp/lib/twin-pages.mjs:593 collects rule moves; mcp/lib/twin-plan.mjs:372 caps disclosed moves.',B1:'mcp/lib/twin-pages.mjs:543 starts the fitted page build; geometry after fitting is not universally clipped to page bounds.',B2:'mcp/lib/twin-pages.mjs:583 fits headers and subsequent layout rules can alter overlap relations. A relation change is not necessarily a Desktop defect.',B3:'mcp/lib/twin-pages.mjs:441 changes text width; mcp/lib/twin-pages.mjs:593 collects moves for disclosure.',P1:'mcp/tools/create_arabic_twin.mjs:94 binds the exact digest; mcp/lib/twin-write.mjs:119 compares rebuilt and approved bytes.',T1:'assets/js/report-mirror.js:745 enumerates visible text; mcp/lib/twin-texts.mjs:355 determines notTranslated.',S1:'mcp/tools/create_arabic_twin.mjs:63 gates approval; mcp/lib/twin-write.mjs:111 rebuilds pinned inputs and :125 writes the tree.'};
const started=performance.now(), cpu0=process.cpuUsage();
const stats={seed:SEED,requestedGenerated:COUNT,node:process.version,productSha:execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),evidenceSha:EVIDENCE,generated:0,realShapes:0,kindCounts:{},pageSizes:{},tooltipPages:0,backgroundPages:0,properties:Object.fromEntries(PROP.map(p=>[p,{run:0,failed:0,cases:[],failureKinds:{}} ])),normalizedRepeatFailures:0,normalizedRenameFailures:0,approvalBindingFailures:0,errors:[],occurrences:[],baselineErrorCodes:{}};
const saved=new Map();
async function runOne(spec,seed,source) {
  const start=performance.now(),r=await evaluate(spec);
  if(r.error){stats.errors.push({seed,source,error:r.error});return;}
  if(source==='generated')stats.generated++;else stats.realShapes++;
  for(const p of spec.pages){const size=p.width+'x'+p.height;stats.pageSizes[size]=(stats.pageSizes[size]||0)+1;if(p.tooltip)stats.tooltipPages++;if(p.background)stats.backgroundPages++;for(const v of p.visuals){const k=v.visual?.visualType||'group';stats.kindCounts[k]=(stats.kindCounts[k]||0)+1;}}
  for(const code of r.extra.validatorOriginal||[])stats.baselineErrorCodes[code]=(stats.baselineErrorCodes[code]||0)+1;
  if(r.failures.P1?.some(f=>f.why.startsWith('approved digest')))stats.approvalBindingFailures++;
  if(r.extra.normalizedRepeat===false)stats.normalizedRepeatFailures++;
  if(r.extra.normalizedRenamed===false)stats.normalizedRenameFailures++;
  for(const prop of PROP){stats.properties[prop].run++;if(!r.failures[prop])continue;stats.properties[prop].failed++;for(const why of new Set(r.failures[prop].map(f=>f.why)))stats.properties[prop].failureKinds[why]=(stats.properties[prop].failureKinds[why]||0)+1;
    const minimal=await shrink(spec,prop), confirmation=await evaluate(minimal,prop);
    if(confirmation.error||!confirmation.failures[prop])throw new Error('shrink lost failure');
    const key=prop+':'+sha(minimal);let dest=saved.get(key);
    if(!dest){dest='cases/'+prop+'-'+(stats.properties[prop].cases.length+1);saved.set(key,dest);stats.properties[prop].cases.push(dest);const d=path.join(OUT,dest);materialize(minimal,path.join(d,'pbir'));put(path.join(d,'spec.json'),minimal);put(path.join(d,'seed.txt'),String(seed)+'\n');put(path.join(d,'why.md'),'# '+prop+'\n\n'+CAUSES[prop]+'\n\nReproduced on '+stats.productSha+'.\n\nFailure metadata:\n\n```json\n'+JSON.stringify(confirmation.failures[prop],null,2)+'\n```\n\nDeletion-minimal under the lab reducer, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.\n\nReplay: `node fuzz.mjs /path/to/DataArcus --replay '+dest+'/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).\n');}
    stats.occurrences.push({seed,source,invariant:prop,case:dest});
  }
  stats.lastCaseSeconds=(performance.now()-start)/1000;
}
try {
  if(REPLAY){const f=path.resolve(HERE,REPLAY);let spec=arg('--regenerate-seed',null)==null?JSON.parse(fs.readFileSync(f,'utf8')):generate(Number(arg('--regenerate-seed',0)));const reduce=arg('--reduce-replay',null);if(reduce){if(!PROP.includes(reduce))throw Error('Unknown reduction property');spec=await shrink(spec,reduce);materialize(spec,path.join(OUT,'pbir'));put(path.join(OUT,'spec.json'),spec);}const r=await evaluate(spec);put(path.join(OUT,'replay.json'),r);console.log(JSON.stringify({replay:true,failures:Object.keys(r.failures),error:r.error}));}
  else {
    for(let i=0;i<COUNT;i++){await runOne(generate((SEED+i)>>>0),(SEED+i)>>>0,'generated');if((i+1)%10===0){put(path.join(OUT,'progress.json'),{generated:stats.generated,attempted:i+1,errors:stats.errors.length,failures:Object.fromEntries(PROP.map(p=>[p,stats.properties[p].failed])),elapsedSeconds:(performance.now()-started)/1000,evaluations,shrinkChecks,cacheHits});console.log(JSON.stringify({attempted:i+1,completed:stats.generated,evaluations,seconds:Math.round((performance.now()-started)/1000)}));}}
    const names=process.argv.includes('--skip-evidence')?[]:execFileSync('git',['-C',repo,'ls-tree','-r','--name-only',EVIDENCE,'lab/evidence/0.3.1-shapes'],{encoding:'utf8'}).trim().split('\n').filter(x=>x.endsWith('/en.json'));
    for(let i=0;i<names.length;i++){const raw=JSON.parse(execFileSync('git',['-C',repo,'show',EVIDENCE+':'+names[i]],{encoding:'utf8'}));await runOne(evidenceShape(raw),'shape-'+i,'evidence:'+i);}
    stats.evidenceManifest=names.map((p,i)=>({index:i,path:p}));stats.wallSeconds=(performance.now()-started)/1000;const cpu=process.cpuUsage(cpu0);stats.cpuSeconds=(cpu.user+cpu.system)/1e6;Object.assign(stats,{evaluations,validatorCalls,shrinkChecks,cacheHits});put(path.join(OUT,'stats.json'),stats);console.log(JSON.stringify({generated:stats.generated,realShapes:stats.realShapes,errors:stats.errors.length,wallSeconds:stats.wallSeconds}));
  }
} finally {fs.rmSync(TMP,{recursive:true,force:true});}
