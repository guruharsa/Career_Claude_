import { useRef, useState } from 'react';
import { storeResume, removeResume, shareResume } from './resumes.js';

const size = (bytes) =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function Resumes({ resumes, setResumes }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const onPick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setNotice('');
    try {
      const meta = await storeResume(file);
      setResumes((prev) => [{ ...meta, label: '', primary: prev.length === 0 }, ...prev]);
    } catch (err) {
      setNotice(err.message || 'Could not save that file.');
    }
    setBusy(false);
  };

  const open = async (r) => {
    setNotice('');
    try {
      await shareResume(r);
    } catch {
      setNotice('Could not open that file on this device.');
    }
  };

  const remove = async (r) => {
    if (confirmId !== r.id) {
      setConfirmId(r.id);
      return;
    }
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
        <p className="meta">Files are saved on this phone only. Keep a version for each kind of role.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.rtf,application/pdf"
          onChange={onPick}
          hidden
        />
        <button className="primary" disabled={busy} onClick={() => inputRef.current.click()}>
          {busy ? 'Saving…' : 'Add a resume'}
        </button>
      </div>

      {notice && <p className="notice">{notice}</p>}

      {resumes.length === 0 && (
        <p className="empty">No resumes saved yet. Add a PDF or Word file.</p>
      )}

      {resumes.map((r) => (
        <article className="job" key={r.id}>
          <h3 className="filename">{r.name}</h3>
          <input placeholder="Version label, e.g. DevOps focus" value={r.label || ''}
            onChange={(e) => setResumes((p) => p.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))} />
          <button className={`chip ${r.primary ? 'on' : ''}`}
            onClick={() => setResumes((p) => p.map((x) => ({ ...x, primary: x.id === r.id })))}>
            {r.primary ? 'Primary resume' : 'Make primary'}
          </button>
          <p className="meta">
            {size(r.size)} · Added {new Date(r.addedAt).toLocaleDateString([], { dateStyle: 'medium' })}
          </p>
          <div className="row">
            <button className="ghost grow" onClick={() => open(r)}>Open or share</button>
            <button className="danger grow" onClick={() => remove(r)}>
              {confirmId === r.id ? 'Tap again to delete' : 'Delete'}
            </button>
          </div>
        </article>
      ))}
    </>
  );
}
