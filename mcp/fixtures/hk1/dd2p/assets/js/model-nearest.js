/* DataArcus model-nearest (0.3.2 DD1G): which model folder does a chosen folder mean? The one rule, in one place: the
 * model folder nearest the top wins (a backup copy deeper down never does); two at the nearest depth (two projects side
 * by side) are never picked between silently: the tied ones are given, sorted, so the caller can name them all and ask.
 * Pure: model folder paths and their separator in, the answer out; nothing is read or changed. The MCP's
 * model-discovery.mjs nearestModel (disk paths, "/" or "\") and the website's model-import-browser.js fromFolder (the
 * browser's relative paths, "/") both read it here (the owner, D-1104-12 and D-1016-01: one place).
 * Browser and Node (module.exports / window.DAModelNearest). */
(function (root) {
  'use strict';
  // paths: the model folders' paths; sep: the separator of those paths. Returns
  //   { path, tied, others }: path is the nearest folder, or null when none is nearest alone (no folders, or a tie);
  //   tied is every folder at the nearest depth, sorted by code unit (a stable message); others is how many more
  //   folders there are than the one read (a deeper backup counts here and never wins)
  function nearest(paths, sep) {
    const list = Array.from(paths || []), s = sep || '/';
    if (!list.length) return { path: null, tied: [], others: 0 };
    const depth = (p) => String(p).split(s).length, top = Math.min(...list.map(depth));
    const tied = list.filter((p) => depth(p) === top).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return { path: tied.length === 1 ? tied[0] : null, tied, others: list.length - 1 };
  }
  const api = { nearest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAModelNearest = api;
})(typeof self !== 'undefined' ? self : this);
