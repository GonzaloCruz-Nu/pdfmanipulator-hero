
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

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
    
    // Configurar factores de escala y calidad según el nivel deseado
    const jpegQuality = level === 'high' ? 0.3 : level === 'medium' ? 0.5 : 0.7;
    const scaleFactor = level === 'high' ? 0.5 : level === 'medium' ? 0.7 : 0.8;
    
    // Usar otra copia para pdf.js
    const pdfJsBuffer = new Uint8Array(fileBuffer.slice(0));
    
    // Cargar documento con pdf.js para renderizado
    const loadingTask = pdfjsLib.getDocument({ data: pdfJsBuffer });
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
      const newPage = newDoc.addPage([width, height]);
      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: width,
        height: height
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
