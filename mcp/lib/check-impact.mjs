// What each finding of check_report means for the user (0.3.2 SP41, the split of lib/check-report.mjs: B-280, B-286,
// B-320; mcp/work/SP41.md): pure functions and the measured facts they read. A finding in, its kind out; the counts of
// each kind and what ran in, one sentence out. Nothing here reads a report or a file: what Desktop was measured to open
// or draw is written here with its evidence (scripts/tests/DESKTOP-TESTS.md), and Microsoft's visual catalog is the
// pinned package's (a test passes another). A kind is never a pass: what did not run or was not read is said
// ("Not judged ..."), and "Nothing found" only when Microsoft's validator ran offline and every file was read.
//   impactOf(finding) -> 'canBreak' | 'desktopOpens' | 'openedInDesktop' | 'mayLook' | 'dataarcusRule'
//     finding: { origin validator | schema | rule | instruction | lint, rule, severity, file, _base, known }
//   knownGap(code, object, visualJson, caps?) -> { what, evidence } | null (the validator's known gaps, VALIDATOR_GAPS)
//   impactSummary(counts per kind, { validator: { ran, mode, why }, unread, desktopOpensErrors, known, checks }) -> sentence
//   validatorVerdict(kinds, lang) -> sentence ('' when nothing); openedLine(n), mayLookLine(n) -> sentence
//   IMPACT (each kind's sentence), DESKTOP_OPENS_SOURCE, DESKTOP_DRAWS, DESKTOP_OPENED (each code's evidence), OPENED_FIX
//   CHECKS: check_report's check groups, the summary's "what ran" when none is given
//   arr, litOf, plainObj: the readers of a value of unknown shape (check-report.mjs and check-language.mjs read them here)
// check-report.mjs re-exports every name it exported before the split; this module imports nothing from it.
import { createRequire } from 'node:module';
import { getCapabilities } from '@microsoft/powerbi-core-visual-schema';
import { VALIDATOR_VERSION } from './check-schema.mjs';   // (the installed validator: its known gaps name its version)

export const CHECKS = ['validator', 'schemas', 'sizes', 'selectors', 'phone', 'tooltips', 'theme', 'navigation', 'sort', 'rtl', 'a11y', 'lint'];
// (A4-2, audit 4: a value that is not the object or list a rule expects, as null or a string, is read as none, never a crash)
export const arr = (v) => (Array.isArray(v) ? v : []);

