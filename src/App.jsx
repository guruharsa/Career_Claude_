import { useEffect, useState } from 'react';
import { load, save } from './storage.js';
import Jobs from './Jobs.jsx';
import Discover from './Discover.jsx';
import Resumes from './Resumes.jsx';
import Insights from './Insights.jsx';
import Profile from './Profile.jsx';

const EMPTY_PROFILE = { name: '', role: '', location: '' };
const ICONS = {
  jobs: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></>,
  discover: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  resumes: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></>,
  insights: <path d="M5 20V10M12 20V4M19 20v-7" />,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
};
const TABS = [
  { id: 'jobs', label: 'Jobs' },
  { id: 'discover', label: 'Discover' },
  { id: 'resumes', label: 'Resumes' },
  { id: 'insights', label: 'Insights' },
  { id: 'profile', label: 'Profile' },
];

export default function App() {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      setJobs(await load('jobs', []));
      setResumes(await load('resumes', []));
      setProfile(await load('profile', EMPTY_PROFILE));
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) save('jobs', jobs); }, [jobs, ready]);
  useEffect(() => { if (ready) save('resumes', resumes); }, [resumes, ready]);
  useEffect(() => { if (ready) save('profile', profile); }, [profile, ready]);

  if (!ready) return null;

  const current = TABS.find((t) => t.id === tab);

  return (
    <div className="app">
      <header>
        <h1>{current.label}</h1>
        {tab === 'jobs' && <span className="count">{jobs.length} tracked</span>}
        {tab === 'resumes' && <span className="count">{resumes.length} saved</span>}
      </header>
      <main>
        {tab === 'jobs' && <Jobs jobs={jobs} setJobs={setJobs} profile={profile} />}
        {tab === 'discover' && <Discover jobs={jobs} setJobs={setJobs} profile={profile} />}
        {tab === 'resumes' && <Resumes resumes={resumes} setResumes={setResumes} profile={profile} setProfile={setProfile} />}
        {tab === 'insights' && <Insights jobs={jobs} profile={profile} />}
        {tab === 'profile' && <Profile profile={profile} setProfile={setProfile} jobs={jobs} resumes={resumes} />}
      </main>
      <nav>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <svg viewBox="0 0 24 24">{ICONS[t.id]}</svg>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
