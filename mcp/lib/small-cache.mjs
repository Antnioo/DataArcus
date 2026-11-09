// (0.3.2 DD2P; the owner, D-1104-12: one job, one place) the MCP's small cache, written once: before DD2P
// glass-picture.mjs and page-picture.mjs each held a copy that answered the same (docs/CONTRACTS.md family lru).
// lru(max): { get(k), set(k, v) } over a Map; get answers undefined for a key not kept and makes a kept key the newest;
// set replaces a key (it becomes the newest) and, with max keys kept, drops the oldest first. Nothing else is kept.
export const lru = (max) => { const m = new Map(); return { get: (k) => { if (!m.has(k)) return undefined; const v = m.get(k); m.delete(k); m.set(k, v); return v; },
  set: (k, v) => { m.delete(k); if (m.size >= max) m.delete(m.keys().next().value); m.set(k, v); } }; };
