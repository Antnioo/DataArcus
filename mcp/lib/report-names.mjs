// The report names already in use beside a model, so a new report never takes one (the writer's side: A1-9, the audit
// of the reading block moved this out of the model reader). An X.Report folder and its X.pbip count once. Links are
// listed by name too (a name is taken whatever is there).
import fs from 'node:fs';

export function takenNames(projectDir) {
  if (!projectDir) return [];
  let names = [];
  try { names = fs.readdirSync(projectDir); } catch (e) { return []; }
  return [...new Set(names.filter((n) => /\.(Report|pbip)$/i.test(n)).map((n) => n.replace(/\.(Report|pbip)$/i, '')))];
}
