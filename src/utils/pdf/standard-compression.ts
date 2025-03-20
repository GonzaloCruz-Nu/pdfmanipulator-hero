
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { COMPRESSION_FACTORS } from './compression-constants';

// Método de compresión estándar - mejorado con configuraciones más agresivas
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
    
    // Eliminar todos los metadatos agresivamente
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    
    // Obtener todas las páginas y aplanarlas (reducir complejidad)
    const pages = pdfDoc.getPages();
    
    // Aplicar técnicas de compresión adicionales a cada página
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Remover anotaciones
      if (page.node.has(PDFName.of('Annots'))) {
        page.node.delete(PDFName.of('Annots'));
      }
      
      // Eliminar atributos de página innecesarios
      if (page.node.has(PDFName.of('UserUnit'))) {
        page.node.delete(PDFName.of('UserUnit'));
      }
      
      // Eliminar metadatos a nivel de página
      if (page.node.has(PDFName.of('Metadata'))) {
        page.node.delete(PDFName.of('Metadata'));
      }

      // Eliminar otros recursos pesados
      // Configuración global más agresiva
      if (page.node.has(PDFName.of('Resources'))) {
        const resources = page.node.get(PDFName.of('Resources'));
        if (resources instanceof PDFDict && resources.has(PDFName.of('XObject'))) {
          resources.delete(PDFName.of('XObject'));
        }
      }
    }
    
    // Aplicar compresión más agresiva
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error en compresión estándar:', error);
    return null;
  }
};
