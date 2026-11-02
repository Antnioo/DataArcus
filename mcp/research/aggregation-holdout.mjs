// B-146's holdout: classify every measure of the repo's fixtures and 18 public Microsoft models (shallow clones of
// microsoft/Analysis-Services, microsoft/fabric-samples and microsoft/fabric-toolbox in <folder>; the COVID .pbit is in
// the repo) and print every non_additive and semi_additive call with its evidence. Metadata only; never in npm test.
//   node aggregation-holdout.mjs ms|own|all <folder of the clones>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const Agg = require('../../assets/js/aggregation.js');
const { loadModel, modelOf } = await import('../lib/model.mjs');
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..', '..'), MS = process.argv[3] || path.join(REPO, '..', 'ms');
const ms = [
  [MS, 'Analysis-Services/SetUpAggs/AdventureWorksAggsProvider/Model.bim'], [MS, 'Analysis-Services/SetUpAggs/AW Internet Sales/Model.bim'],
  [MS, 'Analysis-Services/pbidevmode/fabricps-pbip/SamplePBIP'], [MS, 'Analysis-Services/AsPartitionProcessing/AsPartitionProcessing.AdventureWorks/Model.bim'],
  [MS, 'fabric-samples/docs-samples/data-science/enrich-powerbi-report-with-machine-learning/Bank Customer Churn Analysis/Bank Customer Churn Analysis'],
  [MS, 'fabric-toolbox/monitoring/workspace-monitoring-dashboards/Fabric Workspace Monitoring Report.pbit'], [MS, 'fabric-toolbox/monitoring/fabric-platform-monitoring/gateway/PBI Report/Gateway Monitor.pbit'],
  [MS, 'fabric-toolbox/monitoring/fabric-platform-monitoring/src/Gateway/Gateway Monitoring.SemanticModel'], [MS, 'fabric-toolbox/monitoring/fabric-spark-monitoring/src/SparkMonitoring.SemanticModel'],
  [MS, 'fabric-toolbox/monitoring/query-capacity-correlation/Template/Query Capacity Correlation.SemanticModel'],
  ...['FUAM_Core_SM', 'FUAM_Item_SM', 'FUAM_Semantic_Model_Meta_Data_Analyzer_SM', 'FUAM_SQL_Endpoint_Analyzer_SM', 'FUAM_Gateway_Monitoring_From_Files_SM'].map((n) => [MS, `fabric-toolbox/monitoring/fabric-unified-admin-monitoring/src/${n}.SemanticModel`]),
  [MS, 'fabric-toolbox/monitoring/fabric-cost-analysis/src/FCA_Core_SM.SemanticModel'], [MS, 'fabric-toolbox/tools/SemanticModelAudit/report/SemanticModelAudit.pbit'],
  [REPO, 'scripts/tests/fixtures/microsoft/COVID-19 US Tracking Sample.pbit']];
// the repo's own fixtures: every model folder / .pbit / model.bim under the fixture folders
const own = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name);
  if (e.isDirectory() && /\.SemanticModel$|\.Dataset$/.test(e.name)) own.push([REPO, path.relative(REPO, f)]); else if (e.isDirectory() && e.name !== 'node_modules') walk(f); else if (/\.pbit$|^model\.bim$/i.test(e.name) && !/\.SemanticModel/.test(d)) own.push([REPO, path.relative(REPO, f)]); } };
['mcp/fixtures', 'mcp/test-models', 'scripts/tests/fixtures/model-health', 'assets/data'].forEach((d) => walk(path.join(REPO, d)));
const which = process.argv[2] || 'all', rows = [], counts = { models: 0, measures: 0, non: 0, semi: 0, semiAsk: 0, unknown: 0 };
for (const [root, rel] of (which === 'ms' ? ms : which === 'own' ? own : [...own, ...ms])) {
  let m; try { m = loadModel(rel, { root }); } catch (e) { rows.push(`!! ${rel}: ${e.message}`); continue; }
  counts.models++;
  const mt = modelOf(m.tmsl).tables || [], measures = mt.flatMap((t) => (t.measures || []).map((x) => ({ table: t.name, name: x.name, expression: x.expression, formatString: x.formatString })));
  for (const x of measures) { counts.measures++; const r = Agg.classify(x, { measures, tables: mt });
    if (r.class === 'unknown') { counts.unknown++; continue; }
    if (r.class === 'non_additive') counts.non++; else { counts.semi++; if (!r.timeHandled) counts.semiAsk++; }
    const dax = (Array.isArray(x.expression) ? x.expression.join(' ') : String(x.expression || '')).replace(/\s+/g, ' ').slice(0, 150);
    rows.push([path.basename(rel), x.name, r.class + (r.timeHandled === false ? ' (ask)' : r.timeHandled ? ' (handled)' : ''), r.confidence, r.evidence.map((e) => e.kind + ': ' + e.says).join('; ')].join('\t')); void dax; }
}
console.log(JSON.stringify(counts)); rows.forEach((r) => console.log(r));
