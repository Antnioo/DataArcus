// The made-up "Time Lab" model (0.3.2 PF1, the laptop's look032 C; PF2 reuses it): Sales (FiscalYear, Qtr, Amount,
// measure Total Sales) and «المبيعات» («شهر» sorted by «رقم الشهر», «المبلغ», measure «إجمالي المبيعات»), no
// relationship. Made-up names only (no employer data); no rows.
//   timeLab(root, dir, extra) writes <root>/<dir>/Time Lab.SemanticModel/model.bim; extra: more Sales measures
import fs from 'node:fs';
import path from 'node:path';

const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
export function timeLab(root, dir, extra) {
  fs.mkdirSync(path.join(root, dir, 'Time Lab.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(root, dir, 'Time Lab.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('FiscalYear', 'string'), col('Qtr', 'string'), col('Amount', 'double', { summarizeBy: 'sum' })],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }].concat(extra || []) },
    { name: 'المبيعات', partitions: mp('المبيعات'), columns: [col('شهر', 'string', { sortByColumn: 'رقم الشهر' }), col('رقم الشهر', 'int64'), col('المبلغ', 'double', { summarizeBy: 'sum' })],
      measures: [{ name: 'إجمالي المبيعات', expression: "SUM ( 'المبيعات'[المبلغ] )", formatString: '#,0' }] }] } }));
}
