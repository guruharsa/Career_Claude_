import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL = 'followups';

// Stable numeric notification id derived from the job id
export const notifId = (jobId) => Number(String(jobId).slice(-9)) || 1;

export async function scheduleReminder(job) {
  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      return {
        ok: false,
        message:
          'Notifications are blocked. Allow them for Career Tracker in Android settings, then set the reminder again.',
      };
    }
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL,
        name: 'Follow-up reminders',
        importance: 4,
      });
    } catch {
      /* channel already exists or not supported */
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId(job.id),
          title: `Follow up: ${job.title}`,
          body: job.company,
          channelId: CHANNEL,
          schedule: { at: new Date(job.remindAt), allowWhileIdle: true },
        },
      ],
    });
    return { ok: true, message: 'Reminder set.' };
  } catch {
    return { ok: false, message: 'Could not set the reminder on this device.' };
  }
}

export async function cancelReminder(jobId) {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notifId(jobId) }] });
  } catch {
    /* nothing scheduled */
  }
}
