import { useEffect, useState } from 'react';
import { load, save } from './storage.js';
import Jobs from './Jobs.jsx';
import Discover from './Discover.jsx';
import Resumes from './Resumes.jsx';
import Insights from './Insights.jsx';
import Profile from './Profile.jsx';

const EMPTY_PROFILE = { name: '', role: '', location: '' };
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
        {tab === 'discover' && <Discover jobs={jobs} setJobs={setJobs} profile={profile} />}
        {tab === 'resumes' && <span className="count">{resumes.length} saved</span>}
      </header>
      <main>
        {tab === 'jobs' && <Jobs jobs={jobs} setJobs={setJobs} profile={profile} />}
        {tab === 'resumes' && <Resumes resumes={resumes} setResumes={setResumes} />}
        {tab === 'insights' && <Insights jobs={jobs} profile={profile} />}
        {tab === 'profile' && <Profile profile={profile} setProfile={setProfile} jobs={jobs} resumes={resumes} />}
      </main>
      <nav>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
