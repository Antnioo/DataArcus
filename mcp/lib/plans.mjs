// The gate inside the tools (0.2.9, P-1 of the owner's own test of 0.2.8: his Claude Desktop showed no approval prompt
// before any write, though the write tools were set to "Needs approval"). The tools can't rely on the AI app asking, so
// no tool writes a file without a plan id that was proposed by a tool and then approved with approve_plan.
// The plans live in this server process only: a restart forgets them, and an unknown id is refused like an expired one.
// Who approves (A-01, the owner's decision of 14 Oct, after his rc.16 test in Claude Desktop showed no elicitation): the
// person, by a click in DataArcus's own approval window in their browser (approval-window.mjs), or in the app's own
// prompt when the app supports MCP elicitation. The assistant's reply approves nothing: the tools can't check who
// typed it.
import crypto from 'node:crypto';

// how long a plan id is good for: 2 hours from its proposal, never extended (an approval does not restart it: Z-02).
// DATAARCUS_PLAN_TTL_MS can only shorten it (the tests use a few seconds); it can never make a plan live longer
const TTL_DEFAULT = 2 * 60 * 60 * 1000;
const TTL = (() => { const v = Number(process.env.DATAARCUS_PLAN_TTL_MS); return Number.isFinite(v) && v > 0 ? Math.min(TTL_DEFAULT, v) : TTL_DEFAULT; })();
// which writing tools each kind of plan allows
export const ALLOWS = {
  // plan_layout's plan: the report (with its format script and its theme inside it). Not a separate theme file (Z-01:
  // the report plan pins only create_report's inputs, so a theme file written with it took any inputs): that file has
  // its own theme plan, generate_theme's proposal
  report: ['create_report'],
  theme: ['generate_theme'],                      // generate_theme's own proposal: the theme file
  scripts: ['check_model_health'],                // check_model_health's fix scripts
  calendar: ['add_gulf_calendar'],                // add_gulf_calendar's script
  twin: ['create_arabic_twin'],                   // create_arabic_twin's own proposal: the "<name> AR" report (and its month script)
  redesign: ['create_report']                     // plan_layout with redesignFrom (0.3, J13): the copy "<name> redesigned" with its approved patches
};
const plans = new Map();
const now = () => Date.now();
const SHOW = 'Show the user the plan (pages, visuals and their fields, page size, the report\'s name and title, theme, logo, colours and options, every file that will be written) and wait for their reply. When they say go, call approve_plan with the plan id: it opens DataArcus\'s approval window in their browser, and only their click on Approve there approves the plan. Then call this tool again with planId.';

// (0.3, B-154, an outside audit of 0.2.9: an approval pinned the inputs, not the model) a model is given as { key, print }:
// its key (its folder's real path) and its fingerprint (loadModel's print: a hash of its definition files). A plan made
// from a model pins its print; the write passes the print of the model it read again, and a model changed since the go
// is refused. A key alone (a string) is a model without a print
const modelOf = (m) => (m && typeof m === 'object' ? { key: m.key || null, print: m.print || null } : { key: m || null, print: null });
/** (B-154) why a write is refused when the model changed after the go (the twin's writer says it too) */
export const modelChanged = (id) => `Nothing was written: the model changed after you approved: make the plan again (plan ${id} was made from the model as it was then: call the tool without planId), show it to the user and wait for their go.`;

/** A new proposed plan. kind: report | theme | scripts | calendar | twin | redesign; model: { key, print } (or the key alone) or
 *  null; writes: what it will write, in words; data: what the write must use exactly as approved (the twin's labels) */
export function propose(kind, model, writes, data) {
  const id = 'plan-' + crypto.randomBytes(6).toString('hex'), m = modelOf(model);
  plans.set(id, { id, kind, model: m.key, modelPrint: m.print, writes: writes || [], data: data === undefined ? null : JSON.parse(JSON.stringify(data)), status: 'proposed', created: now(), approvedAt: null });
  return id;
}
const alive = (p) => p && now() - p.created <= TTL;

