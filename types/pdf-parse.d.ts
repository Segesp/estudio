declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function pdf(dataBuffer: Buffer | ArrayBuffer | Uint8Array): Promise<PDFData>;
  export = pdf;
}
