declare module 'pdfjs-dist' {
  export interface GlobalWorkerOptions {
    workerSrc: string;
  }

  export const GlobalWorkerOptions: GlobalWorkerOptions;

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): void;
  }

  export interface PDFPageProxy {
    getViewport(options: { scale: number }): PageViewport;
    render(options: { canvasContext: CanvasRenderingContext2D; viewport: PageViewport }): RenderTask;
    cleanup(): void;
  }

  export interface PageViewport {
    width: number;
    height: number;
  }

  export interface RenderTask {
    promise: Promise<void>;
  }

  export interface DocumentInitParameters {
    data: ArrayBuffer | Uint8Array;
  }

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  export function getDocument(src: DocumentInitParameters): PDFDocumentLoadingTask;
  
  export const version: string;
}
