import { useEffect, useState } from 'react';
import { load } from './storage.js';
import { callAi, PROVIDERS } from './ai.js';
import { factGate, atsScore, changedLines } from './factcheck.js';
import { exportPdf } from './pdf.js';

const RULES = 'Use ONLY facts in the text provided. Never invent experience, tools, numbers or pay. If something is missing, say so.';
const EVAL = `${RULES} Evaluate the job for the candidate in sections: A Role profile, B Tech stack fit, C Seniority match, D Compensation (write "Not listed" if no pay is given), E Culture signals, F Growth, G Red flags, H Overall. End with a final line exactly: SCORE: x.x (a number from 1.0 to 5.0).`;
const PREP = (kind) => `${RULES} Write 8 ${kind} interview questions for this job. Then write 3 STAR answer outlines (Situation, Task, Action, Result) built only from achievements in the resume; where the resume lacks detail write "Add detail here".`;
const TAILOR = `${RULES} Rewrite the resume to match the job's keywords. Keep every number, date, employer and tool exactly as in the original. Do not add skills the resume does not contain. Return only the resume text with the same section headings.`;

export default function AiPanel({ job, patch, profile }) {
  const [cfg, setCfg] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [kind, setKind] = useState('Technical');
  useEffect(() => { load('ai', null).then(setCfg); }, []);

  const resume = profile.resumeText || '';
  const ask = (type, system, user) => {
    setErr('');
    if (!cfg || !cfg.model || (cfg.provider !== 'ollama' && !cfg.key)) return setErr('Set up and check an AI provider in Profile first.');
    if (!job.description) return setErr('Paste the job description first.');
    if (!resume) return setErr('Paste your resume text in Profile first.');
    setPending({ type, system, user });
  };
  const send = async () => {
    setBusy(true);
    try {
      const text = await callAi(cfg, pending.system, pending.user);
      if (pending.type === 'eval') patch(job.id, { evalText: text, evalScore: (text.match(/SCORE:\s*([0-5](?:\.\d)?)/i) || [])[1] || '' });
      if (pending.type === 'prep') patch(job.id, { prepText: text });
      if (pending.type === 'tailor') patch(job.id, { tailored: text });
      setPending(null);
    } catch (e) { setErr(e.message); setPending(null); }
    setBusy(false);
  };
  const input = `JOB:\n${job.description}\n\nRESUME:\n${resume}`;
  const gate = job.tailored ? factGate(resume, job.tailored) : null;
  const ats = job.tailored ? atsScore(job.tailored) : null;

  return (
    <div className="ai stack">
      <label>AI tools</label>
      <div className="row wrap">
        <button className="ghost" onClick={() => ask('eval', EVAL, input)}>Evaluate fit</button>
        <button className="ghost" onClick={() => ask('tailor', TAILOR, input)}>Tailor resume</button>
      </div>
      <div className="row">
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {['Technical', 'HR', 'Behavioral', 'System design'].map((k) => <option key={k}>{k}</option>)}
        </select>
        <button className="ghost" onClick={() => ask('prep', PREP(kind), input)}>Interview prep</button>
      </div>
      {err && <p className="notice">{err}</p>}

      {pending && (
        <div className="consent stack">
          <b>Send to {PROVIDERS[cfg.provider]}?</b>
          <p className="meta">This text leaves your phone ({pending.user.length} characters). Nothing is sent until you approve.</p>
          <pre>{pending.user.slice(0, 1200)}{pending.user.length > 1200 ? '…' : ''}</pre>
          <div className="row">
            <button className="ghost grow" onClick={() => setPending(null)}>Cancel</button>
            <button className="primary grow" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send'}</button>
          </div>
        </div>
      )}

      {job.evalText && <><label>Evaluation{job.evalScore && ` · score ${job.evalScore} / 5`}</label><pre>{job.evalText}</pre></>}
      {job.prepText && <><label>Interview prep</label><pre>{job.prepText}</pre></>}

      {job.tailored && (
        <>
          <label>Tailored resume (you can edit)</label>
          <textarea rows={10} value={job.tailored} onChange={(e) => patch(job.id, { tailored: e.target.value })} />
          <p className={`status ${gate.ok ? 'green' : 'red'}`}>
            {gate.ok ? 'Fact check passed: every number and skill is in your resume.' : 'Fact check failed. Fix these before exporting:'}
          </p>
          {gate.issues.map((i) => <p className="meta" key={i}>• {i}</p>)}
          <p className="meta">ATS format score: <b>{ats.score}/100 ({ats.grade})</b></p>
          {ats.tips.map((t) => <p className="meta" key={t}>• {t}</p>)}
          <label>Changes from your resume</label>
          <div className="diff">
            {changedLines(resume, job.tailored).map((l, i) => <p key={i} className={l.changed ? 'chg' : ''}>{l.text || ' '}</p>)}
          </div>
          <button className="primary" disabled={!gate.ok} onClick={() => exportPdf(job.tailored, `${job.company}-${job.title}`).catch((e) => setErr(e.message))}>
            Export PDF
          </button>
        </>
      )}
    </div>
  );
}
