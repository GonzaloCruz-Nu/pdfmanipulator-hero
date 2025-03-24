
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { renderPageToCanvas } from '@/utils/pdf/pdf-renderer';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// A4 size in points (72 points = 1 inch)
const A4_WIDTH = 595.276; // 210mm in points
const A4_HEIGHT = 841.89; // 297mm in points

/**
 * Resizes a PDF to A4 format while preserving aspect ratio
 */
export async function resizePdfToA4Format(
  file: File,
  progressCallback?: (progress: number) => void
): Promise<File | null> {
  try {
    // Update progress
    progressCallback?.(10);
    
    // Load the PDF file
    const fileArrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileArrayBuffer);
    const pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(fileArrayBuffer) }).promise;
    
    // Create a new A4 PDF document
    const newPdfDoc = await PDFDocument.create();
    
    progressCallback?.(20);
    
    // Calculate total pages for progress tracking
    const totalPages = pdfDoc.getPageCount();
    
    // Process each page
    for (let i = 0; i < totalPages; i++) {
      // Update progress based on page processing
      const pageProgress = 20 + Math.floor((i / totalPages) * 70);
      progressCallback?.(pageProgress);
      
      // Get the original page
      const originalPage = pdfDoc.getPage(i);
      const { width: origWidth, height: origHeight } = originalPage.getSize();
      
      // Get the page from PDF.js for rendering
      const pdfJsPage = await pdfJsDoc.getPage(i + 1); // PDF.js pages are 1-indexed
      
      // Create a new A4 page in the output document
      const newPage = newPdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      
      // Create a temporary canvas to render the page
      const canvas = document.createElement('canvas');
      
      // Calculate scale factor to fit within A4
      // We'll scale down to fit the page content within A4 boundaries
      // while preserving the aspect ratio
      const widthRatio = A4_WIDTH / origWidth;
      const heightRatio = A4_HEIGHT / origHeight;
      const scaleFactor = Math.min(widthRatio, heightRatio) * 0.9; // 0.9 to leave some margin
      
      // Render the page to canvas
      await renderPageToCanvas(pdfJsPage, canvas, scaleFactor, true, 'print');
      
      // Convert canvas to JPEG image
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      const jpgImage = await newPdfDoc.embedJpg(imageData);
      
      // Calculate centered position
      const scaledWidth = origWidth * scaleFactor;
      const scaledHeight = origHeight * scaleFactor;
      const xPosition = (A4_WIDTH - scaledWidth) / 2;
      const yPosition = (A4_HEIGHT - scaledHeight) / 2;
      
      // Draw the image on the new page
      newPage.drawImage(jpgImage, {
        x: xPosition,
        y: yPosition,
        width: scaledWidth,
        height: scaledHeight,
      });
    }
    
    progressCallback?.(90);
    
    // Save the new PDF
    const modifiedPdfBytes = await newPdfDoc.save();
    
    // Create a new file with the modified PDF
    const fileName = file.name.replace('.pdf', '_A4.pdf');
    const modifiedPdfFile = new File([modifiedPdfBytes], fileName, { type: 'application/pdf' });
    
    progressCallback?.(100);
    
    return modifiedPdfFile;
  } catch (error) {
    console.error('Error resizing PDF to A4:', error);
    throw error;
  }
}
