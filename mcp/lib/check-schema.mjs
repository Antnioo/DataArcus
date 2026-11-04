// check_report's bundled schemas (0.3.2 SP41, the split of lib/check-report.mjs: B-280, B-286; mcp/work/SP41.md): the
// JSON schemas Microsoft's validator would download, checked here against Microsoft's own copies bundled in mcp/schemas
// (MIT, see SOURCE.md there), offline. Read through the reading layer (lib/read-report.mjs: every file measured before
// it is read, links never followed). A report's text is untrusted input: a schema error is said by its count, its place
// (only the words the bundled schemas name, list positions) and the schema's message with its quoted values left out
// (lib/check-redact.mjs, the one redaction boundary). A schema the bundle does not have is said in notChecked, never
// counted as checked.
//   schemaCheck({ reportDir, files, big }) -> { checked, errors, findings, notChecked, big }
//     reportDir: the report's folder; files: the report's files (absolute paths, walked once by check_report);
//     big: the files already known to be too large ({ file, size }). Out: the files checked and those with errors, a
//     finding per file with errors ({ origin 'schema', rule 'SCHEMA', severity 'error', file, page, visual, what, fix,
//     source }; check-impact.mjs gives it its kind), a notChecked line per schema not bundled, and the files found too
//     large here that big did not hold. The same files give the same answer; the report is never changed.
//   pointer(instancePath) -> the place of a schema error, in the schemas' own words ('…' for a key the report chose)
//   SCHEMA_COMMIT: the commit of microsoft/json-schemas the bundle was copied from (mcp/schemas/SOURCE.md names it too)
// The compiled schemas and the schemas' words are read once, the first time they are needed (a cache of mcp/schemas).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { TooBig, readJson, walk } from './read-report.mjs';
import { rel, maskValues } from './check-redact.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS = path.join(HERE, '..', 'schemas');
const SCHEMA_ROOT = 'https://developer.microsoft.com/json-schemas/';
export const SCHEMA_COMMIT = 'af7b264';
const SCHEMA_FILE = /^https:\/\/developer\.microsoft\.com\/json-schemas\/[A-Za-z0-9_./-]+\/\d+\.\d+\.\d+\/schema(?:[.-]embedded)?\.json$/;
const ver = (u) => { const m = /\/(\d+\.\d+\.\d+)\/schema(?:[.-]embedded)?\.json$/.exec(String(u || '')); return m ? m[1] : null; };
const family = (u) => { const m = /\/([A-Za-z]+)\/\d+\.\d+\.\d+\/schema/.exec(String(u || '')); return m ? m[1] : null; };

// ---- the bundled schemas ----
let AJV = null;
function ajv() {
  if (AJV) return AJV;
  const a = new Ajv({ strict: false, allErrors: true, validateSchema: false }); addFormats(a);
  const files = walk(SCHEMAS, [], 2000).filter((f) => f.endsWith('.json'));
  for (const f of files) { const url = SCHEMA_ROOT + path.relative(SCHEMAS, f).split(path.sep).join('/'); try { a.addSchema(Object.assign({}, readJson(f), { $id: url }), url); } catch (e) { /* a file that is not a schema */ } }
  AJV = a; return a;
}
// a JSON pointer with only the words the bundled schemas name as properties, and list positions (any other segment is
// left out: a key the report chose, as a bookmark's page and visual ids, is a name; 0.3.1 SQ14, S1-S8)
let WORDS = null;
function schemaWords() {
  if (WORDS) return WORDS;
  const w = new Set(), seen = new Set();
  const visit = (o) => { if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o); if (o.properties && typeof o.properties === 'object' && !Array.isArray(o.properties)) Object.keys(o.properties).forEach((k) => w.add(k)); Object.values(o).forEach(visit); };
  for (const f of walk(SCHEMAS, [], 2000).filter((x) => x.endsWith('.json'))) { try { visit(readJson(f)); } catch (e) { /* a file that is not a schema */ } }
  WORDS = w; return w;
}
export const pointer = (p) => String(p || '').split('/').slice(1).map((s) => { const k = s.replace(/~1/g, '/').replace(/~0/g, '~'); return /^\d{1,6}$/.test(k) || schemaWords().has(k) ? k : '…'; }).join('.') || '(the file)';
export function schemaCheck({ reportDir, files: all, big: known }) {
  const findings = [], notChecked = [], big = [], seen = (known || []).concat(big);
  const files = all.filter((f) => /\.(json|pbir)$/i.test(f) || path.basename(f) === '.platform');
  let checked = 0, errors = 0; const missing = new Map();
  for (const f of files) {
    let j; try { j = readJson(f); } catch (e) { if (e instanceof TooBig && !seen.some((b) => b.file === rel(reportDir, f))) { const b = { file: rel(reportDir, f), size: e.size }; big.push(b); seen.push(b); } continue; }
    const s = j && typeof j.$schema === 'string' ? j.$schema : null;
    if (!s) continue;
    // (A4-14, audit 4: only a whole bundled schema file, never a fragment or a query the report chose: a fragment
    // compiles a sub-schema the file picked, and the file would count as checked with 0 errors)
    const whole = SCHEMA_FILE.test(s);
    const validate = whole ? ajv().getSchema(s) : null;
    const key = !whole && /[#?]/.test(s) ? 'a schema address with a fragment or a query (only whole schema files are used)' : s.startsWith(SCHEMA_ROOT) && family(s) && ver(s) ? `${family(s)} ${ver(s)}` : /reportThemeSchema/.test(s) ? 'the report theme schema' : 'a schema from another address';
    if (!validate) { missing.set(key, (missing.get(key) || 0) + 1); continue; }
    checked++;
    if (!validate(j)) {
      errors++;
      const es = validate.errors || [], first = es[0] || {};
      findings.push({ origin: 'schema', rule: 'SCHEMA', severity: 'error', file: rel(reportDir, f), page: null, visual: null,
        what: `${es.length} schema error${es.length === 1 ? '' : 's'}; the first at ${pointer(first.instancePath)}: ${maskValues(first.message).slice(0, 120)}`,
        fix: 'Correct the file to the schema it names (in Power BI Desktop: open and save the report, which writes valid files), or name the schema version the file is written for.',
        source: `Microsoft's JSON schema ${family(s)}/${ver(s)} (bundled: microsoft/json-schemas ${SCHEMA_COMMIT})` });
    }
  }
  for (const [k, n] of missing) notChecked.push({ rule: 'SCHEMA', why: `${n} file${n === 1 ? '' : 's'} name ${k}, which is not bundled (newer than the copy of ${SCHEMA_COMMIT}, or not one of Microsoft's report schemas); the validator's own checks still ran on them` });
  return { checked, errors, findings, notChecked, big };
}
