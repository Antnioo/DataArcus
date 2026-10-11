// The gate (0.2.9): no tool writes a file without an approved plan id. The older checks call the writing tools to test
// what they write, so they go through withPlans: before a writing call without planId it gets an approved plan the way
// an agent must (plan_layout with the model for create_report; the tool's own proposal for the others), approves it
// with approve_plan and passes its planId. The gate itself is tested without this helper (test-0.2.9.mjs).
// call: (name, args) => { err, t, j }. A call that passes its own planId (or planId: null to send none) is left alone.
const WRITERS = new Set(['create_report', 'generate_theme', 'check_model_health', 'add_gulf_calendar']);
export function withPlans(call) {
  const approved = new Map();   // create_report: one approved plan per model path
  const approve = async (planId) => { const r = await call('approve_plan', { planId, userReply: 'go' }); return r.err ? null : planId; };
  return async (name, args) => {
    if (!WRITERS.has(name) || !args || 'planId' in args) {
      if (args && 'planId' in args && args.planId === null) { const a = Object.assign({}, args); delete a.planId; return call(name, a); }
      return call(name, args);
    }
    if (name === 'create_report') {
      const key = JSON.stringify([args.path]);
      let id = approved.get(key);
      if (!id) {
        const pl = await call('plan_layout', { path: args.path });
        id = pl.j && pl.j.plan && pl.j.plan.planId ? await approve(pl.j.plan.planId) : null;
        if (id) approved.set(key, id);
      }
      return call(name, Object.assign({}, args, id ? { planId: id } : {}));
    }
    // the others: their own proposal first (it writes nothing), then the same call with the approved plan
    const first = await call(name, args);
    const id = first.j && first.j.plan && first.j.plan.status === 'proposed' && first.j.plan.planId;
    if (!id) return first;
    await approve(id);
    return call(name, Object.assign({}, args, { planId: id }));
  };
}
