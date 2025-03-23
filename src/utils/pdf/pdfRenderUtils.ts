
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Checks if WebAssembly is supported in the current browser
 */
export const isWasmSupported = (): boolean => {
  try {
    return typeof WebAssembly === 'object' && 
           typeof WebAssembly.instantiate === 'function' &&
           typeof WebAssembly.compile === 'function';
  } catch (e) {
    console.error('Error checking WebAssembly support:', e);
    return false;
  }
};

/**
 * Renders a PDF page to a canvas with specified quality settings
 */
export async function renderPageToCanvas(
  pdfPage: pdfjsLib.PDFPageProxy, 
  canvas: HTMLCanvasElement, 
  scaleFactor: number,
  preserveTextQuality: boolean
): Promise<void> {
  try {
    // Use scale based on configuration
    const viewport = pdfPage.getViewport({ scale: 1.0 });
    
    // Calculate optimized canvas dimensions
    const canvasWidth = Math.floor(viewport.width * scaleFactor);
    const canvasHeight = Math.floor(viewport.height * scaleFactor);
    
    // Set up canvas
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    
    // White background to eliminate transparency and improve compression
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Configure rendering quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Adjust viewport with scale
    const adjustedViewport = pdfPage.getViewport({ scale: scaleFactor });
    
    // Rendering options
    const renderContext = {
      canvasContext: ctx,
      viewport: adjustedViewport,
      intent: preserveTextQuality ? 'print' : 'display',
      enableWebGL: true,
      renderInteractiveForms: true
    };
    
    // Render the page
    await pdfPage.render(renderContext).promise;
  } catch (error) {
    console.error('Error rendering page:', error);
    throw error;
  }
}

/**
 * Convert PDF page to an image data URL for editing
 */
export async function pdfPageToDataUrl(
  pdfPage: pdfjsLib.PDFPageProxy,
  quality: number = 0.9,
  scale: number = 1.5
): Promise<string> {
  try {
    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    
    // Render the PDF page to the canvas
    await renderPageToCanvas(pdfPage, canvas, scale, true);
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.error('Error converting PDF page to data URL:', error);
    throw error;
  }
}

/**
 * Load a PDF page as an image for fabric.js editing
 */
export async function loadPdfPageAsImage(
  pdfPage: pdfjsLib.PDFPageProxy, 
  scale: number = 1.5
): Promise<HTMLImageElement> {
  try {
    // Convert the PDF page to a data URL
    const dataUrl = await pdfPageToDataUrl(pdfPage, 0.9, scale);
    
    // Create a new image from the data URL
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    });
  } catch (error) {
    console.error('Error loading PDF page as image:', error);
    throw error;
  }
}
