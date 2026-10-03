// Writes "Large Synthetic", a made-up Power BI project in TMDL: 300 tables and 3,000 columns, for the golden task
// on a large model (mcp/GOLDEN-TASKS.md, task 10) and for measuring how much the MCP's answers weigh.
// Every name is invented. Deterministic: the same files on every run (a fixed seed, no dates, no random ids).
//   node mcp/test-models/large-synthetic/generate.mjs
// Writes next to this script: Large Synthetic.SemanticModel/ (definition.pbism, definition/*.tmdl).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'Large Synthetic.SemanticModel');
const TABLES = 300, COLUMNS = 3000;

// a small seeded generator (mulberry32), so the model is the same on every run
let seed = 20261003;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const q = (n) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : `'${n.replace(/'/g, "''")}'`);

// business areas of a made-up group, each with its facts and its lookups (no real company, sector or client)
const AREAS = {
  Finance: { facts: ['GL Entries', 'Budget Lines', 'Forecast Lines', 'AP Invoices', 'AR Invoices', 'Payments', 'Fixed Asset Movements'], dims: ['Account', 'Cost Center', 'Legal Entity', 'Currency', 'Exchange Rate Type', 'Fiscal Period', 'Payment Term', 'Tax Code', 'Budget Version', 'Journal Type', 'Asset Class', 'Bank Account', 'Intercompany Partner', 'Profit Center', 'Account Group', 'Ledger', 'Dimension Set', 'Allocation Rule'] },
  People: { facts: ['Payroll Lines', 'Attendance', 'Leave Requests', 'Recruiting Pipeline', 'Training Sessions', 'Headcount Snapshot'], dims: ['Employee', 'Department', 'Job Title', 'Grade', 'Nationality', 'Contract Type', 'Leave Type', 'Pay Element', 'Recruiter', 'Requisition', 'Course', 'Trainer', 'Shift', 'Work Location', 'Termination Reason', 'Performance Rating', 'Manager', 'Visa Status'] },
  Procurement: { facts: ['Purchase Orders', 'Purchase Receipts', 'Supplier Invoices', 'Contracts', 'Spend Lines'], dims: ['Supplier', 'Supplier Category', 'Buyer', 'Purchase Category', 'Incoterm', 'Contract Status', 'Approval Level', 'Sourcing Event', 'Supplier Rating', 'Commodity', 'Requester', 'PO Status', 'Delivery Term', 'Supplier Country'] },
  Inventory: { facts: ['Stock On Hand', 'Stock Movements', 'Cycle Counts', 'Replenishment Orders', 'Write Offs'], dims: ['Item', 'Item Group', 'Item Class', 'Unit Of Measure', 'Warehouse', 'Bin', 'Zone', 'Lot', 'Movement Type', 'ABC Class', 'Storage Condition', 'Count Reason', 'Write Off Reason', 'Brand', 'Item Status'] },
  Logistics: { facts: ['Shipments', 'Shipment Legs', 'Deliveries', 'Freight Costs', 'Returns'], dims: ['Carrier', 'Route', 'Port', 'Shipping Method', 'Delivery Status', 'Return Reason', 'Driver', 'Fleet Unit', 'Hub', 'Lane', 'Container Type', 'Customs Status', 'Delay Reason', 'Service Level'] },
  Commerce: { facts: ['Web Orders', 'Web Order Lines', 'Sessions', 'Cart Events', 'Promotions Applied', 'Subscriptions', 'Subscription Events'], dims: ['Customer', 'Customer Segment', 'Channel', 'Device', 'Browser', 'Landing Page', 'Product', 'Product Category', 'Promotion', 'Coupon', 'Plan', 'Churn Reason', 'Region', 'City', 'Country', 'Referrer', 'Payment Method', 'Order Status'] },
  Marketing: { facts: ['Campaign Spend', 'Leads', 'Email Sends', 'Social Posts', 'Survey Responses'], dims: ['Campaign', 'Campaign Type', 'Lead Source', 'Lead Status', 'Audience', 'Email Template', 'Social Network', 'Agency', 'Survey', 'Question', 'Content Type', 'Market', 'Persona', 'Funnel Stage'] },
  Service: { facts: ['Tickets', 'Ticket Events', 'Calls', 'Chats', 'SLA Breaches', 'CSAT Scores'], dims: ['Agent', 'Team', 'Queue', 'Ticket Category', 'Priority', 'Ticket Status', 'Resolution Code', 'SLA Policy', 'Call Outcome', 'Language', 'Escalation Level', 'Knowledge Article', 'Contact Reason', 'Customer Tier'] },
  Projects: { facts: ['Timesheets', 'Project Costs', 'Milestones', 'Resource Plans', 'Change Requests'], dims: ['Project', 'Project Type', 'Phase', 'Task', 'Resource', 'Role', 'Client Program', 'Portfolio', 'Billing Type', 'Risk', 'Change Type', 'Milestone Status', 'Sponsor', 'Practice'] },
  Production: { facts: ['Production Orders', 'Machine Events', 'Quality Inspections', 'Scrap', 'Energy Readings', 'Maintenance Orders'], dims: ['Plant', 'Line', 'Machine', 'Operator', 'Shift Pattern', 'Defect Type', 'Inspection Plan', 'Scrap Reason', 'Meter', 'Maintenance Type', 'Spare Kit', 'Recipe', 'Batch', 'Downtime Reason'] },
  Hospitality: { facts: ['Bookings', 'Room Nights', 'Guest Reviews', 'Events'], dims: ['Property', 'Room Type', 'Rate Plan', 'Booking Channel', 'Guest', 'Event Type', 'Venue', 'Review Site', 'Cancellation Reason', 'Meal Plan', 'Loyalty Tier', 'Source Market'] },
  Facilities: { facts: ['Work Orders', 'Space Usage', 'Utility Bills', 'Inspections'], dims: ['Building', 'Floor', 'Space', 'Asset', 'Vendor', 'Work Order Type', 'Utility', 'Inspection Type', 'Contractor', 'Lease', 'Cost Code', 'Occupancy Type'] }
};

