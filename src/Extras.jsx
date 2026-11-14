import { useEffect, useState } from 'react';
import { skillGap, DOCS } from './skills.js';
import { shareIcs } from './ics.js';
import { parseSalary, getRates, convert, money } from './salary.js';

export default function Extras({ job, patch, profile }) {
  const [fx, setFx] = useState(null);
  const sal = parseSalary(job.salary);
  const target = profile.currency || 'INR';
  useEffect(() => {
    if (sal && sal.currency !== target) getRates().then(setFx).catch(() => setFx(null));
  }, [job.salary, target]);
  const gap = skillGap(job.description, profile.skills);

  return (
    <>
      <label>Interview date and time</label>
      <div className="row">
        <input type="datetime-local" value={job.interviewAt || ''} onChange={(e) => patch(job.id, { interviewAt: e.target.value })} />
        {job.interviewAt && <button className="ghost" onClick={() => shareIcs(job)}>Add to calendar</button>}
      </div>
      <label>Salary as posted (leave blank if not listed)</label>
      <input
        placeholder="e.g. 12-18 LPA or $120k-$150k"
        value={job.salary || ''}
        onChange={(e) => patch(job.id, { salary: e.target.value })}
      />
      {sal && sal.currency !== target && fx && (
        <p className="meta">
          ≈ {money(convert(sal.min, sal.currency, target, fx.rates), target)}
          {sal.max !== sal.min && ` – ${money(convert(sal.max, sal.currency, target, fx.rates), target)}`} per year.
          Rate 1 {sal.currency} = {(fx.rates[target] / fx.rates[sal.currency]).toFixed(4)} {target}, open.er-api.com, updated {fx.updated}.
        </p>
      )}
      {sal && sal.currency === target && (
        <p className="meta">{money(sal.min, target)}{sal.max !== sal.min && ` – ${money(sal.max, target)}`} per year</p>
      )}
      <label>Job description (paste it to see your skill gap)</label>
      <textarea
        rows={3}
        placeholder="Paste the posting text"
        value={job.description || ''}
        onChange={(e) => patch(job.id, { description: e.target.value })}
      />
      {gap.pct !== null && (
        <div className="gap">
          <p className="meta">
            Skill coverage: <b>{gap.pct}%</b> ({gap.have.length} of {gap.need.length} skills in the posting match your profile skills)
          </p>
          {gap.missing.length > 0 && (
            <>
              <p className="meta">Missing: {gap.missing.join(', ')}</p>
              {gap.missing.filter((s) => DOCS[s]).map((s) => (
                <a key={s} href={DOCS[s]} target="_blank" rel="noreferrer">Learn {s} (official docs)</a>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}
