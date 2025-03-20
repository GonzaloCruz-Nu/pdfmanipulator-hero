
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Enumeración de técnicas de compresión inspiradas en GhostScript
enum CompressionTechnique {
  DCTEncode, // Similar a JPEG
  Flate,     // Similar a ZIP/GZIP
  RunLength  // Run-length encoding
}

// Valores de configuración inspirados en GhostScript
const GS_COMPRESSION_SETTINGS = {
  low: {
    imageDownsample: 150, // DPI
    colorCompression: CompressionTechnique.DCTEncode,
    colorCompressionQuality: 0.5,
    grayCompression: CompressionTechnique.DCTEncode,
    grayCompressionQuality: 0.5,
    monoCompression: CompressionTechnique.Flate,
    textCompression: true
  },
  medium: {
    imageDownsample: 100, // DPI
    colorCompression: CompressionTechnique.DCTEncode,
    colorCompressionQuality: 0.3,
    grayCompression: CompressionTechnique.DCTEncode,
    grayCompressionQuality: 0.3,
    monoCompression: CompressionTechnique.Flate,
    textCompression: true
  },
  high: {
    imageDownsample: 72, // DPI
    colorCompression: CompressionTechnique.DCTEncode,
    colorCompressionQuality: 0.1,
    grayCompression: CompressionTechnique.DCTEncode,
    grayCompressionQuality: 0.1,
    monoCompression: CompressionTechnique.Flate,
    textCompression: true
  }
};

// Método de compresión inspirado en técnicas de GhostScript
export const ghostscriptLikeCompression = async (
  fileBuffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string
): Promise<File | null> => {
  try {
    // Configurar PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    // Cargar el documento con PDF.js para identificar y procesar elementos
    const loadingTask = pdfjsLib.getDocument(fileBuffer);
    const pdfJsDoc = await loadingTask.promise;
    
    // Cargar el documento con pdf-lib para manipulación
    const originalDoc = await PDFDocument.load(fileBuffer);
    const newDoc = await PDFDocument.create();
    
    // Eliminar metadatos para reducir tamaño
    newDoc.setTitle("");
    newDoc.setAuthor("");
    newDoc.setSubject("");
    newDoc.setKeywords([]);
    newDoc.setProducer("");
    newDoc.setCreator("");
    
    // Obtener configuración según el nivel
    const settings = GS_COMPRESSION_SETTINGS[level];
    
    // Calcular factor de escala para representar el DPI
    const scaleFactor = settings.imageDownsample / 72; // 72 DPI es el estándar en PDF
    
    // Obtener calidad para compresión JPEG
    const jpegQuality = level === 'high' ? 0.1 : 
                       level === 'medium' ? 0.3 : 0.5;
    
    // Procesamos cada página del documento
    for (let i = 0; i < pdfJsDoc.numPages; i++) {
      console.log(`Procesando página ${i + 1} con compresión tipo GhostScript...`);
      
      // Obtener la página con PDF.js
      const pdfJsPage = await pdfJsDoc.getPage(i + 1);
      
      // Obtener dimensiones originales
      const viewport = pdfJsPage.getViewport({ scale: 1.0 });
      const width = viewport.width;
      const height = viewport.height;
      
      // Crear canvas para renderizado con resolución reducida
      const canvas = document.createElement('canvas');
      canvas.width = width * scaleFactor;
      canvas.height = height * scaleFactor;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto 2D del canvas');
      }
      
      // Fondo blanco (simula comportamiento de GhostScript)
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Renderizar página
      const renderContext = {
        canvasContext: ctx,
        viewport: pdfJsPage.getViewport({ scale: scaleFactor }),
      };
      
      await pdfJsPage.render(renderContext).promise;
      
      // Simular compresión según la técnica (similar a GhostScript)
      let dataUrl;
      if (settings.colorCompression === CompressionTechnique.DCTEncode) {
        // Compresión JPEG (DCTEncode en GhostScript)
        dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      } else {
        // Compresión PNG para técnicas sin pérdida
        dataUrl = canvas.toDataURL('image/png');
      }
      
      // Extraer datos base64
      const base64 = dataUrl.split(',')[1];
      let image;
      
      // Incorporar imagen al nuevo documento
      if (settings.colorCompression === CompressionTechnique.DCTEncode) {
        image = await newDoc.embedJpg(Buffer.from(base64, 'base64'));
      } else {
        image = await newDoc.embedPng(Buffer.from(base64, 'base64'));
      }
      
      // Crear nueva página
      const newPage = newDoc.addPage([width, height]);
      
      // Dibujar la imagen comprimida
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height
      });
    }
    
    // Guardar con configuración óptima
    const compressedBytes = await newDoc.save({
      useObjectStreams: true,       // Similar a /Flate en GhostScript
      addDefaultPage: false,
      objectsPerTick: 40            // Mejorar rendimiento
    });
    
    return new File(
      [compressedBytes],
      `gs_comprimido_${fileName || 'documento.pdf'}`,
      { type: 'application/pdf' }
    );
  } catch (error) {
    console.error('Error en compresión tipo GhostScript:', error);
    return null;
  }
};
