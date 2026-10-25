// The tools' limits and the visual kinds a slot can be: one list for create_report's schema, plan_layout's answer and the
// server's instructions (built from LIMITS in lib/agent-text.mjs).
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Gallery = require('../../assets/js/visual-gallery.js');

// The visuals a report slot can be (audit 6, A6-16): one list for create_report's schema, the tools' limits and rule 6
// (0.3.0 D2: the visual gallery's three, written only when the user asks: a slot of that kind, or create_report's gallery)
export const GALLERY_KINDS = Object.values(Gallery.TOOL_NAMES);
export const VISUAL_KINDS = ['title', 'logo', 'kpi', 'card', 'line', 'bar', 'column', 'donut', 'table', 'matrix', 'gauge', 'funnel', 'treemap', 'map', 'slicer', 'text'].concat(GALLERY_KINDS);
// The tools' limits, given to the plan step so a plan is checked before it is shown (0.2.9, O-12: a plan with 4 slicers
// was approved, then create_report refused it). create_report's own inputs use the same numbers.
export const LIMITS = { kpiCards: 6, slicers: 3, tableFields: 8, pageFilters: 8, svgColumns: 4, svgCards: 6, displayNameLength: 80, textLength: 400,
  pageSizes: ['1920x1080', '1280x720', '960x720', 'custom { w, h }: 640-3840 x 360-2160, shaped 4:3 to 2.4:1'], defaultPage: '1920x1080',
  visuals: VISUAL_KINDS };