// ---- what each finding means for the user (0.2.9 item 12, the owner's O-16) ----
// Microsoft's validator is stricter than Power BI Desktop: the owner's hand-built portfolio report opens and works in
// Desktop and still showed 10 validator errors (dataarcus-engine business/research/VALIDATOR-LAB.md, 10 Oct 2026).
// Only what was seen there is "Desktop opens it": these codes, in these files. Any other validator code and any schema
// error is "can break it in Desktop" (not measured, so not called harmless); our own rules are "a DataArcus rule".
const DESKTOP_OPENS = {
  PBIR_JSON_FILE_NO_SCHEMA: (b) => /\.pbip$/i.test(b) || /^definition\.pbir$/i.test(b),
  PBIR_THEME_FILE_NAME_MISMATCH: () => true,
  PBIR_THEME_VISUAL_PROP_UNKNOWN: () => true,
  PBIR_FORMATTING_OBJECT_UNKNOWN: (b, f) => /^StaticResources\/RegisteredResources\//.test(f || ''),
  PBIR_FILLRULE_STOP_COLOR_INVALID: () => true
};
// (A4-10 and C1, audit 4: the Desktop-opens codes name their measurement, as the measured rules do)
export const DESKTOP_OPENS_SOURCE = { file: 'scripts/tests/DESKTOP-TESTS.md', date: '2026-10-10', desktop: '2.158.1304', section: 'Microsoft\'s validator on a working hand-built report' };
// (0.3.1 P3A, the laptop's part 3, block B: create_report's check said "0 problems" and check_report "can break" on the
// same files) warnings of Microsoft's validator that Power BI Desktop was measured to draw: the validator itself says
// "may" ("may be too small ... to avoid scrollbar", "may be clipped ... verify in Desktop"), and Desktop drew the text and
// the slicers whole where our writer puts them. Only these codes, only as warnings (the validator's error for a slicer
// too low to draw, PBIR_SLICER_HEIGHT_BELOW_FLOOR, is openedInDesktop since TB2, below): an unmeasured warning (an unknown visual type, a
// drillthrough without its filter) can stop a visual or a page, so Microsoft's severity alone never moves a code here.
export const DESKTOP_DRAWS = {
  PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR: { evidence: 'scripts/tests/DESKTOP-TESTS.md: 2026-10-01 (Desktop 2.157 and 2.158.1177): 20pt whole in a 44-high text box, 8pt in 24; round 11, item 7 (2.158.1177): the 46-high 20pt Arabic title and the 31-32-high titles at 1280 x 720 and 960 x 720 whole (a scroll thumb only at 640 x 360)' },
  PBIR_SLICER_HEADER_MAY_CLIP: { evidence: 'scripts/tests/DESKTOP-TESTS.md: 2026-10-01 (Desktop 2.157 and 2.158.1177): a dropdown slicer needs 16 + 4 x its text size (76 only at 15pt); round 11, item 7 (2.158.1177): the 56-high slicers whole at 1280 x 720 and 960 x 720' }
};
// (0.3.1 TB2, the laptop part 4, blocks C1, C5, C6: check_report said "can break" on hand-built reports that open in
// Desktop and are published) validator codes counted on reports that Power BI Desktop 2.159 opened with no error banner
// (28 Oct 2026): Microsoft's validator flags the file shape (an error or a warning), Desktop opened the report with it.
// Only these codes, each with its count; any code not measured stays "can break". The measurement is of the report opening,
// not of each part drawing, so the sentence says to look at the part in Desktop. PBIR_SLICER_HEIGHT_BELOW_FLOOR: P3A kept
// it "can break" on the validator's own text ("the selector will be clipped") with no Desktop proof; this measurement wins
// (two such slicers opened with no error): Desktop opens the report, the slicer may still look clipped.
const OPENED_IN = 'scripts/tests/DESKTOP-TESTS.md: 2026-10-28, Power BI Desktop 2.159, "Microsoft\'s validator on six hand-built reports that open"';
export const DESKTOP_OPENED = Object.fromEntries([['PBIR_FORMATTING_PROP_NESTED', 76], ['PBIR_FILTER_NAME_DUPLICATE_GLOBAL', 14], ['PBIR_BOOKMARK_ACTION_TARGET_MISSING', 6],
  ['PBIR_ROLE_REQUIRED_MISSING', 3], ['PBIR_SLICER_HEIGHT_BELOW_FLOOR', 2], ['PBIR_ROLE_MAX_EXCEEDED', 1], ['PBIR_SCATTER_NO_GROUPING', 1],
  ['PBIR_DRILLTHROUGH_BACK_BUTTON_MISSING', 1], ['PBIR_VISUAL_TYPE_DEPRECATED', 1], ['PBIR_THEME_VISUAL_UNKNOWN', 1]]
  .map(([code, n]) => [code, { evidence: `${OPENED_IN}: ${n} on reports that opened with no error${code === 'PBIR_ROLE_REQUIRED_MISSING' ? '; an earlier laptop proof (11 Oct 2026, mcp/work/0.2.9-custom-visuals.md, Z1) saw a donut written with no value draw empty: the report opens, the visual may show nothing' : ''}` }]));