/** The answer's plan block for a proposal: nothing was written, what to do next. */
export function proposal(id, extra) {
  const p = plans.get(id);
  return Object.assign({ planId: id, status: 'proposed', written: false, writesAfterGo: p.writes, sayFirst: 'Nothing was written. ' + SHOW, expiresInMinutes: Math.round(TTL / 60000) },
    p.modelPrint ? { modelPinned: 'The model as it was read for this plan (a hash of its definition files): if the model changes before the write, nothing is written and the plan must be made again.' } : {}, extra || {});
}

/** A plan that can still be approved (known, alive), or a throw with what to do: checked before the person is asked. */
export function pending(id) {
  const p = plans.get(String(id || ''));
  if (!p) throw new Error(`Not approved: there is no plan ${JSON.stringify(String(id || ''))} (a plan id is good only in this session of the DataArcus server, and a restart forgets it). Make the plan again (plan_layout, or call the tool without planId), show it to the user and wait for their go.`);
  if (!alive(p)) { plans.delete(p.id); throw new Error(`Not approved: plan ${p.id} has expired (a plan is good for ${Math.round(TTL / 60000)} minutes). Make the plan again, show it to the user and wait for their go.`); }
  return { id: p.id, kind: p.kind, writes: p.writes.slice(), status: p.status };
}

/** Marks a proposed plan approved. by: 'user-in-browser' (the person clicked Approve in DataArcus's own approval window)
 *  or 'user-in-app' (the person said yes in the app's own prompt, MCP elicitation). Nothing else approves. Throws with
 *  what to do when it can't. (Audit 6, A6-3; A-01) */
export function approve(id, by) {
  const p = plans.get(String((pending(id), id)));
  if (p.status === 'refused') throw new Error(REFUSED(p).replace('Nothing was written: ', 'Not approved: '));
  if (p.status === 'approved') throw new Error(`Not approved again: plan ${p.id} is already approved (an approval is given once, and a plan is good for ${Math.round(TTL / 60000)} minutes from its proposal). Use it, or make a new plan.`);
  if (by !== 'user-in-browser' && by !== 'user-in-app') throw new Error('Not approved: only the person approves a plan, by a click on Approve in DataArcus\'s approval window (or in the app\'s own prompt).');
  p.status = 'approved'; p.approvedAt = now(); p.approvedBy = by;
  // (J14, B-168) the approval holds the binding of the exact artifact the person saw: its files' digest, the plan's pins
  // and the model's print
  const art = artifacts.get(p.id); if (art) p.approvedBinding = art.binding;
  return approval(p.id);
}

/** Marks a plan refused: the person clicked "Not now" in DataArcus's approval window (rc.22, B-134: the plan then said
 *  "not approved yet"), or said no in the app's own prompt (by 'app'; rc.23, F7b: it stayed "not approved yet" there).
 *  A refused plan is never approved later; a new plan is needed. */
export function refuse(id, by) { const p = plans.get(String(id)); if (p && p.status === 'proposed') { p.status = 'refused'; p.refusedAt = now(); p.refusedIn = by === 'app' ? 'app' : 'window'; } }
const REFUSED = (p) => `Nothing was written: plan ${p.id} was refused: the person ${p.refusedIn === 'app' ? 'said no in DataArcus\'s approval prompt in the app' : 'clicked "Not now" in DataArcus\'s approval window'}. Ask what to change, make a new plan, show it and wait for their go.`;

/** (rc.23, F7b) why a refused plan can't be approved ("Not approved: ..."), or null when it was not refused. */
export function refusal(id) { const p = plans.get(String(id)); return p && p.status === 'refused' ? REFUSED(p).replace('Nothing was written: ', 'Not approved: ') : null; }

/** (rc.22, B-134) what keeps a plan from being used by a tool, said before its other inputs are checked: null when the
 *  plan can be used (known, alive, approved, not used yet for this tool, of the right kind), else the reason. */
export function approvalProblem(tool, id) { try { gate(tool, id, null, undefined, { approvalOnly: true }); return null; } catch (e) { return String(e && e.message || e); } }

