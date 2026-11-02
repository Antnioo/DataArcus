// Weekly price check for the Power BI Licensing Cost Calculator.
// Reads Microsoft's public sources, sanity-checks every number, and rewrites
// assets/data/powerbi-prices.json. If a source can't be read or a number looks
// wrong, it keeps the old value and exits with an error so GitHub emails you.
// The PPU add-on is a footnote on the page: if it can't be confirmed, the old
// value stays and the run shows a warning instead of failing.
// Run locally: node scripts/update-powerbi-prices.mjs
import fs from 'node:fs';
import { pageText, perUserPrices, ppuAddon, checkAddon } from './powerbi-prices-read.mjs';

const FILE = 'assets/data/powerbi-prices.json';
const current = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const next = { ...current };
const problems = [];
const warnings = [];   // shown in the run (a GitHub warning), but the run still passes
const UA = { 'user-agent': 'Mozilla/5.0 (DataArcus weekly price check; +https://dataarcus.com)' };

// A new value is accepted only if it is in a sane range and within 50% of the old one.
const accept = (name, value, min, max) => {
  if (typeof value !== 'number' || Number.isNaN(value)) { problems.push(`${name}: could not read a value`); return; }
  if (value < min || value > max) { problems.push(`${name}: ${value} is outside the expected range ${min}-${max}`); return; }
  const old = current[name];
  if (old && Math.abs(value - old) / old > 0.5) { problems.push(`${name}: jumped from ${old} to ${value}, please check by hand`); return; }
  if (value !== old) console.log(`CHANGED ${name}: ${old} -> ${value}`);
  next[name] = value;
};

// ---------- 1. Power BI Pro, Premium Per User and the PPU add-on (Microsoft pricing page) ----------
try {
  const text = pageText(await (await fetch(current.sources.powerbi, { headers: UA })).text());
  const { pro, ppu } = perUserPrices(text);
  const addon = ppuAddon(text);
  console.log('Power BI page read:', { pro, ppu, ppuAddon: addon });
  accept('pro', pro, 5, 60);
  accept('ppu', ppu, 10, 120);
  if (next.ppu <= next.pro) { problems.push(`ppu (${next.ppu}) should be more than pro (${next.pro})`); next.pro = current.pro; next.ppu = current.ppu; }
  // the add-on is a footnote: when it can't be confirmed the old value stays and the run only warns
  const a = checkAddon(addon, { old: current.ppuAddon, ppu: next.ppu });
  if (a.problem) problems.push(a.problem);
  if (a.warning) warnings.push(a.warning);
  if (a.value !== current.ppuAddon) console.log(`CHANGED ppuAddon: ${current.ppuAddon} -> ${a.value}`);
  next.ppuAddon = a.value;
} catch (e) {
  problems.push(`Power BI pricing page could not be fetched: ${e.message}`);
}

// ---------- 2. Fabric capacity (Azure Retail Prices API, no login needed) ----------
try {
  let url = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent("serviceName eq 'Microsoft Fabric' and armRegionName eq 'eastus'")}`;
  const items = [];
  for (let page = 0; url && page < 10; page++) {
    const r = await (await fetch(url, { headers: UA })).json();
    items.push(...(r.Items || []));
    url = r.NextPageLink;
  }
  const isCapacity = (it) => /capacity/i.test(`${it.meterName} ${it.productName} ${it.skuName}`) && !/storage|onelake|mirror|copilot/i.test(`${it.meterName} ${it.productName}`);
  const payg = items.filter((it) => it.type === 'Consumption' && isCapacity(it) && /hour/i.test(it.unitOfMeasure));
  const res = items.filter((it) => it.type === 'Reservation' && isCapacity(it) && /^1 year/i.test(it.reservationTerm || ''));
  console.log(`Fabric API: ${items.length} items, ${payg.length} pay-as-you-go capacity meters, ${res.length} 1-year reservations`);
  payg.slice(0, 5).forEach((it) => console.log('  payg:', it.meterName, '|', it.productName, '|', it.unitOfMeasure, '|', it.retailPrice));
  res.slice(0, 5).forEach((it) => console.log('  reservation:', it.meterName, '|', it.productName, '|', it.unitOfMeasure, '|', it.retailPrice));

  // Price per capacity unit per hour: the smallest hourly capacity meter
  const perCu = payg.map((it) => it.retailPrice / (parseFloat(it.unitOfMeasure) || 1)).filter((v) => v > 0).sort((a, b) => a - b)[0];
  accept('cuPayg', perCu !== undefined ? Math.round(perCu * 10000) / 10000 : NaN, 0.05, 1);

  // Reservation saving: reservation prices are for the whole year per unit
  if (res.length && next.cuPayg) {
    const r1 = res.map((it) => it.retailPrice).filter((v) => v > 0).sort((a, b) => a - b)[0];
    const yearlyPayg = next.cuPayg * 8760;
    const saving = r1 > 10 ? 1 - r1 / yearlyPayg : 1 - r1 / next.cuPayg;
    accept('reservedSaving', Math.round(saving * 1000) / 1000, 0.15, 0.7);
  } else {
    console.log('No 1-year reservation price found; keeping reservedSaving', current.reservedSaving);
  }
} catch (e) {
  problems.push(`Azure Retail Prices API could not be read: ${e.message}`);
}

// ---------- write ----------
next.checked = new Date().toISOString().slice(0, 10);
fs.writeFileSync(FILE, JSON.stringify(next, null, 2) + '\n');
console.log('Saved', FILE, next);

// "::warning::" shows as a warning on the GitHub run; locally it is just a line
warnings.forEach((w) => console.log(`::warning::${w}`));
if (problems.length) {
  console.error('\nPRICE CHECK NEEDS ATTENTION:\n- ' + problems.join('\n- '));
  console.error('The old values were kept for anything listed above.');
  process.exit(1);
}
