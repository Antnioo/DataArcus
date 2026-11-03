// RD9 scratch: create_report's inputs (CREATE_REPORT_INPUTS) against the keys a report plan pins (REPORT_PINNED, by
// reportPin's keys). Prints the inputs not pinned and the pinned keys that are no input. Checks nothing.
import { CREATE_REPORT_INPUTS, reportPin } from '../../lib/report-inputs.mjs';
const inputs = Object.keys(CREATE_REPORT_INPUTS);
const pinned = Object.keys(reportPin({ pages: [{}] }, [])).filter((k) => !['design', 'files'].includes(k));
console.log(JSON.stringify({ inputs: inputs.length, pinned: pinned.length, inputsNotPinned: inputs.filter((k) => !pinned.includes(k)), pinnedNotInput: pinned.filter((k) => !inputs.includes(k)) }));
