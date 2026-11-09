// Tests for reading Microsoft's Power BI pricing page (scripts/powerbi-prices-read.mjs), used by the weekly
// price updater (scripts/update-powerbi-prices.mjs). Runs on fixed text, so it needs no network.
//   node scripts/test-powerbi-prices.mjs          the fixed-text checks
//   node scripts/test-powerbi-prices.mjs --live   also reads Microsoft's page now and checks all three prices are found
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageText, perUserPrices, ppuAddon, checkAddon } from './powerbi-prices-read.mjs';
import { syncChecked, checkedWords, CHECKED_PLACES } from './update-powerbi-prices.mjs';

let checks = 0, fails = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL ' + msg); } };
const eq = (got, want, msg) => ok(JSON.stringify(got) === JSON.stringify(want), `${msg}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// Microsoft's footnote as it appears in the page text on 2026-10-03 (note the missing space after the comma)
const FOOTNOTE = '[2] A $14.00 per user/month,paid yearly add-on is available for users with Power BI Pro, Microsoft 365 E5, and Office 365 E5 licenses to step up to Power BI Premium per user. Learn more about purchasing Power BI Premium per user.';
const CARDS = 'Power BI Pro $14.00 user/month, paid yearly Buy now Power BI Premium Per User $24.00 user/month, paid yearly Buy now';
const MENU = 'Products Power BI Pro Premium Per User Pricing ';

// ---------- the add-on ----------
eq(ppuAddon(FOOTNOTE), 14, 'footnote as on the page');
eq(ppuAddon(MENU + CARDS + ' Footnotes [1] Some text. ' + FOOTNOTE), 14, 'footnote among the plan cards');
eq(ppuAddon(pageText(`<p>[2] A <b>$14.00</b> per user/month,&nbsp;paid yearly add-on is available for users with Power BI Pro and Microsoft 365 E5 licenses to step up to Power BI Premium per user.</p>`)), 14, 'footnote with tags and &nbsp;');
eq(ppuAddon('A $16 per user/month, paid yearly add-on is available for users with Power BI Pro to step up to Power BI Premium per user.'), 16, 'whole-dollar price, comma and space');
eq(ppuAddon('A $14.00 USD per user/month add-on is available to step up to Power BI Premium per user.'), 14, '"USD" before "per user"');
eq(ppuAddon(MENU + CARDS), null, 'no footnote: not confirmed');
eq(ppuAddon('A $14.00 per user/month, paid yearly plan for Power BI Premium per user.'), null, 'no "add-on": not confirmed');
eq(ppuAddon('A $14.00 per user/month add-on is available. Power BI Premium per user is sold separately.'), null, '"Premium per user" in the next sentence: not confirmed');
eq(ppuAddon(FOOTNOTE + ' ' + FOOTNOTE.replace('$14.00', '$12.00')), null, 'two different add-on prices: not confirmed');
eq(ppuAddon(FOOTNOTE + ' ' + FOOTNOTE), 14, 'the same footnote twice');

// ---------- Pro and PPU are read as before, and the footnote's "$14.00 per user/month" isn't mistaken for them ----------
eq(perUserPrices(MENU + CARDS), { pro: 14, ppu: 24 }, 'plan cards');
eq(perUserPrices(MENU + CARDS + ' ' + FOOTNOTE), { pro: 14, ppu: 24 }, 'plan cards plus the footnote');
eq(perUserPrices('nothing here'), { pro: null, ppu: null }, 'no prices');

// ---------- what the updater does with it ----------
eq(checkAddon(14, { old: 14, ppu: 24 }), { value: 14 }, 'confirmed, unchanged');
eq(checkAddon(15, { old: 14, ppu: 24 }), { value: 15 }, 'confirmed, changed a little: saved');
ok(checkAddon(null, { old: 14, ppu: 24 }).value === 14 && /not confirmed/.test(checkAddon(null, { old: 14, ppu: 24 }).warning || ''), 'not confirmed: keeps $14 and warns');
ok(!checkAddon(null, { old: 14, ppu: 24 }).problem, 'not confirmed: a warning, not a failure');
ok(checkAddon(30, { old: 14, ppu: 40 }).value === 14 && /jumped/.test(checkAddon(30, { old: 14, ppu: 40 }).problem || ''), 'a jump over 50%: keeps $14, fails the run');
ok(checkAddon(70, { old: 14, ppu: 24 }).value === 14 && /range/.test(checkAddon(70, { old: 14, ppu: 24 }).problem || ''), 'out of range: keeps $14, fails the run');
ok(checkAddon(20, { old: 14, ppu: 18 }).value === 14 && /less than ppu/.test(checkAddon(20, { old: 14, ppu: 18 }).problem || ''), 'not below PPU: keeps $14, fails the run');

// ---------- PC1 (B-413): the "checked" date the calculator shows is the date in powerbi-prices.json, in all four places ----------
{
  const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const iso = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/powerbi-prices.json'), 'utf8')).checked;
  const w = checkedWords(iso);
  eq(checkedWords('2026-11-02'), { en: '2 November 2026', ar: '2 نوفمبر 2026' }, 'the words, made the way the page formats them');
  const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const span = (txt, lang) => (txt.match(/data-p=\\?"checked\\?">([^<]*)</g) || []).map((m) => m.replace(/^.*">/, '').replace(/<$/, ''));
  eq(span(read('tools/power-bi-licensing-cost-calculator.html')), [w.en], `the page's span says ${w.en} (powerbi-prices.json: ${iso})`);
  const tr = span(read('assets/js/translations/licensing-calculator.js'));
  eq(tr, [w.en, w.ar], `the translations' spans say ${w.en} and ${w.ar}`);
  ok(new RegExp(`checked: '${iso}'`).test(read('assets/js/licensing-calculator.js')), `the fallback in licensing-calculator.js is ${iso}`);
  // syncChecked on a copy: it writes exactly those places and nothing else
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pc1-'));
  for (const f of CHECKED_PLACES) { fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.writeFileSync(path.join(tmp, f), read(f)); }
  const changed = syncChecked(tmp, '2027-01-09');
  eq(changed.slice().sort(), CHECKED_PLACES.slice().sort(), 'syncChecked reports the files it changed');
  const t2 = checkedWords('2027-01-09');
  eq(span(fs.readFileSync(path.join(tmp, CHECKED_PLACES[0]), 'utf8')), [t2.en], 'a copy: the page span follows the date');
  ok(/checked: '2027-01-09'/.test(fs.readFileSync(path.join(tmp, 'assets/js/licensing-calculator.js'), 'utf8')), 'a copy: the fallback follows the date');
  eq(syncChecked(tmp, '2027-01-09'), [], 'a second run changes nothing');
  let threw = false; try { syncChecked(tmp, 'tomorrow'); } catch { threw = true; }
  ok(threw, 'a date that is not YYYY-MM-DD is refused');
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------- optional: Microsoft's page today ----------
if (process.argv.includes('--live')) {
  const html = await (await fetch('https://www.microsoft.com/en-us/power-platform/products/power-bi/pricing', { headers: { 'user-agent': 'Mozilla/5.0 (DataArcus weekly price check; +https://dataarcus.com)' } })).text();
  const text = pageText(html), { pro, ppu } = perUserPrices(text), addon = ppuAddon(text);
  console.log('live page:', { pro, ppu, ppuAddon: addon });
  ok(pro !== null && ppu !== null && addon !== null, 'live page: Pro, PPU and the add-on are all found');
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
