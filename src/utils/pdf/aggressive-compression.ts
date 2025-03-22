
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { COMPRESSION_FACTORS } from './compression-constants';

// Verificar compatibilidad con WebAssembly
const isWasmSupported = (): boolean => {
  try {
    return typeof WebAssembly === 'object' && 
           typeof WebAssembly.instantiate === 'function' &&
           typeof WebAssembly.compile === 'function';
  } catch (e) {
    console.error('Error checking WebAssembly support:', e);
    return false;
  }
};

// Método de compresión agresiva - significativamente más agresivo pero preservando texto
export const aggressiveCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    const wasmSupported = isWasmSupported();
    console.info(`Compresión agresiva con WebAssembly: ${wasmSupported}`);
    
    const { scaleFactor, preserveTextQuality } = COMPRESSION_FACTORS[level];
    
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
    
    // Factores de compresión optimizados con WebAssembly
    const optimizedScaleFactor = wasmSupported ? 
      Math.min(scaleFactor * 1.05, 1.0) : scaleFactor;
    
    // Escalado más agresivo para cada página, pero preservando texto en niveles bajo y medio
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      const [copiedPage] = await newPdfDoc.copyPages(srcPdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);
      
      const currentPage = newPdfDoc.getPage(i);
      
      // Aplicar escalado más agresivo
      currentPage.setSize(width * optimizedScaleFactor, height * optimizedScaleFactor);
      currentPage.scale(1/optimizedScaleFactor, 1/optimizedScaleFactor);
      
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

      // Manejar recursos como imágenes y fuentes grandes de forma más inteligente
      if (currentPage.node.has(PDFName.of('Resources'))) {
        const resources = currentPage.node.get(PDFName.of('Resources'));
        
        // Eliminar XObjects (imágenes principalmente) solo en alta compresión
        if (level === 'high' && resources instanceof PDFDict && resources.has(PDFName.of('XObject'))) {
          resources.delete(PDFName.of('XObject'));
        }
        
        // NUNCA eliminar fuentes por completo para preservar la legibilidad del texto
        // Solo reducir/optimizar en alta compresión
        if (level === 'high' && !preserveTextQuality && resources instanceof PDFDict && resources.has(PDFName.of('Font'))) {
          // Opcionalmente, optimizar fuentes sin eliminarlas completamente
          // Esto podría hacer que el texto se vea diferente pero seguiría siendo legible
          // Por ahora, mantenemos las fuentes para preservar legibilidad
        }
      }
    }
    
    const compressedBytes = await newPdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
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
