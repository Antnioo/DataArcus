// 0.3.1 BD1 (the owner's laptop run, 26 Oct, Power BI Desktop 2.159.883.0; written red first): Arabic text with a Latin run
// as Desktop drew it, and L6's words made true. Measured: a title «U+200F U+2068 Total Sales U+2069: التفاصيل» reads in
// order; DA.StoryTitle's Arabic (no U+200F, it starts with an isolate) reads out of order; a text box with no marks and a
// Latin run in the MIDDLE («عدد الأوامر حسب Department في كل شهر») draws its two Arabic phrases swapped; before the DAX
// functions script is applied Desktop shows an ERROR in the KPI cards, story titles and table columns (not "empty"); its
// compatibility prompt comes at Preview as well as Apply and names only the first function.
//   D  DA.StoryTitle (and the library's other run-time texts)    X  the Arabic lens's TEXT_MIXED words
//   W  what the option says Desktop shows before the script
// Made-up texts and a hand page in a temp folder (no employer data). In process; nothing else is written.
//   node test-0.3.1-bd1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-bd1-')));
process.env.DATAARCUS_ROOT = ROOT;
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const cps = (s) => Array.from(String(s)).map((c) => (c.codePointAt(0) > 0x7e ? 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') : c)).join('');
const RLM = '‏', FSI = '⁨', PDI = '⁩', RLI = '⁧', MARKS = /[‎‏⁦-⁩‪-‮]/g;

const DF = await import('./lib/dax-functions.mjs');
const fnOf = (n) => DF.LIBRARY.find((f) => f.name === n);

// ---------- a JS evaluation of a library function's own DAX body (the subset its text uses) ----------
// VAR x = e / RETURN e; string literals; & joins; IF, ISBLANK, BLANK, UNICHAR, ABS, FORMAT ( x, "0", "en-US" ); = compares
function evalDax(f, args) {
  const params = f.params.split(',').map((p) => p.split(':')[0].trim());
  const js = f.body.map((line) => {
    const S = []; let e = line.replace(/"((?:[^"]|"")*)"/g, (_, s) => { S.push(s.replace(/""/g, '"')); return `__S${S.length - 1}__`; });
    e = e.replace(/^VAR (\w+) = /, 'const $1 = ').replace(/^RETURN /, 'return ').replace(/&/g, '+').replace(/(?<![<>!=])=(?!=)/g, '==').replace(/^const (\w+) == /, 'const $1 = ');
    return e.replace(/__S(\d+)__/g, (_, k) => JSON.stringify(S[+k])) + ';';
  }).join('\n');
  const lib = { IF: (c, a, b) => (c ? a : b), ISBLANK: (x) => x == null, BLANK: () => null, UNICHAR: (n) => String.fromCodePoint(n), ABS: Math.abs,
    FORMAT: (x, fmt) => { if (fmt !== '0') throw new Error('FORMAT ' + fmt); return String(Math.round(x)); }, TRUE: () => true, FALSE: () => false };
  return new Function(...Object.keys(lib), ...params, js)(...Object.values(lib), ...args);
}

