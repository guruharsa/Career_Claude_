// Reads text from a resume file on the phone (PDF, DOCX or plain text)
export async function extractText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    const mod = await import('pdfjs-dist/legacy/build/pdf.js');
    const pdfjs = mod.default || mod;
    pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.min.js?url')).default;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    let text = '';
    for (let i = 1; i <= Math.min(doc.numPages, 6); i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      let line = '', lastY = null;
      for (const it of content.items) {
        const y = it.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 3) { text += `${line}\n`; line = ''; }
        line += it.str + (/\s$/.test(it.str) ? '' : ' ');
        if (it.hasEOL) { text += `${line}\n`; line = ''; }
        lastY = y;
      }
      text += `${line}\n`;
    }
    return clean(text);
  }
  if (name.endsWith('.docx')) {
    const mod = await import('mammoth/mammoth.browser.js');
    const m = mod.default || mod;
    return clean((await m.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value);
  }
  return clean(await file.text());
}
const clean = (t) => t.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
