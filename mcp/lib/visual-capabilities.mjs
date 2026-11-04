// LAYER reading (0.3.2 SP37, split from visual-meaning.mjs): the capability validation of a native Power BI visual.
// Microsoft's capabilities of the native visuals (@microsoft/powerbi-core-visual-schema, the version mcp/package.json
// pins) and its validator's table of required roles and maxima per visual type (the authoring CLI's metadata provider,
// loaded once by a top-level await; null when the package can't load, and then only the capabilities are checked).
// Pure functions: no I/O after the load, no network, the input is not changed; names in roles are never acted on.
// Interface:
//   isValue(field) -> boolean (a measure or an aggregation)   isCol(field) -> boolean (a column): the field shapes, one
//     place for rolesOf, the candidates and the validation alike
//   capsOf(visualType) -> Microsoft's capabilities object | null     drillsIn(visualType) -> boolean (it drills down)
//   fitsCapabilities(visualType, { Role: [field] }) -> { ok, problems: [text] } (role names are the native's own)
//   roleLabel(visualType, role) -> the role's display name in Desktop's field wells (the role itself when none)

import { getCapabilities } from '@microsoft/powerbi-core-visual-schema';
// Microsoft's validator's own table of required roles and maxima per visual type (its metadata provider): the referee
// of every native visual this module chooses (the laptop proof of 11 Oct: a donut written with no value, a map with no
// location: PBIR_ROLE_REQUIRED_MISSING; two categories in a donut: PBIR_ROLE_MAX_EXCEEDED)
let VP = null;
try { VP = await (await import('@microsoft/powerbi-report-authoring-cli')).getMetadataProvider(); } catch (e) { VP = null; }

export const isValue = (f) => f.kind === 'measure' || f.kind === 'aggregation';
export const isCol = (f) => f.kind === 'column';

// ---- Microsoft's capabilities of the native visuals (@microsoft/powerbi-core-visual-schema, the version mcp/package.json pins) ----
export const capsOf = (type) => { try { return type ? getCapabilities(type) || null : null; } catch (e) { return null; } };
export const drillsIn = (type) => { const c = capsOf(type); return !!(c && c.drilldown); };
// whether a native visual takes these fields in these roles: every role is one of its dataRoles, a Grouping role holds
// columns and a Measure role values, and the counts meet one of its conditions (min, max, and kind: 0 a column, 1 a
// value), in one of its data view mappings. Returns { ok, problems: [text] } (role names are the native's own).
export function fitsCapabilities(type, roles) {
  const caps = capsOf(type);
  if (!caps) return { ok: false, problems: [`${type || 'no type'} is not in Microsoft's catalog of visuals`] };
  const problems = [], dr = Object.fromEntries((caps.dataRoles || []).map((r) => [r.name, r]));
  const used = Object.entries(roles || {}).filter(([, l]) => Array.isArray(l) && l.length);
  for (const [r, l] of used) {
    const d = dr[r];
    if (!d) { problems.push(`${type} has no ${r} role`); continue; }
    if (d.kind === 'Measure' && l.some(isCol)) problems.push(`${type}'s ${r} (${d.displayName || r}) takes values, not columns`);
    if (d.kind === 'Grouping' && l.some(isValue)) {
      // a Grouping role some condition lets hold values (kind 1: the scatter's and the map's X and Y)
      const valuesOk = (caps.dataViewMappings || []).some((m) => (m.conditions || []).some((c) => c[r] && c[r].kind === 1));
      if (!valuesOk) problems.push(`${type}'s ${r} (${d.displayName || r}) takes columns, not values`);
    }
  }
  // a drill role's fields are levels: Power BI shows one at a time, so its conditions count one (a pie's Category max 1
  // still drills through a hierarchy)
  const drillRoles = (caps.drilldown && caps.drilldown.roles) || [];
  const count = (r) => { const k = ((roles || {})[r] || []).length; return drillRoles.includes(r) ? Math.min(k, 1) : k; };
  const meets = (c) => Object.entries(c).every(([r, k]) => {
    if (!k || typeof k !== 'object' || !dr[r] && !(r in (roles || {}))) return true;
    const nr = count(r);
    if (k.min != null && nr < k.min) return false;
    if (k.max != null && nr > k.max) return false;
    if (k.kind === 1 && ((roles || {})[r] || []).some(isCol)) return false;
    if (k.kind === 0 && ((roles || {})[r] || []).some(isValue)) return false;
    return true;
  });
  const maps = caps.dataViewMappings || [];
  const condOk = !maps.length || maps.some((m) => !m || !Array.isArray(m.conditions) || !m.conditions.length || m.conditions.some(meets));
  if (!condOk) problems.push(`${type} can't show ${used.map(([r, l]) => `${l.length} in ${r}`).join(', ')} (none of its field-count conditions is met)`);
  // Microsoft's validator: every required role filled, no role over its maximum (it counts every field, drill levels too)
  const entry = VP ? VP.getVisualEntry(type) : null;
  if (entry) {
    entry.requiredRoles.filter((r) => !((roles || {})[r] || []).length).forEach((r) => problems.push(`${type} needs its ${r} role (${dr[r] && dr[r].displayName || r}) filled`));
    Object.entries(entry.maxPerRole).filter(([r, mx]) => ((roles || {})[r] || []).length > mx).forEach(([r, mx]) => problems.push(`${type}'s ${r} takes at most ${mx} field(s)`));
  }
  return { ok: problems.length === 0, problems };
}

// the native visual's own name of a role (its display name in Desktop's field wells)
export const roleLabel = (type, r) => { const c = capsOf(type), d = c && (c.dataRoles || []).find((x) => x.name === r); return d && d.displayName ? d.displayName : r; };
