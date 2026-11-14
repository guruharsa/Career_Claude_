import { load, save } from './storage.js';

// Nominatim allows 1 request per second, so calls are queued with a gap
let last = Promise.resolve();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const queued = (fn) => { const run = last.then(fn); last = run.catch(() => {}).then(() => wait(1100)); return run; };
const search = (q, limit) => queued(async () => {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&q=${encodeURIComponent(q)}`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'CareerTracker/1.0 (Android app)' } });
  if (!r.ok) throw new Error('geocode failed');
  return r.json();
});

export async function geocode(q) {
  if (!q.trim()) return [];
  return (await search(q, 5)).map((x) => ({ name: x.display_name, lat: Number(x.lat), lon: Number(x.lon) }));
}
export async function geocodeCached(text) {
  const cache = await load('geo', {});
  if (text in cache) return cache[text];
  const d = await search(text, 1);
  cache[text] = d[0] ? { lat: Number(d[0].lat), lon: Number(d[0].lon) } : null;
  await save('geo', cache);
  return cache[text];
}
export function haversine(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
