
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { COMPRESSION_FACTORS } from './compression-constants';

// Método de compresión agresiva - significativamente más agresivo
export const aggressiveCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    const { scaleFactor } = COMPRESSION_FACTORS[level];
    
    const srcPdfDoc = await PDFDocument.load(fileBuffer);
    const newPdfDoc = await PDFDocument.create();
    
    // Eliminar todos los metadatos
    newPdfDoc.setTitle("");
    newPdfDoc.setAuthor("");
    newPdfDoc.setSubject("");
    newPdfDoc.setKeywords([]);
    newPdfDoc.setProducer("");
    newPdfDoc.setCreator("");
    
    const pages = srcPdfDoc.getPages();
    
    // Escalado más agresivo para cada página
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      const [copiedPage] = await newPdfDoc.copyPages(srcPdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);
      
      const currentPage = newPdfDoc.getPage(i);
      
      // Aplicar escalado más agresivo
      currentPage.setSize(width * scaleFactor, height * scaleFactor);
      currentPage.scale(1/scaleFactor, 1/scaleFactor);
      
      // Eliminar anotaciones y otros metadatos
      if (currentPage.node.has(PDFName.of('Annots'))) {
        currentPage.node.delete(PDFName.of('Annots'));
      }
      
      // Eliminar más datos innecesarios
      if (currentPage.node.has(PDFName.of('UserUnit'))) {
        currentPage.node.delete(PDFName.of('UserUnit'));
      }
      
      if (currentPage.node.has(PDFName.of('Metadata'))) {
        currentPage.node.delete(PDFName.of('Metadata'));
      }

      // Eliminar recursos como imágenes y fuentes grandes
      if (currentPage.node.has(PDFName.of('Resources'))) {
        const resources = currentPage.node.get(PDFName.of('Resources'));
        
        // Eliminar XObjects (imágenes principalmente)
        if (resources instanceof PDFDict && resources.has(PDFName.of('XObject'))) {
          resources.delete(PDFName.of('XObject'));
        }
        
        // Eliminar o reducir fuentes
        if (resources instanceof PDFDict && resources.has(PDFName.of('Font'))) {
          // En compresor extremo, eliminar fuentes por completo
          if (level === 'high') {
            resources.delete(PDFName.of('Font'));
          }
        }
      }
    }
    
    const compressedBytes = await newPdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error en compresión agresiva:', error);
    return null;
  }
};
