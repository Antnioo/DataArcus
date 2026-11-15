// content/ARABIC-GLOSSARY.md is the term sheet rendered (0.3.3 AR7, the owner D-1112-05; one source, D-1104-12):
// assets/data/arabic-report-words.json `concepts`, through mcp/lib/arabic-terms.mjs glossaryMd (node:fs only).
//   node scripts/arabic-glossary.mjs           checks the file is the sheet rendered (exit 1 when it differs)
//   node scripts/arabic-glossary.mjs --write   writes it
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONCEPTS, glossaryMd } from '../mcp/lib/arabic-terms.mjs';

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content', 'ARABIC-GLOSSARY.md');
const want = glossaryMd();
if (process.argv.includes('--write')) { fs.writeFileSync(FILE, want); console.log(`PASS  arabic-glossary  ${CONCEPTS.length} checks (written)`); process.exit(0); }
const have = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n') : '';
if (have !== want) { console.log('FAIL script=arabic-glossary cause=content/ARABIC-GLOSSARY.md is not the sheet rendered: run node scripts/arabic-glossary.mjs --write'); console.log(`FAIL  arabic-glossary  1 of ${CONCEPTS.length} checks`); process.exit(1); }
console.log(`PASS  arabic-glossary  ${CONCEPTS.length} checks`);
