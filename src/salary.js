import { load, save } from './storage.js';
export const CURRENCIES = ['INR','USD','EUR','GBP','AED','SGD','CAD','AUD','JPY'];
const SYMBOLS = [['₹','INR'],['$','USD'],['€','EUR'],['£','GBP'],['¥','JPY']];

// Parses text such as "12-18 LPA", "25 Lakhs per year", "$120k-$150k". Returns annual figures or null.
export function parseSalary(raw = '') {
  const t = raw.trim();
  if (!t) return null;
  const lpa = t.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(\d+(?:\.\d+)?)?\s*(?:lpa|lakhs?|lacs?)/i);
  if (lpa) {
    const a = parseFloat(lpa[1]) * 1e5;
    return { min: a, max: lpa[2] ? parseFloat(lpa[2]) * 1e5 : a, currency: 'INR' };
  }
  let currency = CURRENCIES.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(t));
  if (!currency) currency = (SYMBOLS.find(([s]) => t.includes(s)) || [])[1];
  if (!currency) return null;
  const nums = [...t.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k)?/gi)].map((m) => parseFloat(m[1].replace(/,/g, '')) * (m[2] ? 1000 : 1));
  if (!nums.length) return null;
  const mult = /month/i.test(t) ? 12 : /hour/i.test(t) ? 2080 : 1;
  return { min: nums[0] * mult, max: (nums[1] ?? nums[0]) * mult, currency };
}

export async function getRates() {
  const cached = await load('fx', null);
  if (cached && Date.now() - cached.at < 12 * 3600 * 1000) return cached;
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  const data = await res.json();
  if (!data.rates) throw new Error('No rates');
  const fx = { at: Date.now(), rates: data.rates, updated: data.time_last_update_utc };
  await save('fx', fx);
  return fx;
}
export const convert = (amount, from, to, rates) => (amount / rates[from]) * rates[to];
export const money = (n, cur) => `${cur} ${Math.round(n).toLocaleString()}`;
