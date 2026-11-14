const plain = (html = '') => {
  const p = new DOMParser();
  let s = p.parseFromString(html, 'text/html').documentElement.textContent || '';
  s = p.parseFromString(s, 'text/html').documentElement.textContent || '';
  return s.replace(/\s+/g, ' ').trim();
};

export function isSafeUrl(u) {
  try {
    const x = new URL(u);
    const h = x.hostname;
    if (x.protocol !== 'https:' || !h.includes('.')) return false;
    return !/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(h);
  } catch { return false; }
}
export const urlKey = (u) => {
  try { const x = new URL(u); return (x.hostname + x.pathname).toLowerCase().replace(/\/$/, ''); } catch { return u; }
};

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
const iso = (v) => (v ? new Date(v).toISOString() : null);
const e = encodeURIComponent;

const PROVIDERS = {
  async Greenhouse(t) {
    const d = await getJson(`https://boards-api.greenhouse.io/v1/boards/${e(t)}/jobs?content=true`);
    return (d.jobs || []).map((j) => ({
      title: j.title, company: j.company_name || t, location: j.location?.name || '',
      remote: /remote/i.test(j.location?.name || ''), url: j.absolute_url, description: plain(j.content),
      salary: '', publishedAt: iso(j.first_published || j.updated_at),
    }));
  },
  async Lever(t) {
    const d = await getJson(`https://api.lever.co/v0/postings/${e(t)}?mode=json`);
    return (Array.isArray(d) ? d : []).map((j) => {
      const r = j.salaryRange;
      return {
        title: j.text, company: t, location: j.categories?.location || '',
        remote: j.workplaceType === 'remote' || /remote/i.test(j.categories?.location || ''),
        url: j.hostedUrl, description: plain(j.descriptionPlain || ''),
        salary: r ? `${r.currency} ${r.min}-${r.max} ${r.interval || ''}` : '', publishedAt: iso(j.createdAt),
      };
    });
  },
  async Ashby(t) {
    const d = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${e(t)}?includeCompensation=true`);
    return (d.jobs || []).map((j) => ({
      title: j.title, company: t, location: j.location || '', remote: !!j.isRemote || j.workplaceType === 'Remote',
      url: j.jobUrl, description: plain(j.descriptionPlain || ''),
      salary: j.compensation?.compensationTierSummary || '', publishedAt: iso(j.publishedAt),
    }));
  },
};
export const PROVIDER_NAMES = Object.keys(PROVIDERS);

// Fetches live feeds. Listings keep their first discoveredAt; ones missing from a live feed become Removed.
export async function refreshBoards(boards, existing) {
  const now = new Date().toISOString();
  const map = new Map(existing.map((l) => [l.key, l]));
  const failed = [];
  for (const b of boards) {
    try {
      const jobs = await PROVIDERS[b.provider](b.token);
      const seen = new Set();
      for (const j of jobs) {
        if (!j.url) continue;
        const key = urlKey(j.url);
        seen.add(key);
        map.set(key, { ...j, description: j.description.slice(0, 3000), key, boardId: b.id, source: b.provider,
          discoveredAt: map.get(key)?.discoveredAt || now, lastCheckedAt: now, status: 'Verified Active' });
      }
      for (const l of map.values()) if (l.boardId === b.id && !seen.has(l.key)) map.set(l.key, { ...l, status: 'Removed', lastCheckedAt: now });
    } catch {
      failed.push(`${b.provider}/${b.token}`);
      for (const l of map.values()) if (l.boardId === b.id) map.set(l.key, { ...l, status: 'Source Unavailable', lastCheckedAt: now });
    }
  }
  return { listings: [...map.values()], failed };
}

export async function searchAdzuna(cfg, what, where, existing) {
  const q = `app_id=${e(cfg.id)}&app_key=${e(cfg.key)}&results_per_page=30&what=${e(what)}&where=${e(where)}`;
  const d = await getJson(`https://api.adzuna.com/v1/api/jobs/${e(cfg.country || 'in')}/search/1?${q}`);
  const now = new Date().toISOString();
  const map = new Map(existing.map((l) => [l.key, l]));
  for (const j of d.results || []) {
    const key = urlKey(j.redirect_url);
    const sal = j.salary_min ? `${j.salary_min}-${j.salary_max || j.salary_min}` : '';
    map.set(key, { title: j.title, company: j.company?.display_name || '', location: j.location?.display_name || '',
      remote: /remote/i.test(`${j.title} ${j.location?.display_name}`), url: j.redirect_url, description: plain(j.description).slice(0, 3000),
      salary: sal, publishedAt: iso(j.created), key, source: 'Adzuna', discoveredAt: map.get(key)?.discoveredAt || now,
      lastCheckedAt: map.get(key)?.lastCheckedAt || null, status: map.get(key)?.status || 'Not Yet Verified' });
  }
  return [...map.values()];
}

export async function probeUrl(url) {
  if (!isSafeUrl(url)) return 'Source Unavailable';
  try {
    const r = await fetch(url);
    if (r.status === 410) return 'Expired';
    if (r.status === 404) return 'Removed';
    return r.ok ? 'Possibly Active' : 'Source Unavailable';
  } catch { return 'Source Unavailable'; }
}
