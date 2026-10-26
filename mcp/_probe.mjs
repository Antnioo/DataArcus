import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'nc2p-')); process.env.DATAARCUS_ROOT = T;
const Lab = await import('./lab/custom-visuals-lab.mjs'); Lab.writeLab(path.join(T, 'lab'));
const { loadModel } = await import('./lib/model.mjs'); const { planNative } = await import('./lib/native-copy.mjs'); const { axesOf } = await import('./lib/report-fields.mjs');
const m = loadModel('lab'); const ax = axesOf(m, [{ measures: ['Sales[Total Sales]', 'Sales[Sales Target]'], answer: 'comparable' }, { measures: ['Sales[Total Sales]', 'Sales[Sales LY]'], answer: 'comparable' }]);
const P = planNative('lab/Gulf Retail.Report', m, ax);
console.log(P.answer.confidence.lead); for (const r of P.answer.replacements) console.log('\n' + r.line + '\n  ' + r.confidence + ' | ' + r.evidence + '\n  - ' + r.lost.join('\n  - ') + (r.second ? '\n  SECOND ' + JSON.stringify(r.second) : ''));
fs.rmSync(T, { recursive: true, force: true });
