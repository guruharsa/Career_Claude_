import { Preferences } from '@capacitor/preferences';

export async function load(key, fallback) {
  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export async function save(key, data) {
  try {
    await Preferences.set({ key, value: JSON.stringify(data) });
  } catch {
    /* storage unavailable */
  }
}
