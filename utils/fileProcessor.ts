import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// Configure the PDF.js worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.4.178/build/pdf.worker.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return extractTextFromPdf(file);
  } else if (extension === 'pptx') {
    return extractTextFromPptx(file);
  } else if (extension === 'docx') {
    return extractTextFromDocx(file);
  } else if (extension === 'xlsx') {
    return extractTextFromXlsx(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, PPTX, DOCX, or XLSX file.');
  }
}

async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ');
        textContent += '\n'; // Add a newline between pages
    }
    return textContent;
}

async function extractTextFromPptx(file: File): Promise<string> {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(file);
    let fullText = '';
    const slidePromises: Promise<string>[] = [];

    // Find all slide XML files
    zip.folder('ppt/slides')?.forEach((relativePath, zipEntry) => {
        if (relativePath.startsWith('slide') && zipEntry.name.endsWith('.xml') && !zipEntry.name.includes('_rels')) {
            slidePromises.push(zipEntry.async('string'));
        }
    });

    const slideXmls = await Promise.all(slidePromises);

    for (const xml of slideXmls) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        let slideText = '';
        
        // In PPTX, text is in <a:t> elements within <a:p> paragraphs.
        const paragraphs = doc.getElementsByTagName('a:p');
        Array.from(paragraphs).forEach(p => {
            const texts = p.getElementsByTagName('a:t');
            let paraText = '';
            Array.from(texts).forEach(t => {
                paraText += t.textContent;
            });
            if (paraText.trim()) {
                slideText += paraText + '\n';
            }
        });
        
        if (slideText.trim()) {
            fullText += slideText.trim() + '\n\n'; // Separate slides clearly
        }
    }

    // Also extract text from notes
    const notesPromises: Promise<string>[] = [];
    zip.folder('ppt/notesSlides')?.forEach((relativePath, zipEntry) => {
        if (relativePath.startsWith('notesSlide') && zipEntry.name.endsWith('.xml') && !zipEntry.name.includes('_rels')) {
            notesPromises.push(zipEntry.async('string'));
        }
    });

    const notesXmls = await Promise.all(notesPromises);
    if (notesXmls.length > 0) {
        fullText += "--- SLIDE NOTES ---\n";
        for (const xml of notesXmls) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, 'application/xml');
            let notesText = '';
            const paragraphs = doc.getElementsByTagName('a:p');
            Array.from(paragraphs).forEach(p => {
                const texts = p.getElementsByTagName('a:t');
                let paraText = '';
                Array.from(texts).forEach(t => {
                    paraText += t.textContent;
                });
                if (paraText.trim()) {
                    notesText += paraText + '\n';
                }
            });
            if (notesText.trim()) {
                fullText += notesText.trim() + '\n\n';
            }
        }
    }

    return fullText.trim();
}

async function extractTextFromDocx(file: File): Promise<string> {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(file);
    const content = await zip.file('word/document.xml')?.async('string');

    if (!content) {
        throw new Error('Could not find document content in DOCX file.');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');
    let textContent = '';
    
    // In DOCX, text is in <w:t> elements within <w:p> paragraphs.
    const paragraphs = doc.getElementsByTagName('w:p');
    Array.from(paragraphs).forEach(p => {
        const texts = p.getElementsByTagName('w:t');
        let paraText = '';
        Array.from(texts).forEach(t => {
            paraText += t.textContent;
        });
        if (paraText.trim()) {
            textContent += paraText + '\n';
        }
    });

    return textContent.trim();
}

async function extractTextFromXlsx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        // Convert sheet to CSV, which is a good text representation
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        fullText += csv + '\n';
    });
    
    return fullText;
}