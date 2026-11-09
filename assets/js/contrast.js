/* DataArcus colour contrast: the WCAG contrast of two colours, written in one place (0.3.2 DD2K; the owner D-1104-12
 * "we create a library of functions where a place calls them so if we need to fix something we fix it at the source").
 * Two pure functions that never throw and never change their input:
 *   luminance(hex)    the relative luminance (0 to 1) of #rrggbb
 *   contrast(a, b)    the WCAG ratio (1 to 21) of two colours, either way round
 *   hexToRgb(h)       #rrggbb -> [r, g, b] (0 to 255; NaN where a pair is not hex), h a text (0.3.3 SG1: the design
 *                     colours' and the PBIP writer's colour mix read it here)
 * A colour that is not #rrggbb (#FFF, a name, an empty text) gives NaN, as every copy did before. The thresholds (3:1,
 * 4.5:1) are each caller's own. The ledger: mcp/docs/CONTRACTS.md (family contrast); the test: mcp/test-0.3.2-dd2k.mjs.
 * Browser, worker and Node (module.exports / window.DAContrast / self.DAContrast). */
(function (root) {
  'use strict';
  const luminance = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(String(hex).slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const api = { luminance, contrast, hexToRgb };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DAContrast = api;
})(typeof self !== 'undefined' ? self : this);
