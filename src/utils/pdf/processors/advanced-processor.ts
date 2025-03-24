
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { COMPRESSION_FACTORS } from '../compression-constants';
import { CompressionLevel } from '../compression-types';

/**
 * Comprime un PDF utilizando técnicas avanzadas de optimización
 * @param file Archivo PDF a comprimir
 * @param compressionLevel Nivel de compresión deseado
 * @param progressCallback Función de callback para reportar progreso
 * @returns Archivo PDF comprimido o null si falla
 */
export async function compressPDFAdvanced(
  file: File,
  compressionLevel: CompressionLevel,
  progressCallback: (progress: number) => void = () => {}
): Promise<File | null> {
  try {
    // Obtener configuración de compresión según nivel
    const {
      imageQuality,
      scaleFactor,
      useHighQualityFormat,
      preserveTextQuality,
      textMode,
      resmushQuality
    } = COMPRESSION_FACTORS[compressionLevel];
    
    // Reportar inicio de procesamiento
    progressCallback(5);
    console.info(`Iniciando compresión avanzada de PDF con nivel ${compressionLevel}`);
    
    // Cargar el archivo como ArrayBuffer
    const fileArrayBuffer = await file.arrayBuffer();
    
    // Cargar el documento PDF con pdf-lib
    const pdfDoc = await PDFDocument.load(fileArrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    
    // Eliminar metadatos para reducir tamaño
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    
    // Obtener todas las páginas
    const pages = pdfDoc.getPages();
    const numPages = pages.length;
    
    // Procesar cada página para optimizar imágenes
    for (let i = 0; i < numPages; i++) {
      // Calcular y reportar progreso
      const pageProgress = 10 + Math.floor((i / numPages) * 80);
      progressCallback(pageProgress);
      
      console.info(`Procesando página ${i + 1}/${numPages}`);
      
      // Obtener la página actual
      const page = pages[i];
      
      // Eliminar anotaciones para reducir tamaño
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

      // Eliminar recursos pesados cuando sea apropiado según el nivel de compresión
      if (compressionLevel === 'high' && page.node.has(PDFName.of('Resources'))) {
        const resources = page.node.get(PDFName.of('Resources'));
        
        // Eliminar objetos XObject (imágenes principalmente) en alta compresión
        if (resources instanceof PDFDict && resources.has(PDFName.of('XObject'))) {
          resources.delete(PDFName.of('XObject'));
        }
      }
    }
    
    // Guardar el documento con opciones de compresión
    progressCallback(95);
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100
    });
    
    // Crear nuevo archivo con el PDF comprimido
    const compressedFileName = file.name.replace('.pdf', '_comprimido.pdf');
    const compressedFile = new File([compressedPdfBytes], compressedFileName, {
      type: 'application/pdf',
      lastModified: new Date().getTime(),
    });
    
    // Reportar finalización
    progressCallback(100);
    console.info(`Compresión avanzada completada: ${file.size} bytes -> ${compressedFile.size} bytes`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error en compresión avanzada de PDF:', error);
    return null;
  }
}
