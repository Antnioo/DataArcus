// TR2 ask 3: refresh mcp/lab/schemas/ from Microsoft's published schemas (the weekly job, .github/workflows/schemas-refresh.yml,
// and by hand: `node lab/refresh-schemas.mjs [--write]`). It validates the made-up lab report with the live network, records
// every schema URL the validator asked for, and compares each with the saved copy. Without --write it only says which differ
// (exit 1 when any differs, so the weekly job shows it); with --write it saves them and rewrites schemas/pins.json.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
process.env.DATAARCUS_SCHEMA_LIVE = '1';   // set before the import: schema-offline.mjs patches https.get unless this is 1
const { fileOf, SAVED } = await import('./schema-offline.mjs');
import * as Lab from './custom-visuals-lab.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'schemas-'));
const rec = path.join(tmp, 'rec.mjs'), urls = path.join(tmp, 'urls.txt');
fs.writeFileSync(rec, `import https from 'node:https'; import fs from 'node:fs'; const g = https.get;\nhttps.get = function (u) { fs.appendFileSync(${JSON.stringify(urls)}, String(u) + '\\n'); return g.apply(this, arguments); };\n`);
const lab = Lab.writeLab(path.join(tmp, 'lab'));
const cli = path.join(HERE, '../node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
const r = spawnSync(process.execPath, ['--import', rec, cli, 'validate', lab.report, '--format', 'json'], { encoding: 'utf8', env: { ...process.env, DATAARCUS_SCHEMA_LIVE: '1' } });
const asked = [...new Set(fs.existsSync(urls) ? fs.readFileSync(urls, 'utf8').split('\n').filter(Boolean) : [])].sort();
if (!asked.length) { console.error('FAIL  the validator asked for no schema URL: ' + r.stdout.slice(0, 300)); process.exit(2); }
const get = (u) => new Promise((ok, no) => https.get(u, { timeout: 20000 }, (res) => { const c = []; res.on('data', (d) => c.push(d)); res.on('end', () => (res.statusCode === 200 ? ok(Buffer.concat(c)) : no(new Error(u + ' -> ' + res.statusCode)))); }).on('error', no));
let changed = 0; const pins = {};
for (const u of asked) {
  const live = await get(u), f = fileOf(u), had = fs.existsSync(f) ? fs.readFileSync(f) : null;
  const same = had && sha(had) === sha(live);
  if (!same) { changed++; console.log(`${had ? 'CHANGED' : 'NEW    '} ${u}`); if (WRITE) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, live); } }
  pins[u] = sha(WRITE ? live : (had || live));
}
if (WRITE) fs.writeFileSync(path.join(SAVED, 'pins.json'), JSON.stringify(pins, null, 2) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${changed ? (WRITE ? 'WROTE' : 'DIFF ') : 'SAME '}  ${asked.length} schemas, ${changed} ${WRITE ? 'saved' : 'differ from the saved copy'}`);
process.exit(changed && !WRITE ? 1 : 0);