// ---------- D: DA.StoryTitle's Arabic starts with U+200F (the measured pattern), and ends with it after an isolate ----------
{
  const st = fnOf('DA.StoryTitle'), body = st.body.join('\n');
  chk(() => /UNICHAR \( 8207 \)/.test(body), () => 'D1. DA.StoryTitle builds U+200F (UNICHAR ( 8207 )): ' + body.slice(-300));
  const ar = evalDax(st, ['North', '1.2M', 'Sales', 0.094, 'العام الماضي', 'ar']);
  chk(() => ar.startsWith(RLI + RLM + FSI + 'North' + PDI), () => `D2. the Arabic title (a Latin leader) starts with U+200F, then the isolated leader (inside BD2's wrap, U+2067 first): ${cps(ar)}`);
  chk(() => ar.replace(MARKS, '') === 'North في الصدارة بـ 1.2M Sales، بارتفاع 9% عن العام الماضي', () => `D3. the marks taken off, the plain sentence: ${cps(ar)}`);
  const noDelta = evalDax(st, ['North', '1.2M', 'Sales', null, 'العام الماضي', 'ar']);
  chk(() => noDelta.startsWith(RLI + RLM + FSI) && noDelta.endsWith(PDI + RLM + PDI), () => `D4. with no change (it ends with the isolated noun): U+200F at both ends inside BD2's wrap (U+2067 ... U+2069), as isolateLatin's rule: ${cps(noDelta)}`);
  const en = evalDax(st, ['North', '1.2M', 'Sales', -0.05, 'last year', 'en']);
  chk(() => en === 'North leads with 1.2M Sales, down 5% on last year' && evalDax(st, ['', '1', 'x', null, 'p', 'ar']) == null, () => `D5. English unchanged, no mark; a blank leader a blank title: ${cps(en)}`);
  // every other text a library function builds at run time: DA.KpiCard's is HTML in an SVG picture (a browser paragraph
  // with dir="rtl", not Power BI's text drawing); the sparkline and the bullet bar draw no text
  chk(() => /dir='" & IF \( ar, "rtl", "ltr" \)/.test(fnOf('DA.KpiCard').body.join('\n')) && !/<text/.test(fnOf('DA.Sparkline').body.join('') + fnOf('DA.BulletBar').body.join('')),
    () => 'D6. the KPI card\'s Arabic is an HTML paragraph with dir="rtl"; the sparkline and bullet bar have no text');
}

