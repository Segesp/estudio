declare module 'jszip' {
  interface JSZipFile {
    async(type: 'text'): Promise<string>;
    async(type: 'arraybuffer'): Promise<ArrayBuffer>;
    async(type: 'blob'): Promise<Blob>;
  }
  
  interface JSZip {
    loadAsync(data: ArrayBuffer): Promise<JSZip>;
    file(name: string): JSZipFile | null;
    forEach(callback: (relativePath: string, file: JSZipFile) => void): void;
  }
  
  const JSZip: {
    new (): JSZip;
  };
  
  export default JSZip;
}
