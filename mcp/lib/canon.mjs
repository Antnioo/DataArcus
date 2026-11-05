// (0.3.2 DD2C; the owner, D-1104-12: one job, one place) the canonical text of a plan, written once: before DD2C
// artifact.mjs (the binding of a plan to its click, the model's print) and plans.mjs (the gate's comparison of a
// write's inputs with the plan's pins) each held the same line (docs/CONTRACTS.md family canon).
// canon(v): JSON with every object's keys sorted and undefined left out of objects (an array keeps its order, its
// undefined written null; undefined at the top is null), so the same values always give the same text and digest.
export const canon = (v) => JSON.stringify(v === undefined ? null : v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().filter((key) => x[key] !== undefined).map((key) => [key, x[key]])) : x));
