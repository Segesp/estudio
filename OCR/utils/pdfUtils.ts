
import * as pdfjsLib from 'pdfjs-dist/build/pdf.js';
// Removed: import 'pdfjs-dist/build/pdf.worker.entry.js'; 

import { PDF_PAGE_SCALE, PDF_PAGE_IMAGE_TYPE, PDF_PAGE_IMAGE_QUALITY } from '../constants';

// Explicitly set the workerSrc using cdnjs.
// This is often more reliable than relying on side-effect imports for worker setup.
if (typeof window !== 'undefined') { // Ensure this runs only in the browser
  if (pdfjsLib && pdfjsLib.version) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  } else {
    // Fallback if pdfjsLib.version is not available. This is unlikely if pdfjsLib itself loaded.
    // The version '4.4.168' is a recent stable version of pdf.js.
    // This might mismatch if the esm.sh version of pdfjs-dist is significantly different
    // (e.g. the importmap's "5.3.31" is very unusual for pdfjs-dist).
    // However, having a fallback is better than a potential crash if pdfjsLib.version is missing.
    console.warn('PDF.js version could not be determined from pdfjsLib. Falling back to a default worker URL (v4.4.168). This may cause issues if versions mismatch significantly with the main PDF.js library loaded from esm.sh.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`;
  }
}

export interface PdfPageImage {
  pageNumber: number;
  imageDataUrl: string;
  base64Data: string;
  mimeType: string;
}

export const convertPdfToImages = async (
  file: File,
  onProgress?: (progress: { processedPages: number; totalPages: number }) => void
): Promise<PdfPageImage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdfDoc.numPages;
  const images: PdfPageImage[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: PDF_PAGE_SCALE });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Could not get canvas context');
    }
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    const imageDataUrl = canvas.toDataURL(PDF_PAGE_IMAGE_TYPE, PDF_PAGE_IMAGE_QUALITY);
    const base64Data = imageDataUrl.split(',')[1];
    
    images.push({
      pageNumber: i,
      imageDataUrl,
      base64Data,
      mimeType: PDF_PAGE_IMAGE_TYPE,
    });

    if (onProgress) {
      onProgress({ processedPages: i, totalPages });
    }
    // Clean up page resources
    page.cleanup();
  }
  // Clean up document resources
  if (typeof (pdfDoc as any).destroy === 'function') {
    (pdfDoc as any).destroy();
  }

  return images;
};
