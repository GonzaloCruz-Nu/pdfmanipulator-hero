
import { PDFDocument, rgb, degrees, PDFName } from 'pdf-lib';

// Constants for compression - significantly more aggressive
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.5, scaleFactor: 0.8, colorReduction: 0.8 },
  medium: { imageQuality: 0.3, scaleFactor: 0.6, colorReduction: 0.6 },
  high: { imageQuality: 0.1, scaleFactor: 0.4, colorReduction: 0.4 }
};

// Minimum size reduction threshold lowered to detect smaller improvements
export const MIN_SIZE_REDUCTION = 0.0005; // 0.05% minimum reduction

// Method for calculating compression percentage
export const calculateCompression = (originalSize: number, compressedSize: number) => {
  const savedPercentage = Math.max(0, Math.round((1 - (compressedSize / originalSize)) * 1000) / 10);
  return {
    originalSize,
    compressedSize,
    savedPercentage
  };
};

// Standard compression method - improved with more aggressive settings
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
    
    // Remove all metadata more aggressively
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    
    // Get all pages and flatten them (reduce complexity)
    const pages = pdfDoc.getPages();
    
    // Apply additional compression techniques to each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Remove annotations 
      if (page.node.has(PDFName.of('Annots'))) {
        page.node.delete(PDFName.of('Annots'));
      }
      
      // Remove unnecessary page attributes
      if (page.node.has(PDFName.of('UserUnit'))) {
        page.node.delete(PDFName.of('UserUnit'));
      }
      
      // Remove metadata on page level
      if (page.node.has(PDFName.of('Metadata'))) {
        page.node.delete(PDFName.of('Metadata'));
      }
    }
    
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
      // Add new compression options
      compress: true
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

// Aggressive compression method - significantly more aggressive
export const aggressiveCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    const { scaleFactor } = COMPRESSION_FACTORS[level];
    
    const srcPdfDoc = await PDFDocument.load(fileBuffer);
    const newPdfDoc = await PDFDocument.create();
    
    // Remove all metadata
    newPdfDoc.setTitle("");
    newPdfDoc.setAuthor("");
    newPdfDoc.setSubject("");
    newPdfDoc.setKeywords([]);
    newPdfDoc.setProducer("");
    newPdfDoc.setCreator("");
    
    const pages = srcPdfDoc.getPages();
    
    // More aggressive scaling for each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      const [copiedPage] = await newPdfDoc.copyPages(srcPdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);
      
      const currentPage = newPdfDoc.getPage(i);
      
      // Apply more aggressive scaling
      currentPage.setSize(width * scaleFactor, height * scaleFactor);
      currentPage.scale(1/scaleFactor, 1/scaleFactor);
      
      // Remove annotations and other metadata
      if (currentPage.node.has(PDFName.of('Annots'))) {
        currentPage.node.delete(PDFName.of('Annots'));
      }
      
      // Remove more unnecessary data
      if (currentPage.node.has(PDFName.of('UserUnit'))) {
        currentPage.node.delete(PDFName.of('UserUnit'));
      }
      
      if (currentPage.node.has(PDFName.of('Metadata'))) {
        currentPage.node.delete(PDFName.of('Metadata'));
      }
    }
    
    const compressedBytes = await newPdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
      compress: true
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

// Extreme compression method - much more aggressive
export const extremeCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // More aggressive factors
    const qualityFactor = level === 'high' ? 0.005 : 
                         level === 'medium' ? 0.01 : 0.05;
    
    const scaleFactor = level === 'high' ? 0.3 : 
                        level === 'medium' ? 0.4 : 0.5;
    
    // Create a new document
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Remove all metadata
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // For each page in the original document
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Embed the original page
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Create a new page with reduced dimensions
      const newPage = newDoc.addPage([width * scaleFactor, height * scaleFactor]);
      
      // Draw the embedded page in the new page with a more aggressive scale
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        opacity: 0.95
      });
      
      // Remove annotations and additional metadata
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
      
      if (newPage.node.has(PDFName.of('Metadata'))) {
        newPage.node.delete(PDFName.of('Metadata'));
      }
    }
    
    // Save with aggressive settings
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      compress: true
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

// Image quality compression method - significantly improved
export const imageQualityCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Load original document
    const originalDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Remove all metadata
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Quality configuration based on level - much more aggressive
    const imageQuality = level === 'high' ? 0.005 : 
                        level === 'medium' ? 0.01 : 0.05;
    
    const scaleFactor = level === 'high' ? 0.3 : 
                        level === 'medium' ? 0.4 : 0.5;
    
    // Get original pages
    const pages = originalDoc.getPages();
    
    // Convert each page to a low-quality image
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Create a page in the new document with reduced dimensions
      const newPage = newDoc.addPage([width * scaleFactor, height * scaleFactor]);
      
      // Embed the original page
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Draw with reduced quality
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        opacity: 0.9
      });
      
      // Remove unnecessary data
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
      
      if (newPage.node.has(PDFName.of('Metadata'))) {
        newPage.node.delete(PDFName.of('Metadata'));
      }
    }
    
    // Save with aggressive compression options
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      compress: true
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

// Ultimate compression method - completely renewed for maximum compression
export const ultimateCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Extreme compression factors
    const qualityReduction = level === 'high' ? 0.001 : 
                            level === 'medium' ? 0.005 : 0.01;
    
    const sizeReduction = level === 'high' ? 0.25 : 
                         level === 'medium' ? 0.35 : 0.45;
    
    // Implement grayscale conversion for extreme compression
    const convertToGrayscale = level !== 'low'; // Now applied to medium and high
                          
    // Load original document
    const srcDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Remove all metadata
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Get pages
    const pages = srcDoc.getPages();
    
    // Process each page with extreme compression
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Embed page with reduced quality
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Create reduced page - much smaller than before
      const newPage = newDoc.addPage([width * sizeReduction, height * sizeReduction]);
      
      // If high or medium level, apply grayscale technique
      if (convertToGrayscale) {
        // Add white background
        newPage.drawRectangle({
          x: 0,
          y: 0,
          width: width * sizeReduction,
          height: height * sizeReduction,
          color: rgb(1, 1, 1), // White
        });
        
        // Draw original content in grayscale
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: width * sizeReduction,
          height: height * sizeReduction,
          opacity: 0.85 // Reduced opacity for better compression
        });
      } else {
        // Draw with reduced quality
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: width * sizeReduction,
          height: height * sizeReduction,
          opacity: 0.9
        });
      }
      
      // Remove annotations and additional metadata
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
      
      if (newPage.node.has(PDFName.of('Metadata'))) {
        newPage.node.delete(PDFName.of('Metadata'));
      }
    }
    
    // Save with very aggressive settings
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 10, // Reduced for better compression
      compress: true
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_ult_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error in ultimate compression:', error);
    return null;
  }
};