// (0.3.1 TB1c: a finding's fix said "opening and saving the report fixes most structure problems", which no
// measurement shows) a code Desktop was measured to open says only that
export const OPENED_FIX = 'See Microsoft\'s report authoring reference for this code. Power BI Desktop 2.159 opened reports with this shape with no error (measured 28 Oct 2026); saving the report in Desktop may rewrite it.';
export const IMPACT = {
  desktopOpens: 'Power BI Desktop opens the report with these (seen on a working hand-built report): only Microsoft\'s strict validation, and Fabric when the report is published through it, would refuse them. Fix them before publishing through Fabric or Git; the report is not broken in Desktop.',
  canBreak: 'These can break the report in Power BI Desktop: a page or visual that does not open, or shows an error or nothing. Fix these first.',
  openedInDesktop: 'Microsoft\'s validator flags this file shape (an error or a warning); Power BI Desktop 2.159 opened reports with it with no error (measured 28 Oct 2026), and saving the report in Desktop may rewrite it. The report opens; look at the part in Desktop, which may still not draw as meant (each code\'s measurement says what was seen).',
  mayLook: 'Warnings of Microsoft\'s validator that Power BI Desktop was measured to draw (a text box\'s height, a dropdown slicer\'s header): the report opens and the part shows, but it may not look as meant at this size (a scroll thumb, a header tight against the box). Look at the part in Power BI Desktop; nothing to fix unless it shows there.',
  dataarcusRule: 'DataArcus\'s own rules, measured in Power BI Desktop, and Power BI\'s accessibility basics from Microsoft\'s guidance (the a11y rules): the report opens, but a part may not look or work as meant (cut text, a setting Desktop ignores, a scrollbar in a tooltip, a chart a screen reader or a keyboard cannot reach).'
};
// ---- what Microsoft's validator does not know yet and Power BI Desktop draws (polish round P2, the owner's rounded slicer
// boxes, 12 Oct 2026) ----
// One entry per Desktop proof, each with its evidence. A validator finding is "known" only when it is exactly the proven
// shape: the code, the object, the visual type (and its mode), every property one of the proven ones with a value of the
// proven kind, no selector. Anything else, even one more property of the same object, stays the validator's error.
// (0.3.3 SG1) a raw literal: its one place, assets/js/pbir-values.js litValue
export const litOf = createRequire(import.meta.url)('../../assets/js/pbir-values.js').litValue;
export const plainObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
export const VALIDATOR_GAPS = [{
  code: 'PBIR_FORMATTING_OBJECT_UNKNOWN', object: 'dropdown', visualType: 'slicer',
  // a dropdown slicer (the mode the report writer writes)
  fits: (v) => { const d = arr(((v.objects || {}).data)).find((e) => plainObj(e) && !e.selector); return d && plainObj(d.properties) && litOf(d.properties.mode) === "'Dropdown'"; },
  // the three properties seen on screen: corners 4, 8 and 12 (0-24 allowed, as the cards' radius), one radius for all
  // four corners, a solid #RGB or #RRGGBB border colour
  props: {
    borderRadius: (p) => { const m = /^(\d{1,2}(?:\.\d+)?)[DL]?$/.exec(String(litOf(p))); return !!m && +m[1] <= 24; },
    borderIndividualCorners: (p) => litOf(p) === 'false' || litOf(p) === false,
    borderColor: (p) => !!(p && p.solid && /^'#(?:[0-9a-f]{3}|[0-9a-f]{6})'$/i.test(String(litOf(p.solid.color))))
  },
  // the validator named is the one installed (mcp/package.json pins it): an entry matches only when that very version
  // reported the code, so "does not list it yet" is true of it by construction
  what: `known: Power BI Desktop 2.158 draws it; Microsoft's validator ${VALIDATOR_VERSION} does not list it yet (a dropdown slicer's rounded box: dropdown.borderRadius, borderIndividualCorners, borderColor). Not an error.`,
  evidence: 'scripts/tests/DESKTOP-TESTS.md, 2026-10-12, Desktop 2.158, "A dropdown slicer\'s rounded box"'
}];
// A gap holds only while Microsoft's visual catalog, which the validator reads (@microsoft/powerbi-core-visual-schema, the
// version mcp/package.json pins), does not list the object for that visual type: once it does, the validator judges the
// object itself and its findings stand (U1, 19 Oct 2026: the catalog 0.1.3 lists the slicer's dropdown).
const listedIn = (caps, type, object) => { try { const c = caps(type); return !!(c && c.objects && c.objects[object]); } catch (e) { return false; } };
// code: the validator's code; object: its item's path (the object's name); visualJson: the visual.json it names;
// caps: the catalog's getCapabilities (a test passes another)
export function knownGap(code, object, visualJson, caps = getCapabilities) {
  const v = plainObj(visualJson) && plainObj(visualJson.visual) ? visualJson.visual : null;
  if (!v) return null;
  const g = VALIDATOR_GAPS.find((x) => x.code === code && x.object === object && x.visualType === v.visualType);
  if (!g || listedIn(caps, g.visualType, g.object) || !g.fits(v)) return null;
  const entries = (v.objects || {})[g.object];
  if (!Array.isArray(entries) || !entries.length) return null;
  const ok = entries.every((e) => plainObj(e) && !('selector' in e) && Object.keys(e).every((k) => k === 'properties') && plainObj(e.properties) && Object.keys(e.properties).length
    && Object.entries(e.properties).every(([k, p]) => Object.prototype.hasOwnProperty.call(g.props, k) && g.props[k](p)));
  return ok ? { what: g.what, evidence: g.evidence } : null;
}
// (A4-7 and C2, audit 4: the kind is read from the finding's origin, set where the finding is made, never guessed from
// its source text. Every finding: { origin: validator | schema | rule | instruction (| lint, in the lint section),
// rule, severity error | warning | note, file, page, visual, what, fix, source, impact } (CHECK-REPORT.md, "Finding shape"))
export const impactOf = (f) => {
  if (f.origin === 'validator') { if (Object.hasOwn(DESKTOP_OPENED, f.rule)) return 'openedInDesktop'; if (f.severity === 'warning' && Object.hasOwn(DESKTOP_DRAWS, f.rule)) return 'mayLook'; if (f.known) return 'desktopOpens'; const t = DESKTOP_OPENS[f.rule]; return t && t(f._base || '', f.file) ? 'desktopOpens' : 'canBreak'; }
  if (f.origin === 'schema') return 'canBreak';
  return 'dataarcusRule';
};
// (A4-3, audit 4: "nothing found" is said only when Microsoft's validator ran offline and every file of the report was
// read; otherwise the summary says what was not judged. The errors counted are the desktopOpens ones only.)
// (0.3.1 RB, item 5, an outside architecture review: check_report never opens Power BI Desktop, so no summary says the
// report opens there or is not broken: it says what was found, what ran, and that Desktop itself was not opened)
// n: findings per kind; ctx: { validator: { ran, mode, why }, unread: files not read (too large, too deep, links,
// not readable), desktopOpensErrors, known, checks: the groups that ran (CHECKS when absent) }. Pure: the same counts
// and context give the same sentence.
export function impactSummary(n, ctx) {
  const L = +((n || {}).mayLook) || 0, O = +((n || {}).openedInDesktop) || 0;
  return impactCore(n, ctx) + (O ? ' ' + openedLine(O) : '') + (L ? ' ' + mayLookLine(L) : '');
}
/** (0.3.1 TB2) the sentence for the validator's codes measured on reports Desktop opened: the same words in check_report's
 *  summary and create_report's check */
