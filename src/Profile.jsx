import { useState } from 'react';
import AiSettings from './AiSettings.jsx';
import HomePicker from './HomePicker.jsx';
import { CURRENCIES } from './salary.js';
import { exportData, eraseAll } from './data.js';

function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

export default function Profile({ profile, setProfile, jobs, resumes }) {
  const [typed, setTyped] = useState('');
  const [msg, setMsg] = useState('');
  const bind = (k) => ({ value: profile[k] || '', onChange: (e) => setProfile({ ...profile, [k]: e.target.value }) });
  return (
    <>
      <details className="panel sec" open>
        <summary>About you</summary>
        <div className="stack">
          <Field label="Name"><input {...bind('name')} /></Field>
          <Field label="Headline"><input {...bind('headline')} /></Field>
          <Field label="Target role"><input {...bind('role')} /></Field>
          <div className="grid2">
            <Field label="Email"><input inputMode="email" autoCapitalize="none" {...bind('email')} /></Field>
            <Field label="Phone"><input inputMode="tel" {...bind('phone')} /></Field>
          </div>
          <Field label="Summary"><textarea rows={3} {...bind('summary')} /></Field>
        </div>
      </details>

      <details className="panel sec">
        <summary>Location and preferences</summary>
        <div className="stack">
          <Field label="Location"><input {...bind('location')} /></Field>
          <HomePicker profile={profile} setProfile={setProfile} />
          <Field label="Other target locations (one per line)"><textarea rows={2} {...bind('targets')} /></Field>
          <Field label="Work mode">
            <select {...bind('mode')}>{['All', 'Remote', 'Hybrid', 'On-site'].map((m) => <option key={m}>{m}</option>)}</select>
          </Field>
          <div className="grid2">
            <Field label="Years of experience"><input inputMode="numeric" {...bind('years')} /></Field>
            <Field label="Notice (days)"><input inputMode="numeric" {...bind('notice')} /></Field>
          </div>
          <Field label="Expected salary per year">
            <div className="row">
              <input inputMode="numeric" {...bind('salary')} />
              <select style={{ width: 96, flex: 'none' }} {...bind('currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
          </Field>
        </div>
      </details>

      <details className="panel sec">
        <summary>Skills and resume text</summary>
        <div className="stack">
          <p className="meta">Uploading a resume fills these in. You can edit them.</p>
          <Field label="Skills (comma separated)"><textarea rows={3} {...bind('skills')} /></Field>
          <Field label="Resume text (the AI tools use only this)"><textarea rows={8} {...bind('resumeText')} /></Field>
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
          <input placeholder="Type DELETE to enable erase" value={typed} onChange={(e) => setTyped(e.target.value)} />
          <button className="danger" disabled={typed !== 'DELETE'} onClick={() => eraseAll(resumes)}>Erase all my data</button>
          {msg && <p className="notice">{msg}</p>}
        </div>
      </details>
    </>
  );
}
