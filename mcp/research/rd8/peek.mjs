// RD8: where the English page's Arabic letters are, and which extension measures differ (made-up, os.tmpdir())
import '../../test-env.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..', '..');
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'rd8-peek-'))); process.env.DATAARCUS_ROOT = ROOT;
const { sampleFiles } = await import('../../lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const { serverClient } = await import('../../test-0.2.9.mjs'); const { reportRun } = await import('../../lib/report-run.mjs');
const s = await serverClient(ROOT, {});
const build = async (a) => { let p = (await s.call('plan_layout', a)).j; if (a.lang === 'ar') { a.displayNames = Object.assign({}, p.arabicNames.inThePlan || {}, p.arabicNames.suggestedDisplayNames || {}); p = (await s.call('plan_layout', a)).j; } return reportRun(Object.assign({}, a, { design: p.design }), 'build'); };
const en = await build({ name: 'E', path: 'S/Gulf Retail.pbip', page: '1280x720', layout: 'exec', kpis: 2, lang: 'en' });
en.files.filter((f) => /visual\.json$|page\.json$/.test(f.path)).forEach((f) => { const t = String(f.data), m = t.match(/"[^"]*[؀-ۿ][^"]*"/g); if (m) console.log('EN', f.path.split('/').slice(-3).join('/'), m.slice(0, 2).map((x) => x.slice(0, 60))); });
const a1 = await build({ name: 'A1', path: 'S/Gulf Retail.pbip', page: '1280x720', layout: 'ops', kpis: 3, lang: 'ar' });
const a2 = await build({ name: 'A2', path: 'S/Gulf Retail.pbip', page: '1280x720', layout: 'exec', kpis: 2, lang: 'ar' });
const ext = (b) => JSON.parse(String(b.files.find((f) => /reportExtensions\.json$/.test(f.path)).data));
const m1 = new Map(ext(a1).entities.flatMap((e) => e.measures.map((m) => [e.name + '.' + m.name, m]))), m2 = ext(a2).entities.flatMap((e) => e.measures.map((m) => [e.name + '.' + m.name, m]));
m2.forEach(([k, m]) => { const o = m1.get(k); if (o && JSON.stringify(o) !== JSON.stringify(m)) console.log('DIFF', k, '\n  was', o.expression.slice(0, 160), '\n  new', m.expression.slice(0, 160)); });
await s.close(); fs.rmSync(ROOT, { recursive: true, force: true });
