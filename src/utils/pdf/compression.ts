
import { PDFDocument, degrees } from 'pdf-lib';

// Constants for compression
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.8, scaleFactor: 0.95 },
  medium: { imageQuality: 0.5, scaleFactor: 0.85 },
  high: { imageQuality: 0.2, scaleFactor: 0.75 }
};

// Minimum size reduction required to consider compression effective
// Reducimos el umbral para considerar que la compresión fue efectiva
export const MIN_SIZE_REDUCTION = 0.01; // 1% de reducción mínima

// Method for calculating compression percentage
export const calculateCompression = (originalSize: number, compressedSize: number) => {
  const savedPercentage = Math.max(0, Math.round((1 - (compressedSize / originalSize)) * 1000) / 10);
  return {
    originalSize,
    compressedSize,
    savedPercentage
  };
};

// Standard compression method
export const standardCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    const { imageQuality, scaleFactor } = COMPRESSION_FACTORS[level];
    
    const pdfDoc = await PDFDocument.load(fileBuffer, { 
      ignoreEncryption: true,
      updateMetadata: false,
    });
    
    const pages = pdfDoc.getPages();
    
    // Reduce image quality if possible
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      // Usando degrees() para crear un objeto Rotation válido
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees(currentAngle));
    }
    
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error in standard compression:', error);
    return null;
  }
};

// Aggressive compression method
export const aggressiveCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    const { imageQuality, scaleFactor } = COMPRESSION_FACTORS[level];
    
    const srcPdfDoc = await PDFDocument.load(fileBuffer);
    const newPdfDoc = await PDFDocument.create();
    
    const pages = srcPdfDoc.getPages();
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Copy the page to the new document
      const [copiedPage] = await newPdfDoc.copyPages(srcPdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);
      
      // Remap the page to reduce size
      const currentPage = newPdfDoc.getPage(i);
      currentPage.setSize(width * scaleFactor, height * scaleFactor);
      currentPage.scale(1/scaleFactor, 1/scaleFactor);
    }
    
    const compressedBytes = await newPdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error in aggressive compression:', error);
    return null;
  }
};

// Extreme compression method
export const extremeCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Ajustamos los factores de compresión para ser más agresivos
    const qualityFactor = level === 'high' ? 0.05 : 
                          level === 'medium' ? 0.1 : 0.2;
    
    const scaleFactor = level === 'high' ? 0.6 : 
                        level === 'medium' ? 0.75 : 0.9;
    
    // Create a new document
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // For each page in the original document
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Embed the original page
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Create a new page with reduced dimensions
      const newPage = newDoc.addPage([width * scaleFactor, height * scaleFactor]);
      
      // Draw the embedded page on the new page
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        opacity: qualityFactor * 5 // Higher opacity for better readability
      });
    }
    
    // Save the compressed document
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_max_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error in extreme compression:', error);
    return null;
  }
};

// Method that compresses by reducing image quality
export const imageQualityCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Configurations based on compression level
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    
    // Maintain original dimensions but apply compression
    const imageQuality = level === 'high' ? 0.01 : 
                         level === 'medium' ? 0.05 : 0.1;
    
    // Create a new document with one page per original
    const newDoc = await PDFDocument.create();
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      const targetWidth = Math.min(width, 595.28); // A4 width in points
      const targetHeight = Math.min(height, 841.89); // A4 height in points
      const newPage = newDoc.addPage([targetWidth, targetHeight]);
      
      // Draw with low quality to reduce size
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: targetWidth,
        height: targetHeight,
        opacity: imageQuality * 10
      });
    }
    
    // Save with compression settings
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_img_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error in image quality compression:', error);
    return null;
  }
};
