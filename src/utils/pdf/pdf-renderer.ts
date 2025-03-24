
import * as pdfjsLib from 'pdfjs-dist';
import { renderPageToCanvasWithOptions, loadPdfDocumentFromArray } from './processors/render-utils';

// Configurar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Re-exportar las funciones de renderizado para mantener compatibilidad
export const renderPageToCanvas = renderPageToCanvasWithOptions;
export const loadPdfDocument = loadPdfDocumentFromArray;

