// One helper for the model additions create_report writes as TMDL scripts next to the project (0.3.0: L3's metric
// switcher, L4's flip cards). The model is never changed by DataArcus: each script is a file of the report's one write
// ("<report> - <option>.tmdl", in the plan's digest), applied by the user in TMDL view. Shared here, never copied: the
// free names (checked against every table, measure and column of the model, add_gulf_calendar's list) and the lineage
// tags (the same for the same plan, so a rebuild gives the same bytes). Model names are untrusted: compared, never followed.
import crypto from 'node:crypto';
import { takenNames, nameKey } from './gulf-calendar.mjs';

export { takenNames, nameKey };

/** A lineage tag per object, from the plan's seed (a UUID v4 shape from sha256). */
export const tagOf = (seed, what) => { const h = crypto.createHash('sha256').update(String(seed) + '\0' + what).digest('hex').split('');
  h[12] = '4'; h[16] = '89ab'[parseInt(h[16], 16) % 4]; return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20, 32)].map((p) => p.join('')).join('-'); };

/** The script's file, next to the project: "<report base><suffix>.tmdl". */
export const scriptFileOf = (base, suffix) => base + suffix + '.tmdl';

/** A name giver for new objects: never a name the model has (raw: the model's tables) nor one already given ("x 2"...). */
export function freeNamer(raw) {
  const taken = takenNames(raw || []), given = new Set();
  return (want) => { let n = want; for (let k = 2; taken.has(nameKey(n)) || given.has(nameKey(n)); k++) n = `${want} ${k}`; given.add(nameKey(n)); return n; };
}
