import { useEffect, useRef, useState } from 'react';
import { storeResume, removeResume, shareResume, loadResumeFile } from './resumes.js';
import { extractText } from './extract.js';
import { parseResume, fillProfile } from './parse.js';
import { atsScore } from './factcheck.js';

const size = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Resumes({ resumes, setResumes, profile, setProfile }) {
  const inputRef = useRef(null);
  const started = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const patch = (id, ch) => setResumes((p) => p.map((x) => (x.id === id ? { ...x, ...ch } : x)));
  const apply = (text) => {
    const res = fillProfile(profile, parseResume(text), text);
    setProfile(res.profile);
    setNotice(`Profile updated from your resume: ${res.filled.join(', ')}.`);
  };

  // Resumes saved earlier have no text yet: read them once
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      for (const r of resumes.filter((x) => x.text === undefined)) {
        try {
          const text = await extractText(await loadResumeFile(r));
          patch(r.id, { text });
          if (r.primary && text) apply(text);
        } catch { patch(r.id, { text: '' }); }
      }
    })();
  }, []);

  const onPick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setNotice('');
    try {
      const meta = await storeResume(file);
      let text = '';
      try { text = await extractText(file); } catch { /* unreadable */ }
      const primary = resumes.length === 0;
      setResumes((prev) => [{ ...meta, label: '', primary, text }, ...prev]);
      if (!text) setNotice('Saved, but no text could be read from this file. Paste your resume text in Profile instead.');
      else if (primary) apply(text);
      else setNotice('Saved and analyzed. Tap "Make primary" to use it for your profile and AI tools.');
    } catch (err) { setNotice(err.message || 'Could not save that file.'); }
    setBusy(false);
  };

  const makePrimary = (r) => {
    setResumes((p) => p.map((x) => ({ ...x, primary: x.id === r.id })));
    if (r.text) apply(r.text);
  };
  const open = async (r) => { setNotice(''); try { await shareResume(r); } catch { setNotice('Could not open that file on this device.'); } };
  const remove = async (r) => {
    if (confirmId !== r.id) return setConfirmId(r.id);
    await removeResume(r);
    setResumes((prev) => {
      const n = prev.filter((x) => x.id !== r.id);
      return n.length && !n.some((x) => x.primary) ? n.map((x, i) => ({ ...x, primary: i === 0 })) : n;
    });
    setConfirmId(null);
  };

  return (
    <>
      <div className="panel">
        <h2>Your resumes</h2>
        <p className="meta">Upload a PDF or Word file. The app reads it, fills empty profile fields, and checks it for ATS problems. Files stay on this phone.</p>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt,application/pdf" onChange={onPick} hidden />
        <button className="primary" disabled={busy} onClick={() => inputRef.current.click()}>{busy ? 'Reading…' : 'Add a resume'}</button>
      </div>
      {notice && <p className="notice">{notice}</p>}
      {resumes.length === 0 && <p className="empty">No resumes saved yet.</p>}

      {resumes.map((r) => {
        const p = r.text ? parseResume(r.text) : null;
        const ats = r.text ? atsScore(r.text) : null;
        return (
          <article className="job" key={r.id}>
            <h3 className="filename">{r.name}</h3>
            <p className="meta">{size(r.size)} · Added {new Date(r.addedAt).toLocaleDateString([], { dateStyle: 'medium' })}</p>
            <input placeholder="Version label, e.g. ML focus" value={r.label || ''} onChange={(e) => patch(r.id, { label: e.target.value })} />
            <button className={`chip ${r.primary ? 'on' : ''}`} onClick={() => makePrimary(r)}>{r.primary ? 'Primary resume' : 'Make primary'}</button>

            <details className="sec sub">
              <summary>{r.text === undefined ? 'Analyzing…' : ats ? `Analysis · ATS ${ats.score}/100 (${ats.grade})` : 'Analysis'}</summary>
              <div className="stack">
                {!p ? <p className="meta">{r.text === undefined ? 'Reading the file…' : 'No readable text was found. Scanned or image-only PDFs cannot be read.'}</p> : (
                  <>
                    <p className="meta">{p.words} words · sections found: {p.sectionsFound.join(', ') || 'none'}</p>
                    <p className="meta">Contact: {p.email || 'email missing'} · {p.phone || 'phone missing'}</p>
                    <p className="meta">Skills detected ({p.skills.length}): {p.skills.join(', ') || 'none'}</p>
                    {ats.tips.map((t) => <p className="meta" key={t}>• {t}</p>)}
                  </>
                )}
              </div>
            </details>

            {r.text && <button className="ghost" onClick={() => apply(r.text)}>Use for profile</button>}
            <div className="row">
              <button className="ghost grow" onClick={() => open(r)}>Open or share</button>
              <button className="danger grow" onClick={() => remove(r)}>{confirmId === r.id ? 'Tap again to delete' : 'Delete'}</button>
            </div>
          </article>
        );
      })}
    </>
  );
}