/** The answer for an approved plan (approve_plan's), or null when the plan is not approved. */
export function approval(id) {
  const p = plans.get(String(id));
  if (!p || p.status !== 'approved') return null;
  return { planId: p.id, status: 'approved', approvedBy: p.approvedBy, kind: p.kind, allows: ALLOWS[p.kind], writes: p.writes, expiresInMinutes: Math.max(0, Math.round((p.created + TTL - now()) / 60000)),
    note: 'Approved by the person, ' + (p.approvedBy === 'user-in-browser' ? 'with a click on Approve in DataArcus\'s approval window, which showed the plan and what will be written.' : 'in the app\'s own prompt, which showed what will be written.') + ' Pass this planId to ' + ALLOWS[p.kind].join(' and ') + '.' };
}

/** What the approval window shows of a plan (read only): { id, kind, writes, data, expires }, or null. */
export function planOf(id) { const p = plans.get(String(id)); return p && alive(p) ? { id: p.id, kind: p.kind, writes: p.writes.slice(), data: p.data, expires: p.created + TTL } : null; }

// Audit 6, A6-1 and A6-5: a plan pins what the write may use (data.pins[tool], stored at the proposal); the write's own
// inputs are compared with it, key by key, and any difference is refused with the keys named. canon: one JSON form
// (object keys sorted, undefined as null), so the same inputs always compare equal
const canon = (v) => JSON.stringify(v === undefined ? null : v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().filter((key) => x[key] !== undefined).map((key) => [key, x[key]])) : x));
function differences(want, got) {
  const keys = [...new Set(Object.keys(want || {}).concat(Object.keys(got || {})))].sort(), off = [];
  for (const k of keys) {
    const w = (want || {})[k], g = (got || {})[k];
    if (canon(w) === canon(g)) continue;
    const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
    const sub = isObj(w) && isObj(g) ? [...new Set(Object.keys(w).concat(Object.keys(g)))].filter((s) => canon(w[s]) !== canon(g[s])) : [];
    off.push(sub.length && sub.length <= 6 ? `${k} (${sub.join(', ')})` : k);
  }
  return off;
}

/** The gate: returns the approved plan, or throws "Nothing was written" with what to do. tool: the calling tool; model:
 *  its model's key (or null); pin: the write's own inputs in the form the plan pinned them (A6-1, A6-5). */
