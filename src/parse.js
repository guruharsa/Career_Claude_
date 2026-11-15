import { extractSkills } from './skills.js';

const HEAD = {
  summary: /^(professional\s+)?(summary|profile|objective|about( me)?)$/i,
  experience: /^(work\s+|professional\s+)?(experience|employment( history)?|work history)$/i,
  education: /^education( and training)?$/i,
  skills: /^((technical|key|core)\s+)?(skills|competencies)( (&|and) tools)?$/i,
  projects: /^(personal\s+|key\s+)?projects$/i,
  certifications: /^(certifications?|licen[sc]es( (&|and) certifications)?)$/i,
};

export function findPhone(t = '') {
  return (t.match(/\+?\d[\d\s().-]{8,}\d/g) || []).find((m) => {
    const d = m.replace(/\D/g, '').length;
    return d >= 10 && d <= 13 && !/(19|20)\d{2}\s*[-–]\s*((19|20)\d{2}|present)/i.test(m);
  }) || '';
}

export function parseResume(text = '') {
  const lines = text.split('\n');
  const idx = {};
  lines.forEach((l, i) => {
    const t = l.trim().replace(/[:\s]+$/, '');
    if (t.length < 40) for (const [k, re] of Object.entries(HEAD)) if (re.test(t) && idx[k] === undefined) idx[k] = i;
  });
  const block = (k) => {
    if (idx[k] === undefined) return '';
    const end = Object.values(idx).filter((i) => i > idx[k]).sort((a, b) => a - b)[0] ?? lines.length;
    return lines.slice(idx[k] + 1, end).join('\n').trim();
  };
  const top = lines.map((l) => l.trim()).filter(Boolean).slice(0, 6);
  const looksName = (l) => /^[A-Za-z][A-Za-z.'\- ]{2,40}$/.test(l) && l.split(/\s+/).length <= 4 && !/resume|curriculum|vitae/i.test(l);
  const name = top[0] && looksName(top[0]) ? top[0] : '';
  const cand = top[1] || '';
  const headline = cand && cand.length <= 70 && !/[@\d,]/.test(cand) && !Object.values(HEAD).some((re) => re.test(cand)) ? cand : '';
  let location = '';
  for (const l of top.slice(0, 5)) {
    const part = l.split(/[|•·]/).map((s) => s.trim()).find((s) => s.includes(',') && !/[@\d]|http/i.test(s) && s.length < 50);
    if (part) { location = part; break; }
  }
  const years = (text.match(/(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs)\s+(?:of\s+)?(?:\w+\s+){0,3}experience/i) || [])[1] || '';
  const listed = block('skills').split(/[,|•·\n;]/).map((s) => s.trim()).filter((s) => s.length >= 2 && s.length <= 30 && s.split(/\s+/).length <= 3 && !/^\d+$/.test(s) && !s.endsWith(':'));
  const seen = new Set();
  const skills = [...extractSkills(text), ...listed].filter((s) => !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase())).slice(0, 40);
  return {
    name, headline, location, years, skills,
    email: (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [''])[0],
    phone: findPhone(text),
    summary: block('summary').slice(0, 500),
    sectionsFound: Object.keys(idx),
    words: text.split(/\s+/).filter(Boolean).length,
  };
}

// Fills empty profile fields only, merges skills, and sets the baseline resume text
export function fillProfile(profile, p, text) {
  const next = { ...profile };
  const filled = [];
  const put = (k, v, label) => { if (v && !String(next[k] || '').trim()) { next[k] = v; filled.push(label); } };
  put('name', p.name, 'name'); put('email', p.email, 'email'); put('phone', p.phone, 'phone');
  put('headline', p.headline, 'headline'); put('summary', p.summary, 'summary');
  put('location', p.location, 'location'); put('years', p.years, 'experience');
  const have = (next.skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const set = new Set(have.map((s) => s.toLowerCase()));
  const add = p.skills.filter((s) => !set.has(s.toLowerCase()));
  if (add.length) { next.skills = [...have, ...add].join(', '); filled.push(`${add.length} skills`); }
  next.resumeText = text;
  filled.push('resume text for the AI tools');
  return { profile: next, filled };
}
