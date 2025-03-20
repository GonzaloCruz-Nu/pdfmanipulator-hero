
import { PDFDocument, rgb, degrees, PDFName, PDFDict } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Re-export constants
export { COMPRESSION_FACTORS, MIN_SIZE_REDUCTION } from './compression-constants';

// Re-export utility functions
export { calculateCompression } from './compression-utils';

// Re-export compression methods
export { canvasBasedCompression } from './canvas-compression';
export { standardCompression } from './standard-compression';

// Configure PDF.js worker for any other methods that might need it
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