// columns for a lookup table: its key, its name and a few attributes
const ATTRS = ['Code', 'Description', 'Group', 'Category', 'Type', 'Status', 'Owner', 'Region', 'Sort Order', 'Is Active', 'Valid From', 'Valid To', 'Short Name', 'Long Name', 'Level', 'Parent Code', 'External Id', 'Notes', 'Created By', 'Rank'];
const attrType = (a) => (/Sort Order|Level|Rank/.test(a) ? 'int64' : /Is Active/.test(a) ? 'boolean' : /Valid/.test(a) ? 'dateTime' : 'string');
// columns for a fact table: keys to its lookups, a date, amounts, quantities, flags
const AMOUNTS = ['Amount', 'Net Amount', 'Tax Amount', 'Cost', 'Discount', 'Quantity', 'Duration Minutes', 'Hours', 'Weight Kg', 'Value', 'Score', 'Count', 'Margin', 'Price', 'Units'];
const MEASURE_KINDS = [
  (t, c) => [`Total ${c}`, `SUM ( ${q(t)}[${c}] )`, '#,0'],
  (t, c) => [`Average ${c}`, `AVERAGE ( ${q(t)}[${c}] )`, '#,0.00'],
  (t) => [`${t} Count`, `COUNTROWS ( ${q(t)} )`, '#,0'],
  (t, c) => [`Total ${c} LY`, `CALCULATE ( [Total ${c}], SAMEPERIODLASTYEAR ( 'Calendar'[Date] ) )`, '#,0'],
  (t, c) => [`Total ${c} YoY %`, `DIVIDE ( [Total ${c}] - [Total ${c} LY], [Total ${c} LY] )`, '0.0%'],
  (t, c) => [`Total ${c} YTD`, `TOTALYTD ( [Total ${c}], 'Calendar'[Date] )`, '#,0'],
  (t, c) => [`Max ${c}`, `MAX ( ${q(t)}[${c}] )`, null],
  (t, c) => [`${c} Share %`, `DIVIDE ( [Total ${c}], CALCULATE ( [Total ${c}], ALL ( ${q(t)} ) ) )`, null]
];

