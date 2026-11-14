import { useMemo, useState } from 'react';
import Extras from './Extras.jsx';
import { scheduleReminder, cancelReminder } from './reminders.js';

export const STATUSES = ['Saved', 'Interested', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

const fmt = (iso) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function Jobs({ jobs, setJobs, profile }) {
  const [form, setForm] = useState({ title: '', company: '', link: '' });
  const [confirmId, setConfirmId] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [notice, setNotice] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (filter === 'All' || j.status === filter) &&
        (!q || [j.title, j.company, j.notes].some((t) => (t || '').toLowerCase().includes(q)))
    );
  }, [jobs, query, filter]);

  const counts = useMemo(() => {
    const c = { All: jobs.length };
    STATUSES.forEach((s) => (c[s] = jobs.filter((j) => j.status === s).length));
    return c;
  }, [jobs]);

  const add = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) return;
    setJobs((prev) => [
      { id: Date.now().toString(), ...form, status: 'Saved', notes: '', remindAt: '' },
      ...prev,
    ]);
    setForm({ title: '', company: '', link: '' });
  };

  const patch = (id, changes) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...changes } : j)));

  const remove = (id) => {
    if (confirmId === id) {
      cancelReminder(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  };

  const setReminder = async (job, value) => {
    setNotice('');
    if (!value) {
      patch(job.id, { remindAt: '' });
      await cancelReminder(job.id);
      return;
    }
    if (new Date(value).getTime() <= Date.now()) {
      setNotice('Pick a reminder time in the future.');
      return;
    }
    patch(job.id, { remindAt: value });
    const result = await scheduleReminder({ ...job, remindAt: value });
    setNotice(result.message);
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

      {jobs.length > 0 && (
        <div className="filters">
          <input
            type="search"
            placeholder="Search title, company or notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="chips">
            {['All', ...STATUSES].map((s) => (
              <button
                key={s}
                className={`chip ${filter === s ? 'on' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s} {counts[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {notice && <p className="notice">{notice}</p>}

      {jobs.length === 0 && (
        <p className="empty">No jobs yet. Add the first role you want to track.</p>
      )}
      {jobs.length > 0 && visible.length === 0 && (
        <p className="empty">No jobs match this search and filter.</p>
      )}

      {visible.map((j) => {
        const passed = j.remindAt && new Date(j.remindAt).getTime() <= Date.now();
        return (
          <article className="job" key={j.id}>
            <div className="job-head">
              <div>
                <h3>{j.title}</h3>
                <p className="company">{j.company}</p>
              </div>
              <span className={`badge s-${j.status}`}>{j.status}</span>
            </div>
            {j.link && (
              <a
                href={j.link.startsWith('http') ? j.link : `https://${j.link}`}
                target="_blank"
                rel="noreferrer"
              >
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
            <Extras job={j} patch={patch} profile={profile} />
            <label>Follow-up reminder</label>
            <div className="row">
              <input
                type="datetime-local"
                value={j.remindAt || ''}
                onChange={(e) => setReminder(j, e.target.value)}
              />
              {j.remindAt && (
                <button className="ghost" onClick={() => setReminder(j, '')}>Clear</button>
              )}
            </div>
            {j.remindAt && (
              <p className={`meta ${passed ? 'late' : ''}`}>
                {passed ? 'Reminder time has passed' : `Reminds you ${fmt(j.remindAt)}`}
              </p>
            )}
            <button className="danger" onClick={() => remove(j.id)}>
              {confirmId === j.id ? 'Tap again to delete' : 'Delete'}
            </button>
          </article>
        );
      })}
    </>
  );
}
