import { STATUSES } from './Jobs.jsx';
import { skillGap } from './skills.js';

export default function Insights({ jobs, profile }) {
  const max = Math.max(1, ...STATUSES.map((s) => jobs.filter((j) => j.status === s).length));
  const week = Date.now() - 7 * 864e5;
  const added = jobs.filter((j) => Number(j.id) > week).length;
  const applied = jobs.filter((j) => !['Saved', 'Interested'].includes(j.status)).length;
  const interviews = jobs.filter((j) => ['Interview', 'Offer'].includes(j.status)).length;
  const missing = {};
  jobs.forEach((j) => skillGap(j.description, profile.skills).missing.forEach((s) => (missing[s] = (missing[s] || 0) + 1)));
  const top = Object.entries(missing).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <div className="panel">
        <h2>Pipeline</h2>
        {STATUSES.map((s) => {
          const n = jobs.filter((j) => j.status === s).length;
          return (
            <div className="bar-row" key={s}>
              <span>{s}</span>
              <div className="bar"><i className={`s-${s}`} style={{ width: `${(n / max) * 100}%` }} /></div>
              <b>{n}</b>
            </div>
          );
        })}
      </div>
      <div className="panel">
        <h2>Activity</h2>
        <p className="meta">{added} added in the last 7 days · {applied} applied or further · {interviews} at interview or offer</p>
        {applied > 0 && <p className="meta">Interview rate: {Math.round((interviews / applied) * 100)}%</p>}
      </div>
      <div className="panel">
        <h2>Top missing skills</h2>
        {top.length === 0 ? (
          <p className="meta">Add profile skills and paste job descriptions to see gaps across your jobs.</p>
        ) : top.map(([s, n]) => <p className="meta" key={s}>{s}: missing in {n} job{n > 1 ? 's' : ''}</p>)}
      </div>
    </>
  );
}
