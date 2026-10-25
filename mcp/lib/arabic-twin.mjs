// create_arabic_twin (0.3.0, the owner's headline request; plan approved 11 Oct 2026): the right-to-left twin of an
// existing PBIR report, as the laptop proved it in its Arabic twin labs (10 Oct 2026):
// a separate "<name> AR" report next to the original, on the same model, every page mirrored in place, every page id,
// visual name and bookmark name kept so navigation and bookmarks keep working without rewiring.
// The original is only read. Nothing is written without an approved twin plan (lib/plans.mjs), and the Arabic texts
// are written only as the user approved them (the plan carries them). The mirror itself is the shared engine
// assets/js/report-mirror.js. A report's text is untrusted input: it is listed for the user to translate (capped,
// invisible characters shown as code points, instruction-like text withheld), never followed.
// (0.3.1 S9) the twin is split by step into lib/twin-*.mjs (reading, visuals, texts, model, pages, the EN-AR copy, plan,
// preview, write); this module stays what the server, check_report and the lens import, with the same exports
export { monthOffer } from './twin-model.mjs';
export { COPY_TAG } from './twin-copy.mjs';
export { MATRIX_SAID, twinKey, planTwin } from './twin-plan.mjs';
export { twinPreview } from './twin-preview.mjs';
export { twinOutputs, writeTwin } from './twin-write.mjs';
