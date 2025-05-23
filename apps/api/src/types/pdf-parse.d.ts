declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: {
      PDFFormatVersion?: string;
      IsAcroFormPresent?: boolean;
      IsXFAPresent?: boolean;
      [key: string]: any;
    };
    metadata: {
      [key: string]: any;
    };
    version?: string;
  }

  function pdf(
    dataBuffer: Buffer,
    options?: {
      pagerender?: (pageData: any) => string;
      max?: number;
    }
  ): Promise<PDFData>;

  export = pdf;
} 