#!/usr/bin/env node
// DataArcus MCP server: the engines behind dataarcus.com's Power BI tools, for an AI agent.
// Pairs with Microsoft's Power BI Authoring MCP server (model edits, DAX) and the Desktop bridge (reload, screenshots).
// Every path stays inside DATAARCUS_ROOT (default: the folder the server starts in), and nothing is ever overwritten.
import fs from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Bind, Health, Pbip, ROOT, inside, loadModel, summary } from './lib/model.mjs';

const server = new McpServer({ name: 'dataarcus', version: '0.1.0' });
const text = (o) => ({ content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o, null, 2) }] });
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: String(e && e.message || e) }] });
const safe = (fn) => async (args) => { try { return await fn(args); } catch (e) { return fail(e); } };
const modelPath = z.string().describe('A Power BI project folder, its .SemanticModel folder, a model.bim or a .pbit, relative to the DataArcus folder');

server.registerTool('read_model', {
  title: 'Read a Power BI model',
  description: 'Lists the tables, visible columns (with types), measures (with formats) and date tables of a model, without changing it.',
  inputSchema: { path: modelPath }
}, safe(async ({ path: p }) => { const m = loadModel(p); return text({ source: m.source, existingReports: m.taken || [], tables: summary(m) }); }));

server.registerTool('suggest_fields', {
  title: 'Suggest fields for a report design',
  description: 'Picks which of the model\'s measures and columns go in each KPI card, chart, table and slicer, the way the DataArcus theme generator does (base measures first, month from the date table, no keys or hidden fields).',
  inputSchema: { path: modelPath, kpis: z.number().int().min(1).max(8).default(4).describe('Number of KPI cards') }
}, safe(async ({ path: p, kpis }) => { const m = loadModel(p); const b = Bind.suggest(m.tables, kpis); delete b.choices; return text(b); }));

server.registerTool('check_model_health', {
  title: 'Check model health',
  description: 'Runs the DataArcus Model Health Check: score, and every finding with the objects it concerns (unused columns and measures, risky relationships, slow DAX, date tables...). Needs a model.bim or .pbit (TMDL-only projects: export a .pbit first).',
  inputSchema: { path: modelPath, maxItems: z.number().int().min(1).max(200).default(15).describe('Objects listed per finding') }
}, safe(async ({ path: p, maxItems }) => {
  const m = loadModel(p);
  if (!m.tmsl) throw new Error('This project stores its model as TMDL files. In Power BI Desktop use File > Export > Power BI template, and check the .pbit.');
  const r = Health.analyze(m.tmsl, m.report);
  return text({
    source: m.source, score: r.score, stats: r.stats, reportRead: !!m.report,
    findings: r.findings.map((f) => { const rule = Health.RULES[f.id] || {}; const en = rule.en || [f.id, '', ''];
      return { id: f.id, severity: rule.sev, category: rule.cat, title: en[0], why: en[1], fix: en[2], count: f.items.length, items: f.items.slice(0, maxItems) }; })
  });
}));

const slot = z.object({
  kind: z.enum(['title', 'logo', 'kpi', 'card', 'line', 'bar', 'column', 'donut', 'table', 'gauge', 'funnel', 'treemap', 'map', 'slicer', 'text']),
  title: z.string().optional(), x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive()
});
server.registerTool('create_report', {
  title: 'Create a report project for an existing model',
  description: 'Writes a new Power BI report (PBIR) next to the user\'s model: every visual placed, bound to the model\'s fields (suggested, or given), theme and background applied. The model and any existing report are never touched; the new report gets a free name. Open the new .pbip in Power BI Desktop afterwards (or reload it with the Desktop bridge).',
  inputSchema: {
    path: modelPath.describe('The project folder or .SemanticModel folder the report will use'),
    name: z.string().min(1).max(60).describe('Report name'),
    pages: z.array(z.object({ name: z.string(), width: z.number().int().default(1920), height: z.number().int().default(1080), slots: z.array(slot).min(1),
      background: z.string().optional().describe('PNG file for the page background, inside the DataArcus folder') })).min(1),
    theme: z.string().optional().describe('Theme JSON file (e.g. from the DataArcus theme generator), inside the DataArcus folder'),
    lang: z.enum(['en', 'ar']).default('en'), rtl: z.boolean().default(false), font: z.string().default('Segoe UI'),
    colors: z.object({ text: z.string(), card: z.string(), background: z.string(), accent: z.string() }).partial().optional()
  }
}, safe(async (a) => {
  const m = loadModel(a.path);
  if (!m.folder) throw new Error('create_report needs a project folder with a .SemanticModel (save the .pbix as a Power BI project first).');
  const png1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const theme = a.theme ? JSON.parse(fs.readFileSync(inside(a.theme), 'utf8')) : { name: a.name };
  const kpis = a.pages.reduce((n, p) => Math.max(n, p.slots.filter((s) => s.kind === 'kpi').length), 0) || 1;
  const r = Pbip.build({
    name: a.name, title: a.name, lang: a.lang, rtl: a.rtl, font: a.font, sample: false, logo: null, theme,
    ui: Object.assign({ text: '#1f2937', card: '#ffffff', background: '#f3f4f6', accent: '#0f6cbd' }, a.colors || {}),
    model: { byPath: path.basename(m.folder), taken: m.taken }, bind: Bind.suggest(m.tables, kpis),
    texts: { by: a.lang === 'ar' ? 'حسب' : 'by', newDesign: a.lang === 'ar' ? 'تصميم جديد' : 'New design' },
    pages: a.pages.map((p) => ({ name: p.name, page: { w: p.width, h: p.height }, slots: p.slots, panel: null, png: p.background ? fs.readFileSync(inside(p.background)) : png1 }))
  });
  // write next to the model; refuse to replace anything that already exists
  const clash = r.files.map((f) => path.join(m.projectDir, f.path)).filter((f) => fs.existsSync(f));
  if (clash.length) throw new Error(`Not written: ${clash.length} files already exist, e.g. ${clash[0]}`);
  r.files.forEach((f) => { const out = path.join(m.projectDir, f.path); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, f.data); });
  return text({ written: r.files.length, open: path.join(m.projectDir, r.base + '.pbip'), report: r.base + '.Report', model: path.basename(m.folder) });
}));

await server.connect(new StdioServerTransport());
console.error(`DataArcus MCP ready. Folder: ${ROOT}`);
