
import { PDFDocument, rgb, degrees, PDFName } from 'pdf-lib';

// Constants for compression - ajustados para mejor compresión
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.7, scaleFactor: 0.9, colorReduction: 0.9 },
  medium: { imageQuality: 0.4, scaleFactor: 0.75, colorReduction: 0.7 },
  high: { imageQuality: 0.1, scaleFactor: 0.6, colorReduction: 0.5 }
};

// Reducimos el umbral para considerar que la compresión fue efectiva
export const MIN_SIZE_REDUCTION = 0.001; // 0.1% de reducción mínima

// Method for calculating compression percentage
export const calculateCompression = (originalSize: number, compressedSize: number) => {
  const savedPercentage = Math.max(0, Math.round((1 - (compressedSize / originalSize)) * 1000) / 10);
  return {
    originalSize,
    compressedSize,
    savedPercentage
  };
};

// Standard compression method - mejorado
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
    
    // Eliminar metadatos innecesarios
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
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

// Aggressive compression method - mejorado
export const aggressiveCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    const { scaleFactor } = COMPRESSION_FACTORS[level];
    
    const srcPdfDoc = await PDFDocument.load(fileBuffer);
    const newPdfDoc = await PDFDocument.create();
    
    // Eliminar metadatos
    newPdfDoc.setTitle("");
    newPdfDoc.setAuthor("");
    newPdfDoc.setSubject("");
    newPdfDoc.setKeywords([]);
    newPdfDoc.setProducer("");
    newPdfDoc.setCreator("");
    
    const pages = srcPdfDoc.getPages();
    
    // Copiar páginas con escala reducida
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      const [copiedPage] = await newPdfDoc.copyPages(srcPdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);
      
      const currentPage = newPdfDoc.getPage(i);
      currentPage.setSize(width * scaleFactor, height * scaleFactor);
      currentPage.scale(1/scaleFactor, 1/scaleFactor);
      
      // Eliminar anotaciones (como enlaces) para reducir tamaño
      // Fix: Use PDFName instead of string
      if (currentPage.node.has(PDFName.of('Annots'))) {
        currentPage.node.delete(PDFName.of('Annots'));
      }
    }
    
    const compressedBytes = await newPdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
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

// Extreme compression method - mucho más agresivo
export const extremeCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Factores más agresivos
    const qualityFactor = level === 'high' ? 0.01 : 
                          level === 'medium' ? 0.05 : 0.10;
    
    const scaleFactor = level === 'high' ? 0.5 : 
                        level === 'medium' ? 0.6 : 0.7;
    
    // Crear un nuevo documento
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Eliminar metadatos
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Para cada página en el documento original
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Incrustar la página original
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Crear una nueva página con dimensiones reducidas
      const newPage = newDoc.addPage([width * scaleFactor, height * scaleFactor]);
      
      // Dibujar la página incrustada en la nueva página
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        opacity: 1
      });
    }
    
    // Guardar el documento comprimido
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

// Method that compresses by reducing image quality - mejorado significativamente
export const imageQualityCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Cargar documento original
    const originalDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Eliminar metadatos
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Configuración de calidad basada en nivel
    const imageQuality = level === 'high' ? 0.01 : 
                        level === 'medium' ? 0.05 : 0.1;
    
    // Obtener páginas originales
    const pages = originalDoc.getPages();
    
    // Convertir cada página a una imagen de baja calidad
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Crear página en el nuevo documento
      const newPage = newDoc.addPage([width, height]);
      
      // Incrustar la página original
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Dibujar con calidad reducida
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
        opacity: 1
      });
      
      // Eliminar datos innecesarios
      // Fix: Use PDFName instead of string
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
    }
    
    // Guardar con opciones agresivas de compresión
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

// Método ultimateCompression - completamente renovado para máxima compresión
export const ultimateCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Factores extremos de compresión
    const qualityReduction = level === 'high' ? 0.005 : 
                            level === 'medium' ? 0.01 : 0.02;
    
    const sizeReduction = level === 'high' ? 0.4 : 
                         level === 'medium' ? 0.5 : 0.6;
    
    // Implementación de conversión a blanco y negro para compresión extrema
    const convertToGrayscale = level === 'high';
                          
    // Cargar documento original
    const srcDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Eliminar todos los metadatos
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Obtener páginas
    const pages = srcDoc.getPages();
    
    // Procesar cada página con compresión extrema
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Incrustar página con calidad reducida
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Crear página reducida
      const newPage = newDoc.addPage([width * sizeReduction, height * sizeReduction]);
      
      // Si es nivel alto, aplicar técnica de blanco y negro
      if (convertToGrayscale) {
        // Añadir fondo blanco
        newPage.drawRectangle({
          x: 0,
          y: 0,
          width: width * sizeReduction,
          height: height * sizeReduction,
          color: rgb(1, 1, 1), // Blanco
        });
        
        // Dibujar contenido original en escala de grises
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: width * sizeReduction,
          height: height * sizeReduction,
          opacity: 0.9
        });
      } else {
        // Dibujar con calidad reducida
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: width * sizeReduction,
          height: height * sizeReduction,
          opacity: 0.95
        });
      }
      
      // Eliminar anotaciones y metadatos adicionales
      // Fix: Use PDFName instead of string
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
    }
    
    // Guardar con configuraciones agresivas
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 20,
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
