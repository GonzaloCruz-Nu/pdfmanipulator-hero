
import { PDFDocument, rgb, PDFName, PDFDict } from 'pdf-lib';

// Método de compresión extrema - mucho más agresivo
export const extremeCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Factores más agresivos
    const qualityFactor = level === 'high' ? 0.001 : 
                         level === 'medium' ? 0.005 : 0.01;
    
    const scaleFactor = level === 'high' ? 0.2 : 
                        level === 'medium' ? 0.3 : 0.4;
    
    // Crear un documento nuevo con configuración óptima
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Eliminar todos los metadatos
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
      
      // Estrategia 1: Para PDFs con muchas imágenes - las convertimos a baja resolución
      // Incrustar la página original
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Crear nueva página con dimensiones reducidas
      const newPage = newDoc.addPage([width * scaleFactor, height * scaleFactor]);
      
      // Dibujar fondo blanco para reducir información
      newPage.drawRectangle({
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        color: rgb(1, 1, 1), // Blanco
      });
      
      // Dibujar la página incrustada en la nueva página con escala reducida
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        opacity: 0.95
      });
      
      // Eliminar anotaciones y metadatos adicionales
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
      
      if (newPage.node.has(PDFName.of('Metadata'))) {
        newPage.node.delete(PDFName.of('Metadata'));
      }
      
      // Eliminar recursos como imágenes para máxima compresión
      if (newPage.node.has(PDFName.of('Resources'))) {
        const resources = newPage.node.get(PDFName.of('Resources'));
        
        // Eliminar XObjects (imágenes)
        if (resources instanceof PDFDict && resources.has(PDFName.of('XObject'))) {
          resources.delete(PDFName.of('XObject'));
        }
        
        // Eliminar fuentes para alta compresión
        if (level === 'high' && resources instanceof PDFDict && resources.has(PDFName.of('Font'))) {
          resources.delete(PDFName.of('Font'));
        }
      }
    }
    
    // Guardar con configuración agresiva
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_max_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error en compresión extrema:', error);
    return null;
  }
};
