declare module 'docx4js' {
  interface DocxDocument {
    parse(): Promise<any>;
    getContent(): string;
  }
  
  interface Docx4JSStatic {
    load(buffer: ArrayBuffer): Promise<DocxDocument>;
  }

  const Docx4JS: Docx4JSStatic;
  export default Docx4JS;
}
