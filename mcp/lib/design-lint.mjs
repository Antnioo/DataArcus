// LAYER checks (0.2.9 item 11): the design lint. It reads the reading layer's inventory (lib/read-report.mjs) and,
// when it has one, the model's tables (types and sort-by columns: what a report's files cannot say), and never opens a
// report file itself. It never reads data: what depends on the data (how long the labels are, how many points an axis
// has) is a guess from names and types, and such a finding is marked "~" (guess: true). Measured on the laptop
// against the owner's test reports (Desktop 2.158): the time axis (O-13), bar labels (O-4), tables (O-14) and the logo
// placeholder (O-6) were caught wherever they happened, and the table rule was narrowed to the setting that was seen
// to fail ("grow to fit" without word wrap), which removed most false alarms on hand-built reports.
// A finding names the visual by its type, title (cleaned), place and size; it never quotes a text box or a value.
// 0.3.0 step 2 (the owner's go, 18 Oct): the lint itself moved to assets/js/layout-check.js, one engine for the MCP and
// the lab page's download; this file is its adapter: the MCP's names (screened and capped by the reading layer).
import { createRequire } from 'node:module';
import { keyOf, refOf, typeName } from './read-report.mjs';

const LC = createRequire(import.meta.url)('../../assets/js/layout-check.js');
export const LINT_RULES = LC.LINT_RULES;
export const MEASURED = LC.MEASURED;
export const NAMES = { keyOf, refOf, typeName };

// model: the model reader's tables ([{ name, columns: [{ name, dataType, sortBy }] }]) or null
// facts: { "Table[Column]": { blank: true } } (the blank count, when the user agreed to read it; not read by the MCP yet)
// opts: { pages: [page numbers] } to lint only those
export function lint(inv, model, facts, opts) { return LC.lint(inv, model, facts, Object.assign({}, opts, { names: NAMES })); }
