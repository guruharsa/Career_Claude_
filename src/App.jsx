import { useEffect, useState } from 'react';
import { load, save } from './storage.js';

const STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
const EMPTY_PROFILE = { name: '', role: '', location: '' };

function Jobs({ jobs, setJobs }) {
  const [form, setForm] = useState({ title: '', company: '', link: '' });
  const [confirmId, setConfirmId] = useState(null);

  const add = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) return;
    setJobs([
      { id: Date.now().toString(), ...form, status: 'Saved', notes: '' },
      ...jobs,
    ]);
    setForm({ title: '', company: '', link: '' });
  };

  const patch = (id, changes) =>
    setJobs(jobs.map((j) => (j.id === id ? { ...j, ...changes } : j)));

  const remove = (id) => {
    if (confirmId === id) {
      setJobs(jobs.filter((j) => j.id !== id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  };

  return (
    <>
      <form className="panel" onSubmit={add}>
        <h2>Add a job</h2>
        <input
          placeholder="Job title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
        <input
          placeholder="Link to the posting"
          inputMode="url"
          autoCapitalize="none"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />
        <button className="primary" type="submit">Add job</button>
      </form>

      {jobs.length === 0 && (
        <p className="empty">No jobs yet. Add the first role you want to track.</p>
      )}

      {jobs.map((j) => (
        <article className="job" key={j.id}>
          <div className="job-head">
            <div>
              <h3>{j.title}</h3>
              <p className="company">{j.company}</p>
            </div>
            <span className={`badge s-${j.status}`}>{j.status}</span>
          </div>
          {j.link && (
            <a href={j.link.startsWith('http') ? j.link : `https://${j.link}`} target="_blank" rel="noreferrer">
              Open posting
            </a>
          )}
          <select value={j.status} onChange={(e) => patch(j.id, { status: e.target.value })}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <textarea
            placeholder="Notes"
            rows={3}
            value={j.notes}
            onChange={(e) => patch(j.id, { notes: e.target.value })}
          />
          <button className="danger" onClick={() => remove(j.id)}>
            {confirmId === j.id ? 'Tap again to delete' : 'Delete'}
          </button>
        </article>
      ))}
    </>
  );
}

function Profile({ profile, setProfile }) {
  return (
    <div className="panel">
      <h2>Your profile</h2>
      <label>Name</label>
      <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
      <label>Target role</label>
      <input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
      <label>Location</label>
      <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      setJobs(await load('jobs', []));
      setProfile(await load('profile', EMPTY_PROFILE));
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) save('jobs', jobs); }, [jobs, ready]);
  useEffect(() => { if (ready) save('profile', profile); }, [profile, ready]);

  if (!ready) return null;

  return (
    <div className="app">
      <header>
        <h1>{tab === 'jobs' ? 'Jobs' : 'Profile'}</h1>
        {tab === 'jobs' && <span className="count">{jobs.length} tracked</span>}
      </header>
      <main>
        {tab === 'jobs' ? (
          <Jobs jobs={jobs} setJobs={setJobs} />
        ) : (
          <Profile profile={profile} setProfile={setProfile} />
        )}
      </main>
      <nav>
        <button className={tab === 'jobs' ? 'on' : ''} onClick={() => setTab('jobs')}>Jobs</button>
        <button className={tab === 'profile' ? 'on' : ''} onClick={() => setTab('profile')}>Profile</button>
      </nav>
    </div>
  );
}