// 1. the table list: the calendar, the facts, then lookups (area dims first, then numbered ones up to 300 tables)
const tables = [{ name: 'Calendar', kind: 'date', area: 'Shared' }];
Object.entries(AREAS).forEach(([area, a]) => a.facts.forEach((f) => tables.push({ name: f, kind: 'fact', area })));
const dimPool = [];
Object.entries(AREAS).forEach(([area, a]) => a.dims.forEach((d) => dimPool.push({ name: d, area })));
const usedNames = new Set(tables.map((t) => t.name));
for (const d of dimPool) { if (tables.length >= TABLES) break; if (!usedNames.has(d.name)) { usedNames.add(d.name); tables.push({ name: d.name, kind: 'dim', area: d.area }); } }
for (let n = 1; tables.length < TABLES; n++) { const area = pick(Object.keys(AREAS)); const name = `${area} Lookup ${String(n).padStart(3, '0')}`; tables.push({ name, kind: 'dim', area }); }
const dims = tables.filter((t) => t.kind === 'dim'), facts = tables.filter((t) => t.kind === 'fact');

// 2. columns: the calendar has 20, facts 12-20, lookups 4-10; then the counts are evened out to exactly 3,000
const calCols = [['Date', 'dateTime'], ['Year', 'int64'], ['Quarter', 'string'], ['Year Quarter', 'string'], ['Month Number', 'int64'], ['Month Name', 'string', 'Month Number'], ['Month Short', 'string', 'Month Number'], ['Year Month', 'string', 'Year Month Number'], ['Year Month Number', 'int64'], ['Day', 'int64'], ['Weekday Number', 'int64'], ['Day Name', 'string', 'Weekday Number'], ['Week Of Year', 'int64'], ['Is Weekend', 'boolean'], ['Fiscal Year', 'string'], ['Fiscal Quarter', 'string'], ['Fiscal Month Number', 'int64'], ['Hijri Year', 'int64'], ['Hijri Month Number', 'int64'], ['Is Ramadan', 'boolean']];
tables[0].columns = calCols.map(([name, type, sortBy]) => ({ name, type, sortBy, hidden: /Number$/.test(name) && name !== 'Hijri Month Number' }));
facts.forEach((t) => {
  const myDims = [...new Set(Array.from({ length: 4 + Math.floor(rnd() * 5) }, () => pick(dims.filter((d) => d.area === t.area).concat(pick(dims)))))];
  t.links = myDims;
  t.columns = [{ name: `${t.name.replace(/s$/, '')} Id`, type: 'int64', hidden: true }, { name: 'Date', type: 'dateTime', hidden: true }]
    .concat(myDims.map((d) => ({ name: `${d.name} Key`, type: 'int64', hidden: rnd() < 0.7, fk: d })));
  const amounts = [...AMOUNTS].sort(() => rnd() - 0.5).slice(0, 4 + Math.floor(rnd() * 6));
  amounts.forEach((a) => t.columns.push({ name: a, type: /Quantity|Count|Units/.test(a) ? 'int64' : rnd() < 0.5 ? 'decimal' : 'double', hidden: rnd() < 0.5 }));
  t.amounts = amounts;
});
dims.forEach((t) => {
  t.columns = [{ name: `${t.name} Key`, type: 'int64', hidden: true }, { name: t.name, type: 'string' }];
  [...ATTRS].sort(() => rnd() - 0.5).slice(0, 2 + Math.floor(rnd() * 7)).forEach((a) => t.columns.push({ name: `${t.name} ${a}`, type: attrType(a) }));
});
// even out to exactly COLUMNS: add attributes to lookups, or remove their last attributes
let total = tables.reduce((n, t) => n + t.columns.length, 0);
for (let i = 0; total < COLUMNS; i++) { const t = dims[i % dims.length]; const a = ATTRS.find((x) => !t.columns.some((c) => c.name === `${t.name} ${x}`)); if (a) { t.columns.push({ name: `${t.name} ${a}`, type: attrType(a) }); total++; } }
for (let i = 0; total > COLUMNS; i++) { const t = dims[i % dims.length]; if (t.columns.length > 3) { t.columns.pop(); total--; } }

