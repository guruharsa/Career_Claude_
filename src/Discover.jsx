import { useEffect, useMemo, useState } from 'react';
import { load, save } from './storage.js';
import { PROVIDER_NAMES, refreshBoards, searchAdzuna, probeUrl } from './discover.js';

const BADGE = { 'Verified Active': 's-Offer', 'Possibly Active': 's-Interview', Expired: 's-Rejected', Removed: 's-Rejected', 'Source Unavailable': 's-Saved', 'Not Yet Verified': 's-Saved' };
const day = (d) => (d ? new Date(d).toLocaleDateString([], { dateStyle: 'medium' }) : 'not provided');

export default function Discover({ jobs, setJobs }) {
  const [boards, setBoards] = useState([]);
  const [listings, setListings] = useState([]);
  const [adz, setAdz] = useState({ id: '', key: '', country: 'in' });
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({ provider: PROVIDER_NAMES[0], token: '' });
  const [q, setQ] = useState({ what: '', where: '', remote: false });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      setBoards(await load('boards', []));
      setListings(await load('listings', []));
      setAdz(await load('adzuna', { id: '', key: '', country: 'in' }));
      setReady(true);
    })();
  }, []);
  useEffect(() => { if (ready) save('boards', boards); }, [boards, ready]);
  useEffect(() => { if (ready) save('listings', listings); }, [listings, ready]);
  useEffect(() => { if (ready) save('adzuna', adz); }, [adz, ready]);

  const shown = useMemo(() => {
    const w = q.what.trim().toLowerCase(), l = q.where.trim().toLowerCase();
    return listings
      .filter((x) => (!w || `${x.title} ${x.description}`.toLowerCase().includes(w)) && (!l || x.location.toLowerCase().includes(l)) && (!q.remote || x.remote))
      .sort((a, b) => (b.publishedAt || b.discoveredAt).localeCompare(a.publishedAt || a.discoveredAt))
      .slice(0, 40);
  }, [listings, q]);

  const run = async (fn) => { setBusy(true); setNote(''); try { await fn(); } catch { setNote('Request failed. Check your connection and keys.'); } setBusy(false); };

  const addBoard = (ev) => {
    ev.preventDefault();
    const token = form.token.trim();
    if (token) setBoards((p) => [...p, { id: Date.now().toString(), provider: form.provider, token }]);
    setForm({ ...form, token: '' });
  };
  const refresh = () => run(async () => {
    if (!boards.length) return setNote('Add a company board first.');
    const r = await refreshBoards(boards, listings);
    setListings(r.listings);
    setNote(r.failed.length ? `Could not reach: ${r.failed.join(', ')}. Check the company names.` : 'Listings refreshed from live feeds.');
  });
  const aggregator = () => run(async () => {
    if (!adz.id || !adz.key) return setNote('Enter your Adzuna app id and key first.');
    setListings(await searchAdzuna(adz, q.what, q.where, listings));
  });
  const check = (l) => run(async () => {
    const b = boards.find((x) => x.id === l.boardId);
    if (b) return setListings((await refreshBoards([b], listings)).listings);
    const status = await probeUrl(l.url);
    setListings((p) => p.map((x) => (x.key === l.key ? { ...x, status, lastCheckedAt: new Date().toISOString() } : x)));
  });
  const saveJob = (l) => {
    if (jobs.some((j) => j.link === l.url)) return setNote('Already in your Jobs.');
    setJobs((p) => [{ id: Date.now().toString(), title: l.title, company: l.company, link: l.url, status: 'Saved', notes: '', remindAt: '', description: l.description, salary: l.salary || '' }, ...p]);
    setNote('Saved to Jobs.');
  };

  return (
    <>
      <form className="panel" onSubmit={addBoard}>
        <h2>Company boards</h2>
        <p className="meta">Add a company's career page name (the part after boards.greenhouse.io/, jobs.lever.co/ or jobs.ashbyhq.com/).</p>
        <div className="row">
          <select style={{ width: 120 }} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
            {PROVIDER_NAMES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <input placeholder="company name" autoCapitalize="none" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
        </div>
        <button className="ghost" type="submit">Add board</button>
        {boards.map((b) => (
          <div className="row" key={b.id}>
            <span className="grow meta">{b.provider}: {b.token}</span>
            <button className="ghost" type="button" onClick={() => setBoards((p) => p.filter((x) => x.id !== b.id))}>Remove</button>
          </div>
        ))}
        <button className="primary" type="button" disabled={busy} onClick={refresh}>{busy ? 'Working…' : 'Refresh listings'}</button>
      </form>

      <div className="panel">
        <h2>Adzuna search (optional)</h2>
        <p className="meta">Uses your own free Adzuna keys, stored only on this phone. Country is a two-letter code such as in, gb or us.</p>
        <input placeholder="App id" value={adz.id} onChange={(e) => setAdz({ ...adz, id: e.target.value })} />
        <input placeholder="App key" type="password" value={adz.key} onChange={(e) => setAdz({ ...adz, key: e.target.value })} />
        <input placeholder="Country code" value={adz.country} onChange={(e) => setAdz({ ...adz, country: e.target.value })} />
        <button className="ghost" disabled={busy} onClick={aggregator}>Search Adzuna with the filters below</button>
      </div>

      <div className="filters">
        <input type="search" placeholder="Keyword" value={q.what} onChange={(e) => setQ({ ...q, what: e.target.value })} />
        <input type="search" placeholder="Location" value={q.where} onChange={(e) => setQ({ ...q, where: e.target.value })} />
        <button className={`chip ${q.remote ? 'on' : ''}`} onClick={() => setQ({ ...q, remote: !q.remote })}>Remote only</button>
      </div>
      {note && <p className="notice">{note}</p>}
      {listings.length === 0 && <p className="empty">No listings yet. Add a board and refresh, or search Adzuna.</p>}

      {shown.map((l) => (
        <article className="job" key={l.key}>
          <div className="job-head">
            <div><h3>{l.title}</h3><p className="company">{l.company}</p></div>
            <span className={`badge ${BADGE[l.status]}`}>{l.status}</span>
          </div>
          <p className="meta">{l.source}{l.remote ? ' · Remote' : ''} · {l.location || 'Location not listed'}</p>
          {l.salary && <p className="meta">Salary as posted: {l.salary}</p>}
          <p className="meta">Published {day(l.publishedAt)} · Found {day(l.discoveredAt)} · Checked {day(l.lastCheckedAt)}</p>
          <a href={l.url} target="_blank" rel="noreferrer">Open posting</a>
          <div className="row">
            <button className="ghost grow" disabled={busy} onClick={() => check(l)}>Check if live</button>
            <button className="primary grow" onClick={() => saveJob(l)}>Save to Jobs</button>
          </div>
        </article>
      ))}
    </>
  );
}
