// The owner's check of 0.3.0 step 1, "Preview before Approve": the approval window of three golden test models, as the
// person sees it (plan_layout with the model, then approve_plan opens the window; its page is shot in Chromium, the
// preview part at full size). Not part of the MCP or its tests: it uses the repo root's playwright-core.
//   node mcp/work/preview-samples/make.mjs      (writes the PNGs next to this file; nothing is approved or written)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from '../../test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..', '..');
const { chromium } = createRequire(path.join(MCP, '..', 'package.json'))('playwright-core');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-samples-')), log = path.join(ROOT, 'links.txt');
const cp = (from, to) => fs.cpSync(path.join(MCP, from), path.join(ROOT, to), { recursive: true });
cp('test-models/arabic-long-names', 'arabic'); cp('fixtures/health-project', 'health');
cp('test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
const CASES = [
  { file: 'arabic-long-names-ar-exec.png', plan: { path: 'arabic', lang: 'ar', layout: 'exec', name: 'تقرير المبيعات', title: 'تقرير المبيعات' } },
  { file: 'health-project-en-analysis.png', plan: { path: 'health', layout: 'analysis', name: 'Health Sample', title: 'Health Sample' } },
  { file: 'large-synthetic-en-ops.png', plan: { path: 'large', layout: 'ops', focus: 'logistics', name: 'Logistics', title: 'Logistics' } }
];
const exe = ['/opt/pw-browsers/chromium', process.env.CHROME_PATH].find((p) => p && fs.existsSync(p));
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '0' });
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
try {
  for (const [k, c] of CASES.entries()) {
    const pl = await s.call('plan_layout', c.plan);
    if (pl.err || !pl.j.plan) throw new Error(`${c.file}: no plan: ${pl.t.slice(0, 300)}`);
    await s.call('approve_plan', { planId: pl.j.plan.planId });
    let link = ''; for (let i = 0; i < 100 && !link; i++) { await new Promise((r) => setTimeout(r, 50)); link = (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : [])[k] || ''; }
    const pg = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
    await pg.goto(link);
    await pg.locator('.preview').screenshot({ path: path.join(HERE, c.file) });
    await pg.close();
    console.log(path.join(HERE, c.file));
  }
} finally { await browser.close(); await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }
