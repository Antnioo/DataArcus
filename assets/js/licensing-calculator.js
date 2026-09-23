/*
 * DataArcus - Power BI Licensing Cost Calculator
 * Compares Pro, Premium Per User and Fabric capacity for a given number of
 * report creators and viewers. List prices in USD (US regions), converted to
 * AED/SAR at their fixed pegs. Not a quote: prices change and vary by agreement.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params); };
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);
  const STORE = 'dataarcus-licensing-calculator';

  // ---------- prices (USD list, checked September 2026) ----------
  const PRICES = {
    pro: 14,            // Power BI Pro, per user per month, paid yearly
    ppu: 24,            // Premium Per User, per user per month, paid yearly
    ppuAddon: 10,       // PPU for users who already have Pro (e.g. via Microsoft 365 E5)
    cuPayg: 0.18,       // Fabric capacity unit per hour, pay-as-you-go
    reservedSaving: 0.405, // Microsoft: annual reservation saves ~40.5%
    hours: 730
  };
  const SKUS = [2, 4, 8, 16, 32, 64, 128, 256];
  const FX = { USD: 1, AED: 3.6725, SAR: 3.75 }; // both currencies are pegged to USD

  const skuMonthly = (cu, billing) => {
    const payg = cu * PRICES.cuPayg * PRICES.hours;
    return billing === 'reserved' ? payg * (1 - PRICES.reservedSaving) : payg;
  };

  // ---------- state ----------
  const DEFAULTS = { creators: 10, viewers: 150, premium: false, fabric: false, e5: false, billing: 'reserved', small: 2, currency: 'USD', period: 'month' };
  let state;
  try { state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch (e) { state = { ...DEFAULTS }; }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } };

  const money = (usd) => {
    const v = usd * FX[state.currency] * (state.period === 'year' ? 12 : 1);
    return new Intl.NumberFormat(isAr() ? 'ar-u-nu-latn' : 'en-US', { style: 'currency', currency: state.currency, maximumFractionDigits: 0 }).format(v);
  };
  const perPeriod = () => L(state.period === 'year' ? '/ year' : '/ month', state.period === 'year' ? '/ سنويًا' : '/ شهريًا');

  // ---------- the comparison ----------
  const options = (viewersOverride) => {
    const c = Math.max(0, state.creators | 0), v = Math.max(0, viewersOverride == null ? state.viewers | 0 : viewersOverride), all = c + v;
    const pro = state.e5 ? 0 : PRICES.pro;
    const ppu = state.e5 ? PRICES.ppuAddon : PRICES.ppu;
    const f64 = skuMonthly(64, state.billing), fSmall = skuMonthly(state.small, state.billing);
    const bill = L(state.billing === 'reserved' ? 'reserved' : 'pay-as-you-go', state.billing === 'reserved' ? 'محجوزة سنويًا' : 'دفع حسب الاستخدام');
    const list = [
      { id: 'pro', name: L('Pro for everyone', 'Pro لكل المستخدمين'), cost: all * pro,
        ok: !state.premium && !state.fabric,
        why: !state.premium && !state.fabric ? '' : L('Pro alone has no Premium features or Fabric workloads.', 'Pro وحده لا يشمل مزايا Premium أو أحمال Fabric.'),
        detail: L(`${all} users × ${money(pro)}`, `${all} مستخدم × ${money(pro)}`) },
      { id: 'ppu', name: L('Premium Per User for everyone', 'Premium Per User لكل المستخدمين'), cost: all * ppu,
        ok: !state.fabric,
        why: state.fabric ? L('PPU does not include Fabric workloads like lakehouses and pipelines.', 'PPU لا يشمل أحمال Fabric مثل Lakehouse وخطوط البيانات.') : '',
        detail: L(`${all} users × ${money(ppu)}`, `${all} مستخدم × ${money(ppu)}`) },
      { id: 'small', name: L(`Fabric F${state.small} + Pro for everyone`, `Fabric F${state.small} + Pro لكل المستخدمين`), cost: fSmall + all * pro,
        ok: true, hidden: !state.premium && !state.fabric,
        detail: L(`F${state.small} ${bill} ${money(fSmall)} + ${all} × ${money(pro)}`, `F${state.small} ${bill} ${money(fSmall)} + ${all} × ${money(pro)}`) },
      { id: 'f64', name: L('Fabric F64 + Pro for creators only', 'Fabric F64 + Pro للمنشئين فقط'), cost: f64 + c * pro,
        ok: true,
        detail: L(`F64 ${bill} ${money(f64)} + ${c} creators × ${money(pro)}. Viewers are free.`, `F64 ${bill} ${money(f64)} + ${c} منشئ × ${money(pro)}. المشاهدون مجانًا.`) }
    ];
    return list.filter((o) => !o.hidden);
  };

  const render = () => {
    const list = options(), valid = list.filter((o) => o.ok);
    const best = valid.reduce((a, b) => (b.cost < a.cost ? b : a), valid[0]);
    const max = Math.max(...list.map((o) => o.cost), 1);
    $('bars').innerHTML = list.map((o) => {
      const w = Math.max(2, (o.cost / max) * 100);
      return `<div class="lc-row ${o === best ? 'best' : ''} ${o.ok ? '' : 'invalid'}">
        <div class="lc-head"><b>${o.name}</b>${o === best ? `<span class="lc-tag">${L('Cheapest option', 'الخيار الأوفر')}</span>` : ''}${o.ok ? '' : `<span class="lc-tag no">${L('Doesn’t fit your needs', 'لا يناسب احتياجاتك')}</span>`}</div>
        <div class="lc-bar"><span style="width:${w}%"></span></div>
        <div class="lc-foot"><span class="lc-cost">${money(o.cost)} <small>${perPeriod()}</small></span><span class="lc-detail">${o.ok ? o.detail : o.why}</span></div>
      </div>`;
    }).join('');

    // recommendation + break-even
    const v = state.viewers | 0;
    // Smallest viewer count where F64 beats every other option that fits (creators fixed)
    const f64Wins = (vv) => { const o = options(vv).filter((x) => x.ok); const f = o.find((x) => x.id === 'f64'); return o.every((x) => x === f || f.cost <= x.cost); };
    let breakEven = null;
    if (!f64Wins(v)) { let lo = v, hi = 100000; if (f64Wins(hi)) { while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (f64Wins(mid)) hi = mid; else lo = mid; } breakEven = hi; } }
    let rec = best ? L(`<b>${best.name}</b> is the cheapest fit: ${money(best.cost)} ${perPeriod()}.`, `<b>${best.name}</b> هو الخيار الأوفر المناسب: ${money(best.cost)} ${perPeriod()}.`) : '';
    if (breakEven && best && best.id !== 'f64') {
      rec += ' ' + L(`F64 becomes cheaper once you pass about <b>${breakEven.toLocaleString('en-US')} viewers</b>, because viewers on F64 need no license.`,
        `يصبح F64 أوفر عند تجاوز نحو <b>${breakEven.toLocaleString('en-US')} مشاهد</b>، لأن المشاهدين على F64 لا يحتاجون ترخيصًا.`);
    } else if (best && best.id === 'f64') {
      rec += ' ' + L(`With ${v.toLocaleString('en-US')} viewers, free viewing on F64 outweighs the capacity cost.`, `مع ${v.toLocaleString('en-US')} مشاهد، تفوق المشاهدة المجانية على F64 تكلفة السعة.`);
    }
    if (state.e5) rec += ' ' + L('Pro is counted as free because it is included in Microsoft 365 E5.', 'تم احتساب Pro مجانًا لأنه مشمول في Microsoft 365 E5.');
    $('rec').innerHTML = rec;
    $('fx').textContent = state.currency === 'USD' ? '' : L(`Converted at the fixed peg: 1 USD = ${FX[state.currency]} ${state.currency}.`, `التحويل بسعر الربط الثابت: 1 دولار = ${FX[state.currency]} ${state.currency}.`);
    $('smallWrap').style.display = state.premium || state.fabric ? '' : 'none';
    save();
  };

  // ---------- inputs ----------
  const num = (id, key) => { const el = $(id); el.value = state[key]; el.addEventListener('input', () => { state[key] = Math.max(0, Math.min(100000, parseInt(el.value, 10) || 0)); render(); }); };
  num('creators', 'creators'); num('viewers', 'viewers');
  ['premium', 'fabric', 'e5'].forEach((k) => { const el = $(k); el.checked = !!state[k]; el.addEventListener('change', () => { state[k] = el.checked; render(); track('licensing_option', { option: k, on: el.checked }); }); });
  const seg = (attr, key) => document.querySelectorAll(`[${attr}]`).forEach((b) => {
    b.classList.toggle('active', b.getAttribute(attr) === String(state[key]));
    b.addEventListener('click', () => { state[key] = b.getAttribute(attr); document.querySelectorAll(`[${attr}]`).forEach((x) => x.classList.toggle('active', x === b)); render(); });
  });
  seg('data-billing', 'billing'); seg('data-currency', 'currency'); seg('data-period', 'period');
  const small = $('small');
  small.innerHTML = SKUS.filter((s) => s < 64).map((s) => `<option value="${s}">F${s}</option>`).join('');
  small.value = state.small; small.addEventListener('change', () => { state.small = +small.value; render(); });
  document.querySelectorAll('[data-scenario]').forEach((b) => b.addEventListener('click', () => {
    const sc = { small: [3, 20], mid: [10, 150], large: [25, 800] }[b.dataset.scenario];
    state.creators = sc[0]; state.viewers = sc[1]; $('creators').value = sc[0]; $('viewers').value = sc[1];
    render(); track('licensing_scenario', { scenario: b.dataset.scenario });
  }));
  let tracked = false;
  ['creators', 'viewers'].forEach((id) => $(id).addEventListener('change', () => {
    if (!tracked) { tracked = true; track('licensing_calculate', { creators: state.creators, viewers: state.viewers }); }
  }));

  render();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
