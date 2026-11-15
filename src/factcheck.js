import { extractSkills } from './skills.js';
import { findPhone } from './parse.js';

const numbers = (t = '') =>
  new Set((t.match(/\d[\d,]*(?:\.\d+)?\s?(?:%|k\b|m\b|x\b|lpa\b)?/gi) || []).map((s) => s.toLowerCase().replace(/[\s,]/g, '')));

// Deterministic gate: every number and known skill in the tailored text must exist in the baseline resume
export function factGate(base = '', tailored = '') {
  const issues = [];
  const known = numbers(base);
  numbers(tailored).forEach((n) => { if (!known.has(n)) issues.push(`Number "${n}" is not in your resume.`); });
  const skills = new Set(extractSkills(base));
  extractSkills(tailored).forEach((s) => { if (!skills.has(s)) issues.push(`Skill "${s}" is not in your resume.`); });
  return { ok: issues.length === 0, issues };
}

// Text-level ATS check, 0 to 100
export function atsScore(t = '') {
  const groups = [/^\s*(professional\s+)?(summary|profile|objective|about)/im, /^\s*(work\s+|professional\s+)?(experience|employment|work history)/im, /^\s*education/im, /^\s*((technical|key|core)\s+)?(skills|competencies)/im];
  const found = groups.filter((re) => re.test(t)).length;
  const words = t.split(/\s+/).filter(Boolean).length;
  const tips = [];
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(t);
  const phone = !!findPhone(t);
  const plain = !/\t|\|/.test(t.split('\n').slice(4).join('\n'));
  if (found < 4) tips.push('Use standard headings: Summary, Experience, Education, Skills.');
  if (!email || !phone) tips.push('Put your email and phone in the text.');
  if (!plain) tips.push('Remove tables and tab or pipe characters.');
  if (words > 900) tips.push('Shorten it to fit 2 pages.');
  if (words < 150) tips.push('Add more detail.');
  const score = found * 10 + (email ? 10 : 0) + (phone ? 10 : 0) + (plain ? 15 : 0) + (words <= 900 ? 15 : 0) + (words >= 150 ? 10 : 0);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  return { score, grade, tips };
}

export function changedLines(base = '', tailored = '') {
  const set = new Set(base.split('\n').map((l) => l.trim()));
  return tailored.split('\n').map((text) => ({ text, changed: text.trim() !== '' && !set.has(text.trim()) }));
}
