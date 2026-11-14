import { useEffect, useState } from 'react';
import { load, save } from './storage.js';
import { PROVIDERS, validate } from './ai.js';

const EMPTY = { provider: 'gemini', key: '', model: '', baseUrl: '' };

export default function AiSettings() {
  const [cfg, setCfg] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { load('ai', EMPTY).then((c) => { setCfg(c); setReady(true); }); }, []);
  useEffect(() => { if (ready) save('ai', cfg); }, [cfg, ready]);
  const set = (k) => (e) => setCfg({ ...cfg, [k]: e.target.value });
  const check = async () => {
    setBusy(true);
    const r = await validate(cfg);
    setRes(r);
    if (r.models.length && !r.models.includes(cfg.model)) setCfg({ ...cfg, model: r.models[0] });
    setBusy(false);
  };
  return (
    <>
      <p className="meta">Your key stays on this phone and is sent only to the provider you pick. It is not separately encrypted.</p>
      <label>Provider</label>
      <select value={cfg.provider} onChange={(e) => { setCfg({ ...EMPTY, provider: e.target.value }); setRes(null); }}>
        {Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {cfg.provider === 'ollama'
        ? <><label>Server address</label><input placeholder="http://192.168.1.10:11434" autoCapitalize="none" value={cfg.baseUrl} onChange={set('baseUrl')} /></>
        : <><label>API key</label><input type="password" autoCapitalize="none" value={cfg.key} onChange={set('key')} /></>}
      <button className="ghost" disabled={busy} onClick={check}>{busy ? 'Checking…' : 'Check connection'}</button>
      {res && <p className={`status ${res.color}`}>{res.message} {res.ms} ms</p>}
      <label>Model</label>
      {res && res.models.length
        ? <select value={cfg.model} onChange={set('model')}>{res.models.map((m) => <option key={m}>{m}</option>)}</select>
        : <input placeholder="Run the check to list models" value={cfg.model} onChange={set('model')} />}
    </>
  );
}