// 3. measures on the facts, in display folders; about one in five without a format string, a few with descriptions.
// Measure names are unique in a model, so each starts with its table's name ("Shipments Total Cost"), and measures
// that refer to another measure use that full name.
facts.forEach((t) => {
  t.measures = [];
  const full = (n) => (n.startsWith(t.name + ' ') ? n : `${t.name} ${n}`);
  t.amounts.slice(0, 2).forEach((c) => MEASURE_KINDS.forEach((k) => {
    const [short, expr, fmt] = k(t.name, c), name = full(short);
    if (t.measures.some((m) => m.name === name)) return;
    t.measures.push({ name, expr: expr.replace(/\[(Total [^\]]+)\]/g, (s, n) => `[${full(n)}]`), fmt: rnd() < 0.2 ? null : fmt,
      folder: rnd() < 0.8 ? t.area : null, desc: rnd() < 0.15 ? `Made-up measure for the large test model (${t.area}).` : null });
  }));
});

// 4. write the TMDL files
const tmdlTable = (t) => {
  const out = [`table ${q(t.name)}`];
  if (t.kind === 'date') out.push('\tdataCategory: Time');
  out.push('');
  (t.measures || []).forEach((m) => {
    if (m.desc) out.push(`\t/// ${m.desc}`);
    out.push(`\tmeasure ${q(m.name)} = ${m.expr}`);
    if (m.fmt) out.push(`\t\tformatString: ${m.fmt}`);
    if (m.folder) out.push(`\t\tdisplayFolder: ${m.folder}`);
    out.push('');
  });
  t.columns.forEach((c) => {
    out.push(`\tcolumn ${q(c.name)}`, `\t\tdataType: ${c.type}`);
    if (c.hidden) out.push('\t\tisHidden');
    if (c.sortBy) out.push(`\t\tsortByColumn: ${q(c.sortBy)}`);
    if (t.kind === 'date' && c.name === 'Date') out.push('\t\tisKey');
    out.push(`\t\tsourceColumn: ${c.name}`, '');
  });
  out.push(`\tpartition ${q(t.name)} = m`, '\t\tmode: import', '\t\tsource =', '\t\t\t\tlet', `\t\t\t\t    Source = #table({${t.columns.map((c) => JSON.stringify(c.name)).join(', ')}}, {})`, '\t\t\t\tin', '\t\t\t\t    Source', '');
  return out.join('\n');
};
const fileName = (n) => n.replace(/[\\/:*?"<>|]/g, '_') + '.tmdl';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'definition', 'tables'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'definition.pbism'), JSON.stringify({ version: '4.0', settings: {} }, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'definition', 'database.tmdl'), 'database\n\tcompatibilityLevel: 1606\n');
fs.writeFileSync(path.join(OUT, 'definition', 'model.tmdl'), ['model Model', '\tculture: en-US', '\tdefaultPowerBIDataSourceVersion: powerBI_V3', '', ...tables.map((t) => `ref table ${q(t.name)}`), ''].join('\n'));
tables.forEach((t) => fs.writeFileSync(path.join(OUT, 'definition', 'tables', fileName(t.name)), tmdlTable(t)));
// relationships: every fact to the calendar and to its lookups (many to one, single direction)
const rels = [];
facts.forEach((t) => {
  rels.push([t.name, 'Date', 'Calendar', 'Date']);
  t.columns.filter((c) => c.fk).forEach((c) => rels.push([t.name, c.name, c.fk.name, `${c.fk.name} Key`]));
});
fs.writeFileSync(path.join(OUT, 'definition', 'relationships.tmdl'), rels.map(([ft, fc, tt, tc], i) => `relationship rel_${String(i + 1).padStart(4, '0')}\n\tfromColumn: ${q(ft)}.${q(fc)}\n\ttoColumn: ${q(tt)}.${q(tc)}\n`).join('\n'));

const measures = facts.reduce((n, t) => n + t.measures.length, 0);
console.log(`Large Synthetic: ${tables.length} tables (${facts.length} facts, ${dims.length} lookups, 1 calendar), ${tables.reduce((n, t) => n + t.columns.length, 0)} columns, ${measures} measures, ${rels.length} relationships -> ${path.relative(process.cwd(), OUT)}`);
