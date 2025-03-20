
import { PDFDocument, rgb, PDFName, PDFDict } from 'pdf-lib';

// Método de compresión de calidad de imagen - significativamente mejorado
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
    
    // Configuración de calidad basada en nivel - mucho más agresiva
    const imageQuality = level === 'high' ? 0.001 : 
                        level === 'medium' ? 0.005 : 0.01;
    
    const scaleFactor = level === 'high' ? 0.2 : 
                        level === 'medium' ? 0.3 : 0.4;
    
    // Obtener páginas originales
    const pages = originalDoc.getPages();
    
    // Convertir cada página a una imagen de baja calidad
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
      
      // Dibujar con calidad reducida
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: width * scaleFactor,
        height: height * scaleFactor,
        opacity: 0.7 // Reducir opacidad para mejor compresión
      });
      
      // Eliminar datos innecesarios
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
      
      if (newPage.node.has(PDFName.of('Metadata'))) {
        newPage.node.delete(PDFName.of('Metadata'));
      }
      
      // Eliminar recursos para maximizar la compresión
      if (newPage.node.has(PDFName.of('Resources'))) {
        const resources = newPage.node.get(PDFName.of('Resources'));
        
        if (resources instanceof PDFDict && resources.has(PDFName.of('XObject'))) {
          resources.delete(PDFName.of('XObject'));
        }
        
        // Para compresión alta, eliminar fuentes también
        if (level === 'high' && resources instanceof PDFDict && resources.has(PDFName.of('Font'))) {
          resources.delete(PDFName.of('Font'));
        }
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