export const openedLine = (O) => `${O} ${O === 1 ? 'finding' : 'findings'} of Microsoft's validator ${O === 1 ? 'is a file shape' : 'are file shapes'} it flags that Power BI Desktop 2.159 opened reports with, with no error (measured 28 Oct 2026); saving the report in Desktop may rewrite ${O === 1 ? 'it' : 'them'}; look at ${O === 1 ? 'the part' : 'the parts'} in Desktop.`;
/** (0.3.1 P3A) the sentence for Microsoft's validator's warnings that Desktop was measured to draw: the same words in
 *  check_report's summary and create_report's check */
export const mayLookLine = (L) => `${L} ${L === 1 ? 'warning' : 'warnings'} of Microsoft's validator ${L === 1 ? 'is' : 'are'} a part that may not look as meant (a text box's or a dropdown slicer's height), not a break: Power BI Desktop was measured to draw ${L === 1 ? 'it' : 'them'}; look at ${L === 1 ? 'it' : 'them'} in Desktop.`;
/** (0.3.1 P3A) what Microsoft's validator found in the files a plan builds, in the kinds check_report gives them (kinds:
 *  checkArtifact's checks.validator.kinds), as one sentence in the answer's language; '' when nothing. create_report's
 *  check and plan_layout's exactCheck say it, so the two tools give one verdict on the same files. */
