import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';

export async function exportData(jobs, resumes, profile) {
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), profile, jobs, resumes }, null, 2);
  const path = 'career-tracker-export.json';
  await Filesystem.writeFile({ path, data: body, directory: Directory.Cache, encoding: 'utf8' });
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  await Share.share({ title: 'Career Tracker data', url: uri });
}

export async function eraseAll(resumes) {
  try {
    const { notifications } = await LocalNotifications.getPending();
    if (notifications.length) await LocalNotifications.cancel({ notifications });
  } catch { /* none */ }
  for (const r of resumes) {
    try { await Filesystem.deleteFile({ path: r.path, directory: Directory.Data }); } catch { /* gone */ }
  }
  await Preferences.clear();
  window.location.reload();
}
