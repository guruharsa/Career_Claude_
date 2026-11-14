import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Plain selectable-text A4 PDF, capped at 2 pages
export async function exportPdf(text, name) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), m = 44;
  let y = m;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  for (const raw of text.split('\n')) {
    for (const line of doc.splitTextToSize(raw || ' ', W - 2 * m)) {
      if (y > H - m) { doc.addPage(); y = m; }
      doc.text(line, m, y);
      y += 14;
    }
  }
  if (doc.getNumberOfPages() > 2) throw new Error('This resume is longer than 2 pages. Shorten it first.');
  const data = doc.output('datauristring').split(',')[1];
  const path = `${name.replace(/[^\w]+/g, '_')}.pdf`;
  await Filesystem.writeFile({ path, data, directory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  await Share.share({ title: path, url: uri });
}
