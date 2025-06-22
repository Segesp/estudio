import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenAI, GenerateContentResponse, Part } from '@google/genai';

// Configuración para PDF.js - usar la misma versión que está instalada
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

// Constantes
const GEMINI_MODEL_NAME = "gemini-1.5-flash";
const PDF_PAGE_SCALE = 1.5;
const PDF_PAGE_IMAGE_TYPE = "image/jpeg";
const PDF_PAGE_IMAGE_QUALITY = 0.8;

export interface OCRResult {
  text: string;
  confidence?: number;
  processingMethod: 'pdf-gemini-ocr' | 'tesseract-ocr' | 'direct-text';
  originalFileName: string;
  processedAt: string;
  totalPages?: number;
}

interface PdfPageImage {
  pageNumber: number;
  imageDataUrl: string;
  base64Data: string;
  mimeType: string;
}

export class OCRProcessor {
  private tesseractWorker: any = null;
  
  /**
   * Inicializa PDF.js con manejo de errores
   */
  private async initializePdfJs(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('PDF.js solo funciona en el navegador');
    }

    // Configurar el worker si no está ya configurado
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      const workerUrls = [
        'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
        'https://mozilla.github.io/pdf.js/build/pdf.worker.js'
      ];

      for (const url of workerUrls) {
        try {
          // Verificar que la URL del worker esté disponible
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = url;
            console.log(`Worker de PDF.js configurado desde: ${url}`);
            break;
          }
        } catch (e) {
          console.warn(`Worker URL no disponible: ${url}`);
        }
      }

      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        throw new Error('No se pudo configurar el worker de PDF.js. Verifica tu conexión a internet.');
      }
    }
  }

  /**
   * Inicializa el worker de Tesseract para OCR de imágenes
   */
  private async initializeTesseractWorker(): Promise<any> {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await createWorker();
      await this.tesseractWorker.loadLanguage('spa+eng'); // Español e inglés
      await this.tesseractWorker.initialize('spa+eng');
    }
    return this.tesseractWorker;
  }

  /**
   * Convierte un PDF a imágenes usando pdf.js
   */
  private async convertPdfToImages(
    file: File,
    onProgress?: (progress: { processedPages: number; totalPages: number }) => void
  ): Promise<PdfPageImage[]> {
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
        throw new Error('No se pudo obtener el contexto del canvas');
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
      
      // Limpiar recursos de la página
      page.cleanup();
    }
    
    // Limpiar recursos del documento
    if (typeof (pdfDoc as any).destroy === 'function') {
      (pdfDoc as any).destroy();
    }

    return images;
  }

  /**
   * Extrae texto de una imagen usando Gemini
   */
  private async extractTextFromImageWithGemini(base64ImageData: string, mimeType: string): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("La API Key de Gemini no está configurada. Por favor, configura la variable de entorno API_KEY.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const imagePart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };
    
    const textPart: Part = {
      text: "Extrae todo el contenido de texto de esta imagen. Si la imagen está en blanco o no contiene texto visible, indica que no se encontró texto.",
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: [{ parts: [textPart, imagePart] }],
      config: {
        temperature: 0.1, // Baja temperatura para OCR más preciso
      }
    });
    
    return response.text || '';
  }

  /**
   * Extrae texto de un archivo PDF usando Gemini OCR
   */
  private async extractTextFromPDF(file: File): Promise<{ text: string; totalPages: number }> {
    // Inicializar PDF.js primero
    await this.initializePdfJs();
    
    const images = await this.convertPdfToImages(file, (progress) => {
      console.log(`Convirtiendo PDF a imágenes... Página ${progress.processedPages}/${progress.totalPages}`);
    });

    let fullText = '';
    let successfulPages = 0;

    for (const image of images) {
      try {
        console.log(`Extrayendo texto de la página ${image.pageNumber}/${images.length}...`);
        const pageText = await this.extractTextFromImageWithGemini(image.base64Data, image.mimeType);
        
        if (pageText.trim()) {
          fullText += `\n\n=== PÁGINA ${image.pageNumber} ===\n\n${pageText.trim()}`;
          successfulPages++;
        }
      } catch (error) {
        console.error(`Error procesando página ${image.pageNumber}:`, error);
        fullText += `\n\n=== PÁGINA ${image.pageNumber} ===\n\n[Error al extraer texto de esta página]`;
      }
    }

    if (successfulPages === 0) {
      throw new Error('No se pudo extraer texto de ninguna página del PDF.');
    }

    return {
      text: fullText.trim(),
      totalPages: images.length
    };
  }

  /**
   * Procesa una imagen usando OCR de Tesseract
   */
  private async processImageWithOCR(file: File): Promise<{ text: string; confidence: number }> {
    const worker = await this.initializeTesseractWorker();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const result = await worker.recognize(reader.result);
          resolve({
            text: result.data.text,
            confidence: result.data.confidence
          });
        } catch (error) {
          reject(new Error(`Error en OCR de imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Lee un archivo de texto plano
   */
  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const text = reader.result as string;
        resolve(text);
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo de texto'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Procesa un archivo y extrae texto usando el método más apropiado
   */
  async processFile(file: File): Promise<OCRResult> {
    const fileName = file.name.toLowerCase();
    const processingStartTime = new Date().toISOString();
    
    try {
      // Determinar el tipo de archivo y el método de procesamiento
      if (fileName.endsWith('.pdf')) {
        const result = await this.extractTextFromPDF(file);
        return {
          text: result.text,
          processingMethod: 'pdf-gemini-ocr',
          originalFileName: file.name,
          processedAt: processingStartTime,
          totalPages: result.totalPages
        };
      }
      
      // Archivos de imagen
      else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/)) {
        const result = await this.processImageWithOCR(file);
        return {
          text: result.text.trim(),
          confidence: result.confidence,
          processingMethod: 'tesseract-ocr',
          originalFileName: file.name,
          processedAt: processingStartTime
        };
      }
      
      // Archivos de texto
      else if (fileName.match(/\.(txt|md|csv)$/)) {
        const text = await this.readTextFile(file);
        return {
          text: text.trim(),
          processingMethod: 'direct-text',
          originalFileName: file.name,
          processedAt: processingStartTime
        };
      }
      
      else {
        throw new Error(`Tipo de archivo no soportado: ${file.name}. Tipos soportados: PDF, imágenes (JPG, PNG, etc.), y archivos de texto (TXT, MD, CSV).`);
      }
      
    } catch (error) {
      throw new Error(`Error al procesar ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Crea un archivo temporal con el texto extraído (para debugging/logging)
   */
  createTemporaryTextFile(ocrResult: OCRResult): Blob {
    const content = `# Archivo procesado con OCR
Archivo original: ${ocrResult.originalFileName}
Método de procesamiento: ${ocrResult.processingMethod}
Procesado en: ${ocrResult.processedAt}
${ocrResult.confidence ? `Confianza OCR: ${ocrResult.confidence.toFixed(2)}%` : ''}

## Contenido extraído:

${ocrResult.text}
`;
    
    return new Blob([content], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * Limpia los recursos utilizados
   */
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}
