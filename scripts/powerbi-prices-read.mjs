// Reads the Power BI prices out of Microsoft's pricing page, for scripts/update-powerbi-prices.mjs.
// Kept apart from the updater (which fetches and writes when it runs) so scripts/test-powerbi-prices.mjs can
// check the reading on fixed text.

// The page's visible text: no scripts, no tags, one space between words.
export const pageText = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');

// Pro and Premium Per User: each "$NN.NN user/month" belongs to the product name that appears closest before it.
// (Product names also appear in menus, so "first price after the label" is not enough.)
export function perUserPrices(text) {
  const LABELS = { pro: 'Power BI Pro', ppu: 'Premium Per User' };
  const labelHits = Object.entries(LABELS).flatMap(([key, label]) => [...text.matchAll(new RegExp(label, 'g'))].map((m) => ({ key, i: m.index })));
  const found = {};
  for (const m of text.matchAll(/\$\s?(\d{1,3}(?:\.\d{2})?)\s*(?:USD\s*)?(?:per\s*)?user\s*\/\s*month/gi)) {
    const owner = labelHits.filter((h) => h.i < m.index).sort((a, b) => b.i - a.i)[0];
    if (owner && found[owner.key] === undefined && m.index - owner.i < 600) found[owner.key] = parseFloat(m[1]);
  }
  return { pro: found.pro ?? null, ppu: found.ppu ?? null };
}

// The PPU add-on for users who already have Pro or E5. Microsoft states it in a footnote, one sentence:
// "A $14.00 per user/month,paid yearly add-on is available for users with Power BI Pro, Microsoft 365 E5, and
// Office 365 E5 licenses to step up to Power BI Premium per user."
// The price counts only when "add-on" and "Premium per user" are in the same sentence as it, and every such
// sentence gives the same price; anything else returns null (not confirmed).
export function ppuAddon(text) {
  const prices = new Set();
  for (const m of text.matchAll(/\$\s?(\d{1,3}(?:\.\d{2})?)\s*(?:USD\s*)?(?:per\s*)?user\s*\/\s*month[^$]{0,80}?add-on[^$]{0,200}?Premium\s+per\s+user/gi)) {
    if (/[.!?]\s/.test(m[0])) continue;   // the words must be in one sentence
    prices.add(parseFloat(m[1]));
  }
  return prices.size === 1 ? [...prices][0] : null;
}

// What the updater does with the add-on it read: { value } to save, plus a warning (keep the old value, the run
// still passes) or a problem (keep the old value, the run fails so GitHub emails), like the other prices.
export function checkAddon(addon, { old, ppu }) {
  if (addon === null) return { value: old, warning: `PPU add-on: not confirmed on Microsoft's page (the footnote was not found or was ambiguous); keeping $${old}` };
  if (addon < 5 || addon > 60) return { value: old, problem: `ppuAddon: ${addon} is outside the expected range 5-60` };
  if (old && Math.abs(addon - old) / old > 0.5) return { value: old, problem: `ppuAddon: jumped from ${old} to ${addon}, please check by hand` };
  if (ppu && addon >= ppu) return { value: old, problem: `ppuAddon (${addon}) should be less than ppu (${ppu})` };
  return { value: addon };
}
