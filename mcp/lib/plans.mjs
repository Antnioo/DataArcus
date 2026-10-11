// The gate inside the tools (0.2.9, P-1 of the owner's own test of 0.2.8: his Claude Desktop showed no approval prompt
// before any write, though the write tools were set to "Needs approval"). The tools can't rely on the AI app asking, so
// no tool writes a file without a plan id that was proposed by a tool and then approved with approve_plan.
// The plans live in this server process only: a restart forgets them, and an unknown id is refused like an expired one.
// What this can and can't do: it forces a plan step and an explicit approval call with the user's reply; it can't prove
// that a person typed that reply (an AI app could call approve_plan on its own). The instructions forbid that.
import crypto from 'node:crypto';

// how long a plan id is good for: 2 hours from its proposal, and 2 hours from its approval. DATAARCUS_PLAN_TTL_MS can
// only shorten it (the tests use a few seconds); it can never make a plan live longer
const TTL_DEFAULT = 2 * 60 * 60 * 1000;
const TTL = (() => { const v = Number(process.env.DATAARCUS_PLAN_TTL_MS); return Number.isFinite(v) && v > 0 ? Math.min(TTL_DEFAULT, v) : TTL_DEFAULT; })();
// which writing tools each kind of plan allows
export const ALLOWS = {
  report: ['generate_theme', 'create_report'],   // plan_layout's plan: the theme file and the report (with its format script)
  theme: ['generate_theme'],                      // generate_theme's own proposal: the theme file
  scripts: ['check_model_health'],                // check_model_health's fix scripts
  calendar: ['add_gulf_calendar']                 // add_gulf_calendar's script
};
const plans = new Map();
const now = () => Date.now();
// a reply that says no (or not yet) is never an approval
// ("No problem, go ahead" is a go: a reply that starts with a no but says go, yes or OK is not refused)
const NOT_GO = /^\s*(no\b|nope\b|not\s+yet|wait\b|stop\b|cancel|don'?t\b|do\s+not\b|hold\b|لا(\s|$|[.,!،])|انتظر|توقف)/i;
const SAYS_GO = /\b(go|yes|ok|okay|approved?|proceed|sure)\b|موافق|نعم|تمام|ابدأ|اكتب/i;

const SHOW = 'Show the user the plan (pages, visuals and their fields, page size, theme colours, every file that will be written) and wait for their reply. When they say go, call approve_plan with the plan id and their reply in their own words, then call this tool again with planId.';

/** A new proposed plan. kind: report | theme | scripts | calendar; model: the model's key (its folder's real path) or null; writes: what it will write, in words. */
export function propose(kind, model, writes) {
  const id = 'plan-' + crypto.randomBytes(6).toString('hex');
  plans.set(id, { id, kind, model: model || null, writes: writes || [], status: 'proposed', created: now(), approvedAt: null, reply: null });
  return id;
}
const alive = (p) => p && now() - (p.status === 'approved' ? p.approvedAt : p.created) <= TTL;

/** The answer's plan block for a proposal: nothing was written, what to do next. */
export function proposal(id, extra) {
  const p = plans.get(id);
  return Object.assign({ planId: id, status: 'proposed', written: false, writesAfterGo: p.writes, sayFirst: 'Nothing was written. ' + SHOW, expiresInMinutes: Math.round(TTL / 60000) }, extra || {});
}

/** approve_plan: marks a proposed plan approved with the user's reply. Throws with what to do when it can't. */
export function approve(id, reply) {
  const p = plans.get(String(id || ''));
  if (!p) throw new Error(`Not approved: there is no plan ${JSON.stringify(String(id || ''))} (a plan id is good only in this session of the DataArcus server, and a restart forgets it). Make the plan again (plan_layout, or call the tool without planId), show it to the user and wait for their go.`);
  if (!alive(p)) { plans.delete(p.id); throw new Error(`Not approved: plan ${p.id} has expired (a plan is good for ${Math.round(TTL / 60000)} minutes). Make the plan again, show it to the user and wait for their go.`); }
  const r = String(reply == null ? '' : reply).trim();
  if (!r) throw new Error('Not approved: userReply is empty. Pass the user\'s own reply to the plan, in their words.');
  if (NOT_GO.test(r) && !SAYS_GO.test(r.replace(/^\s*no\s+problem/i, ''))) throw new Error('Not approved: the user\'s reply does not say go. Change the plan as the user asks, show it again and wait.');
  p.status = 'approved'; p.approvedAt = now(); p.reply = r.slice(0, 200);
  return { planId: p.id, status: 'approved', kind: p.kind, allows: ALLOWS[p.kind], writes: p.writes, expiresInMinutes: Math.round(TTL / 60000),
    note: 'Approved. Pass this planId to ' + ALLOWS[p.kind].join(' and ') + '. The tools check that the plan was approved; they can\'t check that a person typed the reply: approve a plan only after the user said go to the plan you showed.' };
}

/** The gate: returns the approved plan, or throws "Nothing was written" with what to do. tool: the calling tool; model: its model's key (or null). */
export function gate(tool, id, model) {
  if (id == null || id === '') throw new Error(`Nothing was written: ${tool} writes a file only with an approved plan id (planId). ${tool === 'create_report' ? 'Call plan_layout with the model (path) and the plan\'s fields: it checks the plan against the tools\' limits and gives a plan id. ' : ''}${SHOW}`);
  const p = plans.get(String(id));
  if (!p) throw new Error(`Nothing was written: the plan id ${JSON.stringify(String(id))} is unknown (a plan id is good only in this session of the DataArcus server, and a restart forgets it). ${SHOW}`);
  if (!alive(p)) { plans.delete(p.id); throw new Error(`Nothing was written: plan ${p.id} has expired (a plan is good for ${Math.round(TTL / 60000)} minutes). Make the plan again. ${SHOW}`); }
  if (p.status !== 'approved') throw new Error(`Nothing was written: plan ${p.id} is not approved yet. ${SHOW}`);
  if (!ALLOWS[p.kind].includes(tool)) throw new Error(`Nothing was written: plan ${p.id} is a ${p.kind} plan, which allows ${ALLOWS[p.kind].join(' and ')}, not ${tool}. ${tool === 'create_report' ? 'A report needs a plan from plan_layout. ' : ''}${SHOW}`);
  if (p.model && model && p.model !== model) throw new Error(`Nothing was written: plan ${p.id} was made for another model. ${SHOW}`);
  if (tool === 'create_report' && !p.model) throw new Error(`Nothing was written: plan ${p.id} was made without the model; a report's plan comes from plan_layout with path (the model), so its fields are checked against it. ${SHOW}`);
  return p;
}

/** For the answer: is this id an approved, live plan that allows the tool (no throw). */
export function approvedFor(tool, id, model) { try { gate(tool, id, model); return true; } catch (e) { return false; } }
