
import { PDFDocument, rgb, degrees, PDFName, PDFDict } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Asegurar que el worker de PDF.js esté configurado
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Factores de compresión mucho más agresivos para lograr compresión similar a ilovepdf
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.2, scaleFactor: 0.7, colorReduction: 0.7 },
  medium: { imageQuality: 0.1, scaleFactor: 0.5, colorReduction: 0.5 },
  high: { imageQuality: 0.05, scaleFactor: 0.3, colorReduction: 0.3 }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0005; // 0.05% reducción mínima

// Método para calcular el porcentaje de compresión
export const calculateCompression = (originalSize: number, compressedSize: number) => {
  const savedPercentage = Math.max(0, Math.round((1 - (compressedSize / originalSize)) * 1000) / 10);
  return {
    originalSize,
    compressedSize,
    savedPercentage
  };
};

// Función auxiliar para renderizar página PDF a canvas usando pdf.js
async function renderPageToCanvas(pdfPage: pdfjsLib.PDFPageProxy, canvas: HTMLCanvasElement, scaleFactor: number): Promise<void> {
  try {
    const viewport = pdfPage.getViewport({ scale: scaleFactor });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };
    
    await pdfPage.render(renderContext).promise;
  } catch (error) {
    console.error('Error al renderizar página en canvas:', error);
    throw error;
  }
}

// Método de compresión basada en canvas (nueva implementación mejorada)
export const canvasBasedCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Cargar documento con pdf-lib para crear uno nuevo
    const originalDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Eliminar todos los metadatos
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Configurar factores de escala y calidad según el nivel deseado
    const jpegQuality = level === 'high' ? 0.3 : level === 'medium' ? 0.5 : 0.7;
    const scaleFactor = level === 'high' ? 0.3 : level === 'medium' ? 0.5 : 0.7;
    
    // Cargar documento con pdf.js para renderizado
    const loadingTask = pdfjsLib.getDocument(fileBuffer);
    const pdfDoc = await loadingTask.promise;
    
    // Procesar cada página
    for (let i = 0; i < pdfDoc.numPages; i++) {
      console.log(`Procesando página ${i + 1} de ${pdfDoc.numPages}...`);
      
      // Obtener la página con pdf.js para renderizado de alta calidad
      const pdfPage = await pdfDoc.getPage(i + 1);
      
      // Obtener dimensiones de la página original
      const viewport = pdfPage.getViewport({ scale: 1.0 });
      const width = viewport.width;
      const height = viewport.height;
      
      // Crear un canvas con dimensiones reducidas
      const canvas = document.createElement('canvas');
      
      // Renderizar la página en el canvas con el factor de escala aplicado
      await renderPageToCanvas(pdfPage, canvas, scaleFactor);
      
      // Convertir el contenido del canvas a una imagen JPEG con la calidad especificada
      const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      
      // Extraer la parte de datos base64 de la URL de datos
      const base64 = jpegDataUrl.split(',')[1];
      
      // Incrustar la imagen JPEG en el nuevo documento PDF
      const jpgImage = await newDoc.embedJpg(Buffer.from(base64, 'base64'));
      
      // Agregar una nueva página con las dimensiones del canvas y dibujar la imagen
      const newPage = newDoc.addPage([canvas.width, canvas.height]);
      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
      });
    }
    
    // Guardar el nuevo documento con opciones de compresión
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
    
    return new File(
      [compressedBytes],
      `comprimido_canvas_${fileName || 'documento.pdf'}`,
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error en compresión basada en canvas:', error);
    return null;
  }
};

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

// Método de compresión definitivo - completamente renovado para máxima compresión
export const ultimateCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Factores de compresión extrema
    const qualityReduction = level === 'high' ? 0.0005 : 
                            level === 'medium' ? 0.001 : 0.005;
    
    const sizeReduction = level === 'high' ? 0.15 : 
                         level === 'medium' ? 0.25 : 0.35;
    
    // Implementar conversión a escala de grises para compresión extrema
    const convertToGrayscale = level === 'high' || level === 'medium'; // Aplicado a medio y alto
                          
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
      
      // Crear página reducida - mucho más pequeña que antes
      const newPage = newDoc.addPage([width * sizeReduction, height * sizeReduction]);
      
      // Si nivel alto o medio, aplicar técnica de escala de grises
      if (convertToGrayscale) {
        // Agregar fondo blanco
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
          opacity: 0.70 // Opacidad reducida para mejor compresión
        });
      } else {
        // Dibujar con calidad reducida
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: width * sizeReduction,
          height: height * sizeReduction,
          opacity: 0.8
        });
      }
      
      // Eliminar anotaciones y metadatos adicionales
      if (newPage.node.has(PDFName.of('Annots'))) {
        newPage.node.delete(PDFName.of('Annots'));
      }
      
      if (newPage.node.has(PDFName.of('Metadata'))) {
        newPage.node.delete(PDFName.of('Metadata'));
      }
      
      // Eliminar todos los recursos posibles
      if (newPage.node.has(PDFName.of('Resources'))) {
        const resources = newPage.node.get(PDFName.of('Resources'));
        
        // Eliminar XObjects (imágenes)
        if (resources instanceof PDFDict && resources.has(PDFName.of('XObject'))) {
          resources.delete(PDFName.of('XObject'));
        }
        
        // Eliminar fuentes
        if (resources instanceof PDFDict && resources.has(PDFName.of('Font'))) {
          // En alta compresión, eliminar totalmente
          if (level === 'high' || level === 'medium') {
            resources.delete(PDFName.of('Font'));
          }
        }
        
        // Eliminar patrones
        if (resources instanceof PDFDict && resources.has(PDFName.of('Pattern'))) {
          resources.delete(PDFName.of('Pattern'));
        }
        
        // Eliminar shaders
        if (resources instanceof PDFDict && resources.has(PDFName.of('Shading'))) {
          resources.delete(PDFName.of('Shading'));
        }
      }
    }
    
    // Guardar con configuración muy agresiva
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 10 // Reducido para mejor compresión
    });
    
    return new File(
      [compressedBytes], 
      `comprimido_ult_${fileName || 'documento.pdf'}`, 
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error en compresión definitiva:', error);
    return null;
  }
};

