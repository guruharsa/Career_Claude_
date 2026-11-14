import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const esc = (s) => String(s || '').replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export async function shareIcs(job) {
  const start = new Date(job.interviewAt);
  const end = new Date(start.getTime() + 3600000);
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Career Tracker//EN', 'BEGIN:VEVENT',
    `UID:${job.id}@careertracker`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Interview: ${job.title} at ${job.company}`)}`, `DESCRIPTION:${esc(job.link)}`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const path = `interview-${job.id}.ics`;
  await Filesystem.writeFile({ path, data: body, directory: Directory.Cache, encoding: 'utf8' });
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  await Share.share({ title: 'Interview', url: uri });
}
