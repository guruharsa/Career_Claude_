import { useState } from 'react';
import AiSettings from './AiSettings.jsx';
import HomePicker from './HomePicker.jsx';
import { CURRENCIES } from './salary.js';
import { exportData, eraseAll } from './data.js';

export default function Profile({ profile, setProfile, jobs, resumes }) {
  const [typed, setTyped] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });
  return (
    <>
      <details className="panel sec" open>
        <summary>Your profile</summary>
        <div className="stack">
        <label>Name</label><input value={profile.name} onChange={set('name')} />
        <label>Headline</label><input value={profile.headline || ''} onChange={set('headline')} />
        <label>Target role</label><input value={profile.role} onChange={set('role')} />
        <label>Summary</label><textarea rows={3} value={profile.summary || ''} onChange={set('summary')} />
        <label>Location</label><input value={profile.location} onChange={set('location')} />
        <HomePicker profile={profile} setProfile={setProfile} />
        <label>Other target locations (one per line)</label>
        <textarea rows={2} value={profile.targets || ''} onChange={set('targets')} />
        <label>Work mode</label>
        <select value={profile.mode || 'All'} onChange={set('mode')}>
          {['All', 'Remote', 'Hybrid', 'On-site'].map((m) => <option key={m}>{m}</option>)}
        </select>
        <label>Years of experience</label><input inputMode="numeric" value={profile.years || ''} onChange={set('years')} />
        <label>Notice period (days)</label><input inputMode="numeric" value={profile.notice || ''} onChange={set('notice')} />
        <label>Expected salary per year</label>
        <div className="row">
          <input inputMode="numeric" value={profile.salary || ''} onChange={set('salary')} />
          <select value={profile.currency || 'INR'} onChange={set('currency')} style={{ width: 96 }}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <label>Skills (comma separated, used for skill-gap checks)</label>
        <textarea rows={2} value={profile.skills || ''} onChange={set('skills')} />
        <label>Baseline resume text (the AI tools use only this; paste your primary resume)</label>
        <textarea rows={6} value={profile.resumeText || ''} onChange={set('resumeText')} />
        </div>
      </details>
      <details className="panel sec">
        <summary>AI provider</summary>
        <div className="stack"><AiSettings /></div>
      </details>
      <details className="panel sec">
        <summary>Your data</summary>
        <div className="stack">
        <p className="meta">Everything is stored on this phone. Export it, or erase it permanently.</p>
        <button className="ghost" onClick={() => exportData(jobs, resumes, profile).catch(() => setMsg('Could not export.'))}>Export my data</button>
        <input placeholder='Type DELETE to enable erase' value={typed} onChange={(e) => setTyped(e.target.value)} />
        <button className="danger" disabled={typed !== 'DELETE'} onClick={() => eraseAll(resumes)}>Erase all my data</button>
        {msg && <p className="notice">{msg}</p>}
        </div>
      </details>
    </>
  );
}