// ---------- X: the Arabic lens's TEXT_MIXED (the same id and count; the words as Desktop drew it) ----------
{
  fs.cpSync(path.join(HERE, 'test-models/service-orders'), path.join(ROOT, 'so'), { recursive: true, filter: (f) => !/make-report\.mjs$/.test(f) });
  const S = 'https://developer.microsoft.com/json-schemas/fabric/', R = 'hand/Hand.Report', DEF = R + '/definition';
  const put = (rel, o) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
  const box = (name, x, y, text) => put(`${DEF}/pages/arPage00001/visuals/${name}/visual.json`, { $schema: S + 'item/report/definition/visualContainer/2.1.0/schema.json', name, position: { x, y, z: 1000, height: 60, width: 500, tabOrder: 1000 },
    visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: 'Segoe UI', fontSize: '14pt' } }], horizontalTextAlignment: 'right' }] } }] } } });
  put('hand/Hand.pbip', { $schema: S + 'pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: 'Hand.Report' } }], settings: { enableAutoRecovery: true } });
  put(R + '/definition.pbir', { $schema: S + 'item/report/definitionProperties/2.0.0/schema.json', version: '4.0', datasetReference: { byPath: { path: '../../so/Service Orders.SemanticModel' } } });
  put(DEF + '/version.json', { $schema: S + 'item/report/definition/versionMetadata/1.0.0/schema.json', version: '2.0.0' });
  put(DEF + '/report.json', { $schema: S + 'item/report/definition/report/2.1.0/schema.json', themeCollection: {} });
  put(DEF + '/pages/pages.json', { $schema: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json', pageOrder: ['arPage00001'], activePageName: 'arPage00001' });
  put(DEF + '/pages/arPage00001/page.json', { $schema: S + 'item/report/definition/page/2.0.0/schema.json', name: 'arPage00001', displayName: 'الأوامر', displayOption: 'FitToPage', width: 1280, height: 720 });
  box('middle', 760, 20, 'عدد الأوامر حسب Department في كل شهر');   // L1's hand fixture, measured swapped
  box('start', 760, 100, 'Department: عدد الأوامر في كل شهر');
  box('plain', 760, 180, 'الأوامر المفتوحة في كل شهر');
  const { arabicLens } = await import('./lib/arabic-lens.mjs');
  let L = null; try { L = arabicLens('hand/Hand.pbip'); } catch (e) { L = { threw: String(e && e.stack || e).slice(0, 400) }; }
  const all = (L && L.findings) || [];
  const f = all.find((x) => x.rule === 'TEXT_MIXED');
  chk(() => f && f.count === 2 && f.page && f.page.id === 'arPage00001', () => `X1. TEXT_MIXED, the same id, counts the 2 mixed texts (a middle run and a start run), not the Arabic one: ${JSON.stringify(f || L).slice(0, 500)}`);
  const words = f ? f.what + ' ' + f.fix.how : '';
  chk(() => !/reword/i.test(words) && !/sits between Arabic words/i.test(words), () => `X2. no longer offers "reword it so the run sits between Arabic words" (Desktop swapped one there): ${words}`);
  chk(() => /anywhere/i.test(f.what) && /swap/i.test(f.what) && /Desktop 2\.159, 26 Oct/.test(f.what), () => `X3. says a Latin run anywhere can swap the Arabic around it, measured in Desktop 2.159, 26 Oct: ${f && f.what}`);
  chk(() => /U\+2068/.test(f.fix.how) && /U\+2069/.test(f.fix.how) && /U\+200F beside a run that starts or ends the text/.test(f.fix.how), () => `X4. the fix: the isolates and U+200F beside an end run (BD2: and the whole text in U+2067 ... U+2069, bd2 L2): ${f && f.fix.how}`);
  chk(() => f.fix.kind === 'desktop' && !/a run at an end, or one with signs inside it, reads in the wrong place/.test(f.what), () => `X5. a hand page's fix stays a Desktop step; the old "only at an end" claim is gone: ${JSON.stringify(f).slice(0, 400)}`);
}

// ---------- W: what Desktop shows before the script, and its compatibility prompt ----------
{
  const ERR = /shows? an error until you apply the script/i, EMPTY = /\b(empty|blank)\b/i;
  const how = DF.daxHow('Shop - DAX functions.tmdl', 1567);
  const tail = how.slice(how.indexOf('The model is not changed'));
  chk(() => ERR.test(how) && !EMPTY.test(tail), () => `W1. howToApply: an error until the script is applied, not "empty"/"blank": ${how}`);
  chk(() => /Preview/.test(how) && /again at Apply/i.test(how) && /names only the first function/i.test(how) && /DA\.Sparkline/.test(how), () => `W2. howToApply: the prompt comes at Preview and again at Apply, and names only the first function (DA.Sparkline): ${how}`);
  const said = DF.daxSaid({ compat: 1567, lang: 'en', present: [], measures: [], used: {}, functions: DF.FUNCTION_NAMES, scriptFile: 'Shop - DAX functions.tmdl', colours: { good: 'a', bad: 'b', card: 'c', line: 'd', text: 'e' }, notUsed: [] });
  chk(() => ERR.test(said.modelChange) && !EMPTY.test(said.modelChange), () => `W3. the plan's modelChange: ${said.modelChange}`);
  const src = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');
  const sayIn = (src('tools/plan_layout.mjs').match(/sayInPlan: `Say FIRST in the plan[^`]*`/) || [''])[0];
  chk(() => ERR.test(sayIn) && !/pictures are empty/.test(sayIn), () => `W4. plan_layout's sayInPlan: ${sayIn.slice(-300)}`);
  const pend = (src('lib/check-report.mjs').match(/what: `the visual shows \$\{n === 1[^`]*`/) || [''])[0];
  chk(() => /an error/i.test(pend) && !/empty in Power BI Desktop/.test(pend), () => `W5. check_report's DAX_MEASURE_PENDING says Desktop shows an error: ${pend}`);
  const tools = src('TOOLS.md'), sec = tools.slice(tools.indexOf('## The DAX function library'));
  chk(() => ERR.test(sec.split('\n## ')[0]) && /again at Apply/i.test(sec.split('\n## ')[0]), () => 'W6. TOOLS.md\'s DAX library section: an error until the script is applied; the prompt at Preview and again at Apply');
  const l6 = src('work/L6.md'), laptop = l6.slice(l6.indexOf('## For the laptop'), l6.indexOf('## Seen, not in scope'));
  chk(() => !/KPI pictures empty, story titles blank/.test(laptop) && ERR.test(laptop), () => 'W7. L6\'s laptop list says what Desktop showed (an error until the script is applied)');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-bd1.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  bd1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  bd1  ${checks} checks`);
process.exit(0);
