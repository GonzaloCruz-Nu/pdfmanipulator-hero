
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { COMPRESSION_FACTORS } from './compression-constants';

// Asegurar que el worker de PDF.js esté configurado
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    
    // Fondo blanco para eliminar transparencia y mejorar compresión JPEG
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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

// Método de compresión basada en canvas (implementación GhostScript-like)
export const canvasBasedCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Crear copias de seguridad del ArrayBuffer para evitar problemas de "detached ArrayBuffer"
    const fileBufferCopy = new Uint8Array(fileBuffer.slice(0));
    
    // Cargar documento con pdf-lib para crear uno nuevo
    const originalDoc = await PDFDocument.load(fileBufferCopy);
    const newDoc = await PDFDocument.create();
    
    // Eliminar todos los metadatos
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Usar los factores de compresión definidos en las constantes
    const { imageQuality, scaleFactor } = COMPRESSION_FACTORS[level];
    
    // Usar otra copia para pdf.js
    const pdfJsBuffer = new Uint8Array(fileBuffer.slice(0));
    
    // Cargar documento con pdf.js para renderizado
    const loadingTask = pdfjsLib.getDocument({ data: pdfJsBuffer });
    const pdfDoc = await loadingTask.promise;
    
    // Procesar cada página
    for (let i = 0; i < pdfDoc.numPages; i++) {
      console.log(`Procesando página ${i + 1} de ${pdfDoc.numPages} con compresión GhostScript-like...`);
      
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
      
      // Aplicar compresión JPEG según el nivel configurado
      const jpegDataUrl = canvas.toDataURL('image/jpeg', imageQuality);
      
      // Extraer la parte de datos base64 de la URL de datos
      const base64 = jpegDataUrl.split(',')[1];
      
      // Incrustar la imagen JPEG en el nuevo documento PDF
      const jpgImage = await newDoc.embedJpg(Buffer.from(base64, 'base64'));
      
      // Agregar una nueva página con las dimensiones originales y dibujar la imagen
      const newPage = newDoc.addPage([width, height]);
      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: width,
        height: height
      });
    }
    
    // Guardar con configuración óptima (similar a las opciones -dPDFSETTINGS=/ebook de GhostScript)
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100 // Aumentar performance
    });
    
    return new File(
      [compressedBytes],
      `comprimido_gs_${fileName || 'documento.pdf'}`,
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error en compresión basada en canvas (GhostScript-like):', error);
    return null;
  }
};
