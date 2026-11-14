import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { geocode } from './geo.js';

export default function HomePicker({ profile, setProfile }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);
  const [msg, setMsg] = useState('');
  const find = async () => {
    setMsg('');
    try { const r = await geocode(q); setRes(r); if (!r.length) setMsg('No places found.'); }
    catch { setMsg('Search failed. Check your connection.'); }
  };
  const pick = (p) => { setProfile({ ...profile, homeName: p.name, lat: p.lat, lon: p.lon }); setRes([]); setQ(''); };
  const gps = async () => {
    setMsg('');
    try {
      const p = await Geolocation.getCurrentPosition();
      setProfile({ ...profile, homeName: 'Current location', lat: p.coords.latitude, lon: p.coords.longitude });
    } catch { setMsg('Could not get your location. Allow location access and try again.'); }
  };
  return (
    <>
      <label>Home location for distance search</label>
      {profile.homeName && <p className="meta">Set to: {profile.homeName}</p>}
      <div className="row">
        <input placeholder="Search a city" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="ghost" type="button" onClick={find}>Search</button>
      </div>
      {res.map((p) => <button key={p.name} type="button" className="ghost" onClick={() => pick(p)}>{p.name}</button>)}
      <button className="ghost" type="button" onClick={gps}>Use my current location</button>
      {msg && <p className="notice">{msg}</p>}
    </>
  );
}
