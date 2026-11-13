/* DataArcus relationship-filter (0.3.3 LX1, the reviewer's AUD-069): which ways does a relationship filter? The one rule,
 * in one place (the owner, D-1104-12).
 * A filter always travels from a relationship's one side to its many side. It also travels back when the relationship
 * says bothDirections, and ALWAYS for a one-to-one relationship, whatever its crossFilteringBehavior says. Microsoft
 * Learn, "Model relationships in Power BI Desktop", Cross filter direction
 * (https://learn.microsoft.com/power-bi/transform-model/desktop-relationships-understand#relationship-properties):
 * "For one-to-one relationships, the cross filter direction is always from both tables."
 * Read by lineage.mjs's modelGraph (the Impact check, and the brief check through that graph) and field-catalog.js's
 * relsOfTmsl (the website's picker, suggest_fields). Not measured in Power BI Desktop by DataArcus: Microsoft's rule.
 * r: a relationship as TMSL writes it (crossFilteringBehavior, fromCardinality default many, toCardinality default one)
 * or as model-index.js and the health engine give it (cross, fromCard, toCard). Pure: metadata in, true or false out.
 * Browser and Node (module.exports / window.DARelationshipFilter). */
(function (root) {
  'use strict';
  const low = (x) => String(x == null ? '' : x).toLowerCase();
  // the cardinality of each end, TMSL's defaults where none is written
  const fromCard = (r) => low(r.fromCardinality || r.fromCard || 'many');
  const toCard = (r) => low(r.toCardinality || r.toCard || 'one');
  const oneToOne = (r) => !!r && fromCard(r) === 'one' && toCard(r) === 'one';
  // true: a filter on either table reaches the other; false: only from the one side (the "to" table) to the many side
  const filtersBoth = (r) => !!r && (low(r.crossFilteringBehavior || r.cross) === 'bothdirections' || oneToOne(r));
  const api = { filtersBoth, oneToOne };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DARelationshipFilter = api;
})(typeof self !== 'undefined' ? self : this);
