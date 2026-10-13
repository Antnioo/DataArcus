// The gate inside the tools (0.2.9, P-1 of the owner's own test of 0.2.8: his Claude Desktop showed no approval prompt
// before any write, though the write tools were set to "Needs approval"). The tools can't rely on the AI app asking, so
// no tool writes a file without a plan id that was proposed by a tool and then approved with approve_plan.
// The plans live in this server process only: a restart forgets them, and an unknown id is refused like an expired one.
// What this can and can't do: it forces a plan step and an explicit approval call with the user's reply; it can't prove
// that a person typed that reply (an AI app could call approve_plan on its own). The instructions forbid that.
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
  twin: ['create_arabic_twin']                    // create_arabic_twin's own proposal: the "<name> AR" report (and its month script)
};
const plans = new Map();
const now = () => Date.now();
// The assistant-reported approval (Z-02, the outside review: "I said no" and "Wait, don't go yet" were approvals): a
// reply is a go only when it says go AND holds no word of no, not yet, wait or stop ANYWHERE, in English or Arabic.
// "no problem" is the one known go phrase with a "no" in it. When unsure, it is refused.
const NOT_GO = /\b(no|nope|not|nah|don'?t|dont|wait|stop|hold|cancel|later|never|before|until|unless|but|maybe|hmm)\b|n't\b|(^|[\s،,.!؟?؛:])(لا|لأ|ليس|مو|مش|لسه|بعدين|لاحقا|لاحقًا|لكن|بس|ربما)(?=$|[\s،,.!؟?؛:])|انتظر|توقف|تمهل|الغ|ألغ/i;
const SAYS_GO = /\b(go|yes|yep|yeah|ok|okay|approved?|proceed|sure|confirm(ed)?)\b|موافق|نعم|أيوه|ايوه|تمام|ابدأ|ابدا|اكتب|نفذ|نفّذ|اعتمد/i;
const saysGo = (r) => { const t = String(r).replace(/\bno\s+problem\b/gi, ' '); return SAYS_GO.test(t) && !NOT_GO.test(t); };

const SHOW = 'Show the user the plan (pages, visuals and their fields, page size, theme colours, every file that will be written) and wait for their reply. When they say go, call approve_plan with the plan id and their reply in their own words, then call this tool again with planId.';

/** A new proposed plan. kind: report | theme | scripts | calendar | twin; model: the model's key (its folder's real path)
 *  or null; writes: what it will write, in words; data: what the write must use exactly as approved (the twin's labels) */
export function propose(kind, model, writes, data) {
  const id = 'plan-' + crypto.randomBytes(6).toString('hex');
  plans.set(id, { id, kind, model: model || null, writes: writes || [], data: data === undefined ? null : JSON.parse(JSON.stringify(data)), status: 'proposed', created: now(), approvedAt: null, reply: null });
  return id;
}
const alive = (p) => p && now() - p.created <= TTL;

/** The answer's plan block for a proposal: nothing was written, what to do next. */
export function proposal(id, extra) {
  const p = plans.get(id);
  return Object.assign({ planId: id, status: 'proposed', written: false, writesAfterGo: p.writes, sayFirst: 'Nothing was written. ' + SHOW, expiresInMinutes: Math.round(TTL / 60000) }, extra || {});
}

/** A plan that can still be approved (known, alive), or a throw with what to do: checked before the person is asked. */
export function pending(id) {
  const p = plans.get(String(id || ''));
  if (!p) throw new Error(`Not approved: there is no plan ${JSON.stringify(String(id || ''))} (a plan id is good only in this session of the DataArcus server, and a restart forgets it). Make the plan again (plan_layout, or call the tool without planId), show it to the user and wait for their go.`);
  if (!alive(p)) { plans.delete(p.id); throw new Error(`Not approved: plan ${p.id} has expired (a plan is good for ${Math.round(TTL / 60000)} minutes). Make the plan again, show it to the user and wait for their go.`); }
  return { id: p.id, kind: p.kind, writes: p.writes.slice(), status: p.status };
}

/** approve_plan: marks a proposed plan approved. by: 'user-in-app' (the person said yes in the app's own prompt, MCP
 *  elicitation) or 'assistant-reported' (the assistant passed the reply it says the person gave: the tools can't check
 *  that a person typed it). Throws with what to do when it can't. (Audit 6, A6-3) */
export function approve(id, reply, by) {
  const p = plans.get(String((pending(id), id)));
  if (p.status === 'approved') throw new Error(`Not approved again: plan ${p.id} is already approved (an approval is given once, and a plan is good for ${Math.round(TTL / 60000)} minutes from its proposal). Use it, or make a new plan.`);
  const who = by === 'user-in-app' ? 'user-in-app' : 'assistant-reported';
  const r = String(reply == null ? '' : reply).trim();
  if (who === 'assistant-reported') {
    if (!r) throw new Error('Not approved: userReply is empty, and this app can\'t ask the person itself. Pass the user\'s own reply to the plan, in their words.');
    if (!saysGo(r)) throw new Error('Not approved: the user\'s reply does not say go. Change the plan as the user asks, show it again and wait.');
  }
  p.status = 'approved'; p.approvedAt = now(); p.reply = (r || 'approved in the app').slice(0, 200); p.approvedBy = who;
  return { planId: p.id, status: 'approved', approvedBy: who, kind: p.kind, allows: ALLOWS[p.kind], writes: p.writes, expiresInMinutes: Math.round(TTL / 60000),
    note: 'Approved. Pass this planId to ' + ALLOWS[p.kind].join(' and ') + '. ' + (who === 'user-in-app'
      ? 'The person approved it in the app\'s own prompt, which showed what will be written.'
      : 'This app can\'t show DataArcus\'s own approval prompt, so the approval rests on the reply you passed: the tools can\'t check that a person typed it. Approve a plan only after the user said go to the plan you showed.') };
}

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
export function gate(tool, id, model, pin) {
  if (id == null || id === '') throw new Error(`Nothing was written: ${tool} writes a file only with an approved plan id (planId). ${tool === 'create_report' ? 'Call plan_layout with the model (path) and the plan\'s fields: it checks the plan against the tools\' limits and gives a plan id. ' : ''}${SHOW}`);
  const p = plans.get(String(id));
  if (!p) throw new Error(`Nothing was written: the plan id ${JSON.stringify(String(id))} is unknown (a plan id is good only in this session of the DataArcus server, and a restart forgets it). ${SHOW}`);
  if (!alive(p)) { plans.delete(p.id); throw new Error(`Nothing was written: plan ${p.id} has expired (a plan is good for ${Math.round(TTL / 60000)} minutes). Make the plan again. ${SHOW}`); }
  if (p.status !== 'approved') throw new Error(`Nothing was written: plan ${p.id} is not approved yet. ${SHOW}`);
  if (p.used && p.used[tool]) throw new Error(`Nothing was written: plan ${p.id} was already used for ${tool} (a plan writes once). For another write, make a new plan, show it to the user and wait for their go.`);
  if (!ALLOWS[p.kind].includes(tool)) throw new Error(`Nothing was written: plan ${p.id} is a ${p.kind} plan, which allows ${ALLOWS[p.kind].join(' and ')}, not ${tool}. ${tool === 'create_report' ? 'A report needs a plan from plan_layout. ' : ''}${SHOW}`);
  if (p.model && model && p.model !== model) throw new Error(`Nothing was written: plan ${p.id} was made for another model. ${SHOW}`);
  if (tool === 'create_report' && !p.model) throw new Error(`Nothing was written: plan ${p.id} was made without the model; a report's plan comes from plan_layout with path (the model), so its fields are checked against it. ${SHOW}`);
  const want = p.data && p.data.pins && p.data.pins[tool];
  // (Z-01: the gate fails closed: a writing tool's plan must pin its inputs; the twin writes only from the plan's data)
  if (!want && tool !== 'create_arabic_twin') throw new Error(`Nothing was written: plan ${p.id} holds no pinned inputs for ${tool}, so it can't say what the user approved. Make the plan with the tool that proposes it, show it to the user and wait for their go.`);
  // (the outside review of rc.12, R-01: a plan that pinned inputs is used only by a write that passes its own, so a
  // writer that forgot them is refused, not waved through)
  if (want && pin === undefined) throw new Error(`Nothing was written: ${tool} passed no inputs to compare with the approved plan ${p.id}. ${SHOW}`);
  if (want) {
    const off = differences(want, pin);
    if (off.length) throw new Error(`Nothing was written: ${tool}'s inputs differ from the approved plan ${p.id} in ${off.join('; ')}. The user approved that plan, so only its inputs are written: pass the approved ones, or make a new plan with these, show it and wait for the user's go.`);
  }
  return p;
}



/** A plan's pinned input for a tool (design round 8, S6: the display names the plan showed as its default), or undefined;
 *  read only, the gate still checks the write */
export function pinned(id, tool, key) { const p = plans.get(String(id)), w = p && p.data && p.data.pins && p.data.pins[tool]; return w ? w[key] : undefined; }

/** After a successful write (audit 6, A6-2): the plan is used for that tool, and the same id is refused for it again. */
export function consume(id, tool) { const p = plans.get(String(id)); if (p) { p.used = p.used || {}; p.used[tool] = true; } }
