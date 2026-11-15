import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const MAX_BYTES = 10 * 1024 * 1024;

const safeName = (name) => name.replace(/[^\w.\-]+/g, '_');

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export async function storeResume(file) {
  if (file.size > MAX_BYTES) throw new Error('That file is larger than 10 MB.');
  const id = Date.now().toString();
  const path = `resumes/${id}-${safeName(file.name)}`;
  await Filesystem.writeFile({
    path,
    data: await toBase64(file),
    directory: Directory.Data,
    recursive: true,
  });
  return { id, name: file.name, size: file.size, addedAt: new Date().toISOString(), path };
}

export async function removeResume(meta) {
  try {
    await Filesystem.deleteFile({ path: meta.path, directory: Directory.Data });
  } catch {
    /* already gone */
  }
}

// Copies the stored file to the cache so the system share sheet can read it
export async function shareResume(meta) {
  const { data } = await Filesystem.readFile({ path: meta.path, directory: Directory.Data });
  const tmp = `share-${safeName(meta.name)}`;
  await Filesystem.writeFile({ path: tmp, data, directory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path: tmp, directory: Directory.Cache });
  await Share.share({ title: meta.name, url: uri, dialogTitle: 'Open or share resume' });
}

export async function loadResumeFile(meta) {
  const { data } = await Filesystem.readFile({ path: meta.path, directory: Directory.Data });
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], meta.name);
}
