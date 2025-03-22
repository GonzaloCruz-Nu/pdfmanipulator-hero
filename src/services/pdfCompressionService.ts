
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { COMPRESSION_FACTORS } from '@/utils/pdf/compression-constants';
import { renderPageToCanvas, isWasmSupported } from '@/utils/pdf/pdfRenderUtils';

// Types of compression
export type CompressionLevel = 'low' | 'medium' | 'high';

/**
 * Compresses a PDF file using canvas rendering and image recompression techniques
 */
export async function compressPDF(
  file: File,
  level: CompressionLevel,
  currentIndex: number,
  totalCount: number,
  onProgress?: (progress: number) => void
): Promise<File | null> {
  try {
    // Check if WebAssembly is available
    const wasmSupported = isWasmSupported();
    console.info(`WebAssembly available: ${wasmSupported}`);
    
    // Get configuration according to level
    const { 
      imageQuality, 
      scaleFactor, 
      colorReduction, 
      useHighQualityFormat,
      preserveTextQuality,
      useJpegFormat,
      jpegQuality
    } = COMPRESSION_FACTORS[level];
    
    // Adjust compression factors with WASM optimizations if available
    const optimizedScaleFactor = wasmSupported ? 
      Math.min(scaleFactor * 1.05, 1.0) : scaleFactor;
    
    const optimizedJpegQuality = wasmSupported ?
      Math.max(jpegQuality * 0.95, 0.1) : jpegQuality;
    
    // Load the document with PDF.js
    const fileArrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileArrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Set basic metadata
    newPdfDoc.setCreator("PDF Compressor");
    
    // Process each page
    const totalPages = pdfDoc.numPages;
    
    for (let i = 0; i < totalPages; i++) {
      // Update progress
      const pageProgress = Math.floor((i / totalPages) * 90);
      const fileProgress = (currentIndex / totalCount) * 100 + (pageProgress / totalCount);
      if (onProgress) {
        onProgress(Math.min(99, Math.floor(fileProgress)));
      }
      
      // Get the page
      const pdfPage = await pdfDoc.getPage(i + 1);
      
      // Get original dimensions
      const viewport = pdfPage.getViewport({ scale: 1.0 });
      const width = viewport.width;
      const height = viewport.height;
      
      // Create a canvas
      const canvas = document.createElement('canvas');
      
      // Render the page with WASM optimizations if available
      await renderPageToCanvas(pdfPage, canvas, optimizedScaleFactor, preserveTextQuality);
      
      // Always use JPEG for better compression
      const imageDataUrl = canvas.toDataURL('image/jpeg', optimizedJpegQuality);
      console.info(`Using JPEG format for level ${level} with quality ${optimizedJpegQuality}`);
      
      // Extract the base64
      const base64 = imageDataUrl.split(',')[1];
      
      // Convert base64 to Uint8Array optimized for WASM if available
      let imageBytes: Uint8Array;
      if (wasmSupported && window.atob && typeof TextEncoder !== 'undefined') {
        // Optimized method with TextEncoder (faster in modern browsers)
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) {
          bytes[j] = binary.charCodeAt(j);
        }
        imageBytes = bytes;
      } else {
        // Standard method
        const binaryString = atob(base64);
        imageBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          imageBytes[j] = binaryString.charCodeAt(j);
        }
      }
      
      // Insert the image
      let pdfImage;
      try {
        pdfImage = await newPdfDoc.embedJpg(imageBytes);
      } catch (error) {
        console.error('Error embedding image, trying with lower quality JPEG:', error);
        // If it fails, try with lower JPEG quality as a last resort
        const fallbackQuality = wasmSupported ? 0.3 : 0.4;
        const jpegDataUrl = canvas.toDataURL('image/jpeg', fallbackQuality);
        const jpegBase64 = jpegDataUrl.split(',')[1];
        const jpegBinaryString = atob(jpegBase64);
        const jpegImageBytes = new Uint8Array(jpegBinaryString.length);
        for (let j = 0; j < jpegBinaryString.length; j++) {
          jpegImageBytes[j] = jpegBinaryString.charCodeAt(j);
        }
        pdfImage = await newPdfDoc.embedJpg(jpegImageBytes);
      }
      
      // Apply dimension reduction according to level
      const pageWidth = width * colorReduction;
      const pageHeight = height * colorReduction;
      
      // Add page
      const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
      
      // Draw the image
      newPage.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });
    }
    
    // Save with optimized compression for WebAssembly
    const saveOptions = {
      useObjectStreams: true,
      addDefaultPage: false
    };
    
    const compressedBytes = await newPdfDoc.save(saveOptions);
    
    // Create result file
    const result = new File(
      [compressedBytes],
      `comprimido_${file.name}`,
      { type: 'application/pdf' }
    );
    
    // Check if the size was actually reduced
    if (result.size >= file.size) {
      console.warn("Compressed file is not smaller than the original");
      // If using low or medium compression and the file grew significantly, try again with more aggressive parameters
      if ((level === 'low' || level === 'medium') && (result.size > file.size * 1.5)) {
        console.info("Trying with more aggressive parameters...");
        const moreAggressiveLevel = level === 'low' ? 'medium' : 'high';
        return await compressPDF(file, moreAggressiveLevel, currentIndex, totalCount, onProgress);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error compressing PDF with canvas:', error);
    if (onProgress) {
      onProgress(100);
    }
    return null;
  }
}

/**
 * Calculates compression statistics
 */
export const calculateCompressionStats = (originalSize: number, compressedSize: number) => {
  const savedPercentage = Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10;
  return {
    originalSize,
    compressedSize,
    savedPercentage
  };
};
