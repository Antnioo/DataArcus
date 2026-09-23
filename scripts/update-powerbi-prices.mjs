// Weekly price check for the Power BI Licensing Cost Calculator.
// Reads Microsoft's public sources, sanity-checks every number, and rewrites
// assets/data/powerbi-prices.json. If a source can't be read or a number looks
// wrong, it keeps the old value and exits with an error so GitHub emails you.
// Run locally: node scripts/update-powerbi-prices.mjs
import fs from 'node:fs';

const FILE = 'assets/data/powerbi-prices.json';
const current = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const next = { ...current };
const problems = [];
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

// ---------- 1. Power BI Pro and Premium Per User (Microsoft pricing page) ----------
try {
  const html = await (await fetch(current.sources.powerbi, { headers: UA })).text();
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
  // Each "$NN.NN user/month" belongs to the product name that appears closest before it.
  // (Product names also appear in menus, so "first price after the label" is not enough.)
  const LABELS = { pro: 'Power BI Pro', ppu: 'Premium Per User' };
  const labelHits = Object.entries(LABELS).flatMap(([key, label]) => [...text.matchAll(new RegExp(label, 'g'))].map((m) => ({ key, i: m.index })));
  const found = {};
  for (const m of text.matchAll(/\$\s?(\d{1,3}(?:\.\d{2})?)\s*(?:USD\s*)?(?:per\s*)?user\s*\/\s*month/gi)) {
    const owner = labelHits.filter((h) => h.i < m.index).sort((a, b) => b.i - a.i)[0];
    if (owner && found[owner.key] === undefined && m.index - owner.i < 600) found[owner.key] = parseFloat(m[1]);
  }
  const priceAfter = (label) => found[Object.keys(LABELS).find((k) => LABELS[k] === label)] ?? null;
  const pro = priceAfter('Power BI Pro');
  const ppu = priceAfter('Premium Per User');
  console.log('Power BI page read:', { pro, ppu });
  accept('pro', pro, 5, 60);
  accept('ppu', ppu, 10, 120);
  if (next.ppu <= next.pro) { problems.push(`ppu (${next.ppu}) should be more than pro (${next.pro})`); next.pro = current.pro; next.ppu = current.ppu; }
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

if (problems.length) {
  console.error('\nPRICE CHECK NEEDS ATTENTION:\n- ' + problems.join('\n- '));
  console.error('The old values were kept for anything listed above.');
  process.exit(1);
}
