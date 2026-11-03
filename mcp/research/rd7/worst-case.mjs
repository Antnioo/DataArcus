// RD7 scratch: the draft's longest case (every list at its cap, every name 80 characters), against Microsoft's 10,000
// Run: node mcp/research/rd7/worst-case.mjs
const n80 = (p, i) => (p + ' ' + i + ' ').padEnd(80, 'x');
const name = (i) => '- [' + n80('Measure', i) + '] is an explicit measure; use it rather than summing a column.';
const dup = (i) => '- "' + n80('Col', i) + '" exists in \'' + n80('Table A', i) + '\' and \'' + n80('Table B', i) + '\'; ask which one unless the question names the table.';
const term = (i) => '- "' + n80('عربي', i) + '" means \'' + n80('T', i) + '\'[' + n80('C', i) + '].';
const dates = 600;
const len = (k) => k.reduce((s, x) => s + x.length + 1, 0);
const A = Array.from({ length: 25 }, (_, i) => name(i)), B = Array.from({ length: 10 }, (_, i) => dup(i));
let terms = 0; while (len(A) + len(B) + dates + len(Array.from({ length: terms + 1 }, (_, i) => term(i))) <= 10000) terms++;
console.log('measures 25:', len(A), ' ambiguity 10:', len(B), ' dates ~', dates, ' => confirmed terms that still fit:', terms);
console.log('PASS  rd7-worst-case  1 checks');
