// 0.3.3 IX1 (mcp/work/IX1.md): like for like in the Gulf, shown on "Souq Gulf", a made-up model and report
// (fixtures/ix1-souq-gulf.mjs). It prints what lib/like-for-like.mjs says: the visuals that compare with the same
// Gregorian dates of another period, through which measures, and the months of a year in which those two periods are
// not like for like (assets/js/gulf-compare.js on DataArcus's own dates). A demo, not a tool and not a test: nothing
// of a person's is read, nothing is written.
//   node lab/ix1-like-for-like-demo.mjs [year] [country]      (2026 and no country when not given)
import { gulfModel, gulfReport } from '../fixtures/ix1-souq-gulf.mjs';
import { likeForLike } from '../lib/like-for-like.mjs';

const year = Number(process.argv[2]) || 2026, country = process.argv[3];
const line = (s) => console.log(s);
const a = likeForLike(gulfModel(), gulfReport(), { year, country });
line(`Souq Gulf (made up): ${a.visuals} visuals, ${a.withQuery} with a query.`);
line('');
line(a.said);
line('');
line('The visuals:');
a.list.forEach((v) => v.comparisons.forEach((c) => line(`  - ${v.page} / ${v.visual} (${v.type}): ${c.chain}: ${c.fn}, ${c.shift}${c.tier === 'question' ? '' : ` (${c.tier} only)`}`)));
line('The comparison measures:');
a.measures.forEach((m) => line(`  - ${m.measure} (${m.kind}): ${m.fn}, ${m.shift}${m.base ? `, of ${m.base}` : ''}; shown by ${m.visuals} visual${m.visuals === 1 ? '' : 's'}${m.likeForLike ? `; the same Ramadan days: ${m.likeForLike === 'has' ? 'the model has the measure' : 'no measure'}` : ''}`));
line(`Like-for-like measures the model lacks (the DAX Measure Builder's names): ${a.lacking.join(', ') || 'none'}`);
a.calendar.forEach((c) => {
  line('');
  line(`${c.shift}, ${year}${c.known ? `: ${c.differ} of 12 months differ${c.estimated ? ` (${c.estimated} on an estimate)` : ''}` : ': ' + c.why}`);
  (c.months || []).forEach((m) => line(`  ${m.month} against ${m.against}: Ramadan ${m.ramadan.join(' / ')}, Eid al-Fitr ${m.fitr.join(' / ')}, Eid al-Adha ${m.adha.join(' / ')}${m.weekend ? `, weekend ${m.weekend.map((w) => w.join(' + ')).join(' / ')}` : ''}${m.vat ? `, VAT ${m.vat.map((v) => v.join(' and ')).join(' / ')}` : ''}${m.estimated ? ' (estimate)' : ''}`));
});
line('');
line('Not proved: ' + a.notProved);
