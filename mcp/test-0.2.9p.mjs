// 0.2.9 audit fixes, the field picker's block (the owner: every audit finding fixed before the beta; builder 7's
// audits mcp/work/audit-3-picker-writer.md and audit-6-mcp-tools.md on fix/0.2.9-checks). Written red first, in
// batches, one commit per item. Ordinary names (retail, HR, French), none of the portfolio's.
// test.mjs runs it with its own client (import { v029p }); run alone it starts the server itself:
//   node test-0.2.9p.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);

export async function v029p({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
  const ms = (name, expression, formatString) => Object.assign({ name, expression }, formatString ? { formatString } : {});
  const model = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
  const B = req('../assets/js/pbip-bind.js');
  const tablesOf = (tables) => B.fromTmsl({ model: { tables } });

  // ---------- A6-15: a month column without a sort column is noted, by the picker's facts, not a word list ----------
  model('p-news', [
    { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Month Announced', 'string'), col('Year', 'int64')] },
    { name: 'Releases', partitions: mp('Releases'), columns: [col('Released', 'dateTime'), col('Channel', 'string')], measures: [ms('Releases', 'COUNTROWS ( Releases )', '#,0')] }],
    [{ name: 'r', fromTable: 'Releases', fromColumn: 'Released', toTable: 'Calendar', toColumn: 'Date' }]);
  {
    const pl = await ask('plan_layout', { layout: 'exec', path: 'p-news' });
    const x = await ask('create_report', { path: 'p-news', name: 'P news', design: pl.j && pl.j.design, fields: { kpis: ['Releases[Releases]'], measure: 'Releases[Releases]', timeAxis: 'Calendar[Month Announced]', category: 'Releases[Channel]' }, noDataMessage: false, secondPage: false });
    chk(() => !x.err && (x.j.modelNotes || []).some((n) => n.field === 'Calendar[Month Announced]'), () => `A6-15: "Month Announced" (a month text with no sort-by column) must be noted: ${JSON.stringify(x.j && x.j.modelNotes)} ${short(x)}`);
  }

  // ---------- A3-5: a time variant is never a headline before a base measure; an average is no variant ----------
  {
    const t = tablesOf([{ name: 'Sales', columns: [col('Amount', 'double'), col('Order', 'string'), col('Region', 'string')],
      measures: [ms('Sales LY', 'CALCULATE ( [Total Sales], SAMEPERIODLASTYEAR ( Sales[Date] ) )', '#,0'), ms('Average Order Value', 'DIVIDE ( [Total Sales], [Total Orders] )', '#,0.00'),
        ms('Total Sales', 'SUM ( Sales[Amount] )', '#,0'), ms('Total Orders', 'DISTINCTCOUNT ( Sales[Order] )', '#,0')] }]);
    const k = B.suggest(t, 3).kpis.filter(Boolean).map((x) => x.m);
    chk(() => k.length === 3 && !k.includes('Sales LY') && k.includes('Average Order Value'), () => `A3-5: 3 cards must be the base measures (Average Order Value is no variant), never Sales LY first: ${JSON.stringify(k)}`);
    const k4 = B.suggest(t, 4).kpis.filter(Boolean).map((x) => x.m);
    chk(() => k4[3] === 'Sales LY', () => `A3-5: a variant comes after every base measure: ${JSON.stringify(k4)}`);
  }

  // ---------- A3-6: the rank by shape first, in any language; a measure the others build on ranks higher ----------
  {
    const t = tablesOf([{ name: 'Ventes', columns: [col('Montant', 'double'), col('Commande', 'string'), col('Ville', 'string')],
      measures: [ms('Indice de satisfaction', 'AVERAGE ( Ventes[Montant] ) / 10', '0.0'), ms('Taux de conversion', 'DIVIDE ( [Nombre de commandes], 1000 )', '0.0%'),
        ms('Panier moyen', 'DIVIDE ( [Chiffre d\'affaires], [Nombre de commandes] )', '#,0.00'),
        ms('Chiffre d\'affaires', 'SUM ( Ventes[Montant] )', '"EUR" #,0'), ms('Nombre de commandes', 'DISTINCTCOUNT ( Ventes[Commande] )', '#,0')] }]);
    const k = B.suggest(t, 3).kpis.filter(Boolean).map((x) => x.m);
    chk(() => k[0] === 'Chiffre d\'affaires' && k[1] === 'Nombre de commandes', () => `A3-6: a French model: the plain sum and count first (no English word helps): ${JSON.stringify(k)}`);
    const src = fs.readFileSync(path.join(REPO, 'assets/js/pbip-bind.js'), 'utf8');
    chk(() => /const TIEBREAK_WORDS = /.test(src) && !/const MAIN = /.test(src), () => 'A3-6: the name words are one named tie-break list (TIEBREAK_WORDS), not a main rank');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029p-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029p({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029p  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029p  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