export function validatorVerdict(kinds, lang) {
  const k = kinds || {}, B = +k.canBreak || 0, L = +k.mayLook || 0, O = +k.openedInDesktop || 0, ar = lang === 'ar';
  const brk = !B ? '' : ar ? `${B} من نتائج مدقق Microsoft قد تعطل التقرير في Power BI Desktop (validator.byRule): أصلحها أولًا.`
    : `${B} ${B === 1 ? 'finding' : 'findings'} of Microsoft's validator can break the report in Power BI Desktop (validator.byRule): fix ${B === 1 ? 'it' : 'these'} first.`;
  const look = !L ? '' : ar ? `${L} من تحذيرات مدقق Microsoft عن أجزاء قد لا تظهر كما يُراد (ارتفاع مربع نص أو رأس مقسم منسدل)، لا عن عطل: ثبت بالقياس أن Power BI Desktop يرسمها؛ انظر إليها في Desktop.`
    : mayLookLine(L);
  const opened = !O ? '' : ar ? `${O} من نتائج مدقق Microsoft عن أشكال ملفات يرفضها أو يحذر منها، وقد فتح Power BI Desktop 2.159 تقارير فيها هذه الأشكال بلا خطأ (قياس 28 أكتوبر 2026)؛ قد يعيد Desktop كتابتها عند الحفظ؛ انظر إلى الأجزاء في Desktop.`
    : openedLine(O);
  return [brk, opened, look].filter(Boolean).join(' ');
}
function impactCore(n, ctx) {
  const c = ctx || {}, v = c.validator || {}, unread = +c.unread || 0, E = +c.desktopOpensErrors || 0, K = +c.known || 0;
  // (polish round P2) the validator's known gaps are notes of their own: counted apart from the strict errors
  n = Object.assign({}, n, { desktopOpens: Math.max(0, (+n.desktopOpens || 0) - K) });
  const s = (k, one, many) => (k === 1 ? one : many);
  const ran = Array.isArray(c.checks) ? c.checks : CHECKS, did = ["Microsoft's validator"].concat(ran.includes('schemas') ? ['the schemas'] : [], ran.some((k) => k !== 'validator' && k !== 'schemas') ? ["DataArcus's measured rules"] : []);
  const ranLine = ` (${did.length > 1 ? did.slice(0, -1).join(', ') + ' and ' + did[did.length - 1] : did[0]} ran; Power BI Desktop itself was not opened)`;
  const nothing = `Nothing found that Power BI Desktop is known to refuse${ranLine}.`;
  const reasons = [].concat(v.ran && v.mode === 'offline' ? [] : [`Microsoft's validator did not run${v.why ? ` (${String(v.why).replace(/^not run: /, '')})` : ''}`],
    unread ? [`${unread} ${s(unread, 'file was', 'files were')} not read (see notChecked)`] : []);
  const notJudged = reasons.length ? `Not judged against what Power BI Desktop is known to refuse: ${reasons.join('; ')}.` : '';
  const rules = n.dataarcusRule ? ` ${n.dataarcusRule} DataArcus ${s(n.dataarcusRule, 'rule', 'rules')} also spoke: ${s(n.dataarcusRule, 'a part that', 'parts that')} may not look or work as meant.` : '';
  const strict = n.desktopOpens ? ` ${n.desktopOpens} ${s(n.desktopOpens, 'finding is', 'findings are')} only what Microsoft's strict validation or Fabric would refuse.` : '';
  if (n.canBreak) return `${n.canBreak} ${s(n.canBreak, 'finding', 'findings')} can break the report in Power BI Desktop: fix ${s(n.canBreak, 'it', 'these')} first.` + (n.desktopOpens ? ` ${n.desktopOpens} more ${s(n.desktopOpens, 'is', 'are')} only what strict validation or Fabric would refuse${notJudged ? '' : `; Power BI Desktop was seen to open reports with ${s(n.desktopOpens, 'it', 'them')}`}.` : '') + (notJudged ? ' ' + notJudged : '');
  if (notJudged) return notJudged + strict + rules;
  // (polish round P2) only the validator's known gaps (notes, no error): Desktop draws them
  const knownLine = K ? ` ${K} known ${s(K, 'note', 'notes')}: what Power BI Desktop 2.158 draws and Microsoft's validator ${VALIDATOR_VERSION} does not list yet (each finding's known); nothing to fix.` : '';
  if (K && !n.desktopOpens) return nothing + knownLine + rules;
  if (n.desktopOpens) return `${nothing} Its ${E} ${s(E, 'error is', 'errors are')} what Microsoft's strict validation or Fabric would refuse (${n.desktopOpens} ${s(n.desktopOpens, 'finding', 'findings')}); fix ${s(n.desktopOpens, 'it', 'them')} only before publishing through Fabric or Git.` + knownLine + (n.dataarcusRule ? ` ${n.dataarcusRule} DataArcus ${s(n.dataarcusRule, 'rule', 'rules')} also spoke: ${s(n.dataarcusRule, 'a part that', 'parts that')} may not look as meant.` : '');
  if (n.dataarcusRule) return `Nothing found that Power BI Desktop is known to refuse or that Fabric would refuse${ranLine}; ${n.dataarcusRule} DataArcus ${s(n.dataarcusRule, 'rule', 'rules')} spoke: ${s(n.dataarcusRule, 'a part that', 'parts that')} may not look or work as meant.`;
  return nothing;
}