export function gate(tool, id, model0, pin, opts) {
  const { key: model, print } = modelOf(model0);
  if (id == null || id === '') throw new Error(`Nothing was written: ${tool} writes a file only with an approved plan id (planId). ${tool === 'create_report' ? 'Call plan_layout with the model (path) and the plan\'s fields: it checks the plan against the tools\' limits and gives a plan id. ' : ''}${SHOW}`);
  const p = plans.get(String(id));
  if (!p) throw new Error(`Nothing was written: the plan id ${JSON.stringify(String(id))} is unknown (a plan id is good only in this session of the DataArcus server, and a restart forgets it). ${SHOW}`);
  if (!alive(p)) { if (!(opts && opts.approvalOnly)) plans.delete(p.id); throw new Error(`Nothing was written: plan ${p.id} has expired (a plan is good for ${Math.round(TTL / 60000)} minutes). Make the plan again. ${SHOW}`); }
  if (p.status === 'refused') throw new Error(REFUSED(p));
  if (p.status !== 'approved') throw new Error(`Nothing was written: plan ${p.id} is not approved yet (the person approves it with a click on Approve in DataArcus's approval window, which approve_plan opens in their browser). ${SHOW}`);
  if (p.used && p.used[tool]) throw new Error(`Nothing was written: plan ${p.id} was already used for ${tool} (a plan writes once). For another write, make a new plan, show it to the user and wait for their go.`);
  if (!ALLOWS[p.kind].includes(tool)) throw new Error(`Nothing was written: plan ${p.id} is a ${p.kind} plan, which allows ${ALLOWS[p.kind].join(' and ')}, not ${tool}. ${tool === 'create_report' ? 'A report needs a plan from plan_layout. ' : ''}${SHOW}`);
  if (p.model && model && p.model !== model) throw new Error(`Nothing was written: plan ${p.id} was made for another model. ${SHOW}`);
  if (opts && opts.approvalOnly) return p;
  // (R6, the outside audit of 19 Oct, F07: a theme plan pinned no model, and null/null passed) a plan made with a model is
  // written only with that model, and a plan made without one only without one
  if (p.model && !model) throw new Error(`Nothing was written: plan ${p.id} was made with a model (path), and this call gives none: call ${tool} with the same path, or make a new plan. ${SHOW}`);
  if (!p.model && model) throw new Error(`Nothing was written: plan ${p.id} was made without a model, and this call gives one (path): make a new plan with the model, show it to the user and wait for their go.`);
  // (B-154) the model as it was at the plan: read again by the write, the same, or nothing is written. A write that read
  // no print is refused too (fails closed); the twin's writer checks its model itself, with the plan's data (arabic-twin)
  if (p.modelPrint && print && print !== p.modelPrint) throw new Error(modelChanged(p.id));
  if (p.modelPrint && !print && tool !== 'create_arabic_twin') throw new Error(`Nothing was written: ${tool} did not read the model again to compare it with the approved plan ${p.id}. ${SHOW}`);
  if (tool === 'create_report' && !p.model) throw new Error(`Nothing was written: plan ${p.id} was made without the model; a report's plan comes from plan_layout with path (the model), so its fields are checked against it. ${SHOW}`);
  const want = p.data && p.data.pins && p.data.pins[tool];
  // (Z-01: the gate fails closed: a writing tool's plan must pin its inputs; the twin writes only from the plan's data)
  if (!want && tool !== 'create_arabic_twin') throw new Error(`Nothing was written: plan ${p.id} holds no pinned inputs for ${tool}, so it can't say what the user approved. Make the plan with the tool that proposes it, show it to the user and wait for their go.`);
  // (the outside review of rc.12, R-01: a plan that pinned inputs is used only by a write that passes its own, so a
  // writer that forgot them is refused, not waved through)
  if (want && pin === undefined) throw new Error(`Nothing was written: ${tool} passed no inputs to compare with the approved plan ${p.id}. ${SHOW}`);
  if (want) {
    const off = differences(want, pin), changed = off.filter((x) => /^files\b/.test(x));
    // (B-02: a file the report is made from, or its source report, changed since the go: said as such)
    if (changed.length && changed.length === off.length) throw new Error(`Nothing was written: a file the plan was made from changed since the plan was approved (plan ${p.id}: ${changed.map((x) => x.replace(/^files ?\(?|\)$/g, '') || 'a file').join(', ')}). Make the plan again, show it to the user and wait for their go.`);
    if (off.length) throw new Error(`Nothing was written: ${tool}'s inputs differ from the approved plan ${p.id} in ${off.join('; ')}. The user approved that plan, so only its inputs are written: pass the approved ones, or make a new plan with these, show it and wait for the user's go.`);
  }
  return p;
}



/** A plan's pinned input for a tool (design round 8, S6: the display names the plan showed as its default), or undefined;
 *  read only, the gate still checks the write */
export function pinned(id, tool, key) { const p = plans.get(String(id)), w = p && p.data && p.data.pins && p.data.pins[tool]; return w ? w[key] : undefined; }

/** After a successful write (audit 6, A6-2): the plan is used for that tool, and the same id is refused for it again. */
export function consume(id, tool) { const p = plans.get(String(id)); if (p) { p.used = p.used || {}; p.used[tool] = true; } artifacts.delete(String(id)); }

// J14 (0.3, B-168): the exact artifact of a report plan: the files plan_layout built and checked, kept in this process
// only (never in the plan's data, never written before the go), with their digest, the binding and the check. The newest
// ARTIFACTS_MAX are kept; a plan whose artifact was dropped is made again.
const artifacts = new Map(), ARTIFACTS_MAX = 64;
/** Keeps a proposed plan's artifact: { files, digest, binding, modelPrint, check, finish }. */
export function attach(id, art) { if (!plans.has(String(id))) return; artifacts.set(String(id), art); while (artifacts.size > ARTIFACTS_MAX) artifacts.delete(artifacts.keys().next().value); }
/** A live plan's artifact, or null. */
export function artifactOf(id) { const p = plans.get(String(id)); return p && alive(p) ? artifacts.get(p.id) || null : null; }
/** The binding the approval recorded (null before the approval, or for a plan with no artifact). */
export function approvedBinding(id) { const p = plans.get(String(id)); return (p && p.approvedBinding) || null; }
