// One place for the split guards (0.3.3 SG2, D-1104-12): the pure shared files the CONTRACTS.md ledger names.
// The ledger's table has a last column ("newest copy", the "One place" column) whose rows say
// "one place since <job>: `assets/js/<file>.js` `name`". This reads those rows and returns the file paths named there,
// never a typed list. sp10 P10, sp30 K2 and sp42 P2 accept any of them as a require or import of a pure module.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const LEDGER = path.join(HERE, 'docs', 'CONTRACTS.md');

// text: the ledger's text (default: read from mcp/docs/CONTRACTS.md). Returns a Set of 'assets/js/<file>.js'.
export function pureSharedFiles(text = fs.readFileSync(LEDGER, 'utf8')) {
  const out = new Set();
  for (const row of String(text).split('\n')) {
    if (!row.startsWith('|')) continue;
    const cell = row.split('|').slice(1, -1).pop() || '';
    if (!/^\s*one place since [^:]*:/.test(cell)) continue;
    for (const m of cell.matchAll(/`(assets\/js\/[A-Za-z0-9_.-]+\.js)`/g)) out.add(m[1]);
  }
  return out;
}

// the ways a guard spells a pure shared file as a require or import: './x.js' (inside assets/js) and '../../assets/js/x.js'
export const asSibling = (f) => './' + f.slice('assets/js/'.length);
export const fromLib = (f) => '../../' + f;
