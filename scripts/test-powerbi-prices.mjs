// Tests for reading Microsoft's Power BI pricing page (scripts/powerbi-prices-read.mjs), used by the weekly
// price updater (scripts/update-powerbi-prices.mjs). Runs on fixed text, so it needs no network.
//   node scripts/test-powerbi-prices.mjs          the fixed-text checks
//   node scripts/test-powerbi-prices.mjs --live   also reads Microsoft's page now and checks all three prices are found
import { pageText, perUserPrices, ppuAddon, checkAddon } from './powerbi-prices-read.mjs';

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

// ---------- optional: Microsoft's page today ----------
if (process.argv.includes('--live')) {
  const html = await (await fetch('https://www.microsoft.com/en-us/power-platform/products/power-bi/pricing', { headers: { 'user-agent': 'Mozilla/5.0 (DataArcus weekly price check; +https://dataarcus.com)' } })).text();
  const text = pageText(html), { pro, ppu } = perUserPrices(text), addon = ppuAddon(text);
  console.log('live page:', { pro, ppu, ppuAddon: addon });
  ok(pro !== null && ppu !== null && addon !== null, 'live page: Pro, PPU and the add-on are all found');
}

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
