// The made-up "AI-built" page of OX1 (mcp/work/OX1.md, its table P1 to P5): six visuals that validate and draw on Souq
// (hx1-souq.mjs), three of them asking what Souq cannot answer. One place for the suites that use it (ox1, ox2).
import { souqReport, colRef, msrRef } from './hx1-souq.mjs';

// ---- the made-up "AI-built" page: six visuals that validate and draw, three of them asking what Souq cannot answer
export const S = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
export const visual = (name, visualType, roles) => ({ path: `definition/pages/ai/visuals/${name}/visual.json`,
  json: { $schema: S + 'visualContainer/2.1.0/schema.json', name, position: { x: 0, y: 0, z: 0, width: 300, height: 200 }, visual: { visualType, query: { queryState: Object.fromEntries(Object.entries(roles).map(([r, l]) => [r, { projections: l }])) } } } });
export const aiReport = (more) => { const r = souqReport(); r.files.push({ path: 'definition/pages/ai/page.json', json: { $schema: S + 'page/2.0.0/schema.json', name: 'ai', displayName: 'AI page', width: 1280, height: 720 } },
  visual('bar-target-by-region', 'clusteredBarChart', { Category: [colRef('Store', 'Region')], Y: [msrRef('Target')] }),
  visual('table-staff-revenue', 'tableEx', { Values: [colRef('Staff', 'Name'), msrRef('Revenue'), msrRef('Headcount')] }),
  visual('column-headcount-by-category', 'clusteredColumnChart', { Category: [colRef('Product', 'Category')], Y: [msrRef('Headcount')] }),
  visual('bar-headcount-by-city', 'clusteredBarChart', { Category: [colRef('Store', 'City')], Y: [msrRef('Headcount')] }),
  visual('card-ghost', 'card', { Values: [msrRef('Net Sales')] }),
  visual('line-returns-by-month', 'lineChart', { Category: [colRef('Calendar', 'Month')], Y: [msrRef('Returns Value')] }),
  ...(more || [])); return r; };
