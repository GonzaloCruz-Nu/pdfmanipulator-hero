
import { PDFDocument, rgb, PDFName, PDFDict } from 'pdf-lib';

// Método de compresión de calidad de imagen - mejorado para preservar texto
export const imageQualityCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Cargar documento original
    const originalDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Eliminar todos los metadatos
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Configuración de calidad basada en nivel - ajustado para mejor legibilidad
    const imageQuality = level === 'high' ? 0.05 : 
                        level === 'medium' ? 0.15 : 0.3;
    
    const scaleFactor = level === 'high' ? 0.35 : 
                        level === 'medium' ? 0.5 : 0.7;
    
    // Obtener páginas originales
    const pages = originalDoc.getPages();
    
    // Convertir cada página a una imagen de mejor calidad
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // Crear una página en el nuevo documento con dimensiones reducidas
      const newPage = newDoc.addPage([width * scaleFactor, height * scaleFactor]);
      
      // Agregar fondo blanco
      newPage.drawRectangle({
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        color: rgb(1, 1, 1), // Blanco
      });
      
      // Incrustar la página original
      const [embeddedPage] = await newDoc.embedPages([page]);
      
      // Dibujar con mejor calidad, especialmente en niveles bajo y medio
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        opacity: level === 'high' ? 0.8 : 1.0 // Mantener opacidad completa para mejor legibilidad excepto en alta compresión
      });
      
      // Eliminar datos innecesarios pero mantener la integridad del texto
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
      
      if (newPage.node.has(PDFName.of('Metadata'))) {
        newPage.node.delete(PDFName.of('Metadata'));
      }
      
      // Solo eliminar recursos en alta compresión, preservar en baja y media
      if (level === 'high' && newPage.node.has(PDFName.of('Resources'))) {
        const resources = newPage.node.get(PDFName.of('Resources'));
        
        if (resources instanceof PDFDict && resources.has(PDFName.of('XObject'))) {
          resources.delete(PDFName.of('XObject'));
        }
        
        // NUNCA eliminar fuentes por completo, solo en casos extremos
        // if (level === 'high' && resources instanceof PDFDict && resources.has(PDFName.of('Font'))) {
        //   resources.delete(PDFName.of('Font'));
        // }
      }
    }
    
    // Guardar con opciones de compresión agresivas
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_img_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error en compresión de calidad de imagen:', error);
    return null;
  }
};
