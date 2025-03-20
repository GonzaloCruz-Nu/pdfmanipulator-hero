import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configurar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Tipos de nivel de compresión
type CompressionLevel = 'low' | 'medium' | 'high';

interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

// Configuración de compresión por nivel - valores significativamente mejorados para calidad media
const COMPRESSION_SETTINGS = {
  low: { jpegQuality: 0.95, scaleFactor: 0.95 },       // Mínima compresión - calidad casi original
  medium: { jpegQuality: 0.9, scaleFactor: 0.95 },     // Compresión media mejorada - calidad visualmente idéntica
  high: { jpegQuality: 0.3, scaleFactor: 0.6 }         // Alta compresión - calidad reducida pero legible
};

export const useCompressPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);

  // Función auxiliar para renderizar página PDF a canvas con alta calidad
  async function renderPageToCanvas(pdfPage: pdfjsLib.PDFPageProxy, canvas: HTMLCanvasElement, scaleFactor: number): Promise<void> {
    // Usar viewport con mayor escala para mejorar la calidad de renderizado
    const viewport = pdfPage.getViewport({ scale: scaleFactor * 1.5 }); // Aumentamos la escala para mejor calidad
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }
    
    // Configuración para alta calidad de renderizado
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fondo blanco para eliminar transparencia
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      intent: 'display', // Cambiado a 'display' para mejor calidad visual
      renderInteractiveForms: true,
      canvasFactory: {
        create: function(width: number, height: number) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          return canvas;
        },
        reset: function(canvasAndContext: any, width: number, height: number) {
          canvasAndContext[0].width = width;
          canvasAndContext[0].height = height;
        },
        destroy: function(canvasAndContext: any) {
          // No es necesario hacer nada aquí
        }
      }
    };
    
    await pdfPage.render(renderContext).promise;
  }

  // Método de compresión optimizado para calidad visual
  async function compressPDFWithCanvas(
    file: File,
    level: CompressionLevel
  ): Promise<File | null> {
    try {
      // Obtener configuración según nivel
      const { jpegQuality, scaleFactor } = COMPRESSION_SETTINGS[level];
      
      // Cargar el documento con PDF.js
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: new Uint8Array(fileArrayBuffer),
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/',
        cMapPacked: true,
        disableFontFace: false, // Mantener fuentes originales para mejor visualización
        useSystemFonts: true
      });
      
      // Actualizar progreso inicial - carga del documento
      setProgress(10);
      
      const pdfDoc = await loadingTask.promise;
      
      // Crear un nuevo documento PDF
      const newPdfDoc = await PDFDocument.create();
      
      // Copiamos metadatos básicos para mantener información relevante
      if (level === 'low' || level === 'medium') {
        // Solo eliminamos metadatos para compresión alta
        newPdfDoc.setCreator("PDF Tools - Compresor PDF");
      } else {
        // Eliminar metadatos para ahorrar espacio en compresión alta
        newPdfDoc.setTitle("");
        newPdfDoc.setAuthor("");
        newPdfDoc.setSubject("");
        newPdfDoc.setKeywords([]);
        newPdfDoc.setProducer("");
        newPdfDoc.setCreator("");
      }
      
      // Procesar cada página
      const totalPages = pdfDoc.numPages;
      
      // Reservar 80% del progreso para el procesamiento de páginas (del 10% al 90%)
      const pageProgressWeight = 80 / totalPages;
      
      for (let i = 0; i < totalPages; i++) {
        // Actualizar progreso para cada página
        const currentPageProgress = 10 + Math.floor(i * pageProgressWeight);
        setProgress(currentPageProgress);
        
        // Obtener la página
        const pdfPage = await pdfDoc.getPage(i + 1);
        
        // Obtener dimensiones originales
        const viewport = pdfPage.getViewport({ scale: 1.0 });
        const width = viewport.width;
        const height = viewport.height;
        
        // Crear canvas con configuración de alta calidad
        const canvas = document.createElement('canvas');
        
        // Renderizar la página con calidad ajustada según nivel
        if (level === 'low' || level === 'medium') {
          // Para calidad media y baja, usar configuración de alta calidad
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
          }
        }
        
        // Renderizado de alta calidad para todos los niveles
        await renderPageToCanvas(pdfPage, canvas, scaleFactor);
        
        // Para nivel medio, usar formato PNG en lugar de JPEG para textos más nítidos
        let pageDataUrl;
        if (level === 'medium') {
          // Usar PNG para texto más nítido en nivel medio
          pageDataUrl = canvas.toDataURL('image/png', 1.0);
        } else {
          // Usar JPEG con calidad ajustada para otros niveles
          pageDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        }
        
        // Extraer la base64
        const base64 = pageDataUrl.split(',')[1];
        
        // Convertir base64 a Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        // Insertar la imagen en el nuevo PDF
        let pageImage;
        if (level === 'medium') {
          pageImage = await newPdfDoc.embedPng(bytes);
        } else {
          pageImage = await newPdfDoc.embedJpg(bytes);
        }
        
        // Agregar una nueva página con las dimensiones originales
        const newPage = newPdfDoc.addPage([width, height]);
        
        // Dibujar la imagen en la página
        newPage.drawImage(pageImage, {
          x: 0,
          y: 0,
          width: width,
          height: height
        });
        
        // Actualizar el progreso al final de cada página procesada
        const completedPageProgress = 10 + Math.floor((i + 1) * pageProgressWeight);
        setProgress(completedPageProgress);
      }
      
      // Actualizar progreso a 90% antes de guardar el documento
      setProgress(90);
      
      // Guardar el documento comprimido
      // Para nivel medio, usar más opciones para preservar calidad
      let compressedBytes;
      if (level === 'medium') {
        compressedBytes = await newPdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 100
        });
      } else {
        compressedBytes = await newPdfDoc.save();
      }
      
      // Actualizar progreso a 95% después de guardar
      setProgress(95);
      
      // Crear un nuevo archivo
      const result = new File(
        [compressedBytes],
        `comprimido_${file.name}`,
        { type: 'application/pdf' }
      );
      
      // Finalizar el progreso a 100%
      setProgress(100);
      
      return result;
    } catch (error) {
      console.error('Error al comprimir PDF con canvas:', error);
      // Asegurarse de que el progreso se complete incluso en caso de error
      setProgress(100);
      return null;
    }
  }

  // Función para calcular el porcentaje de compresión correctamente
  const calculateCompression = (originalSize: number, compressedSize: number) => {
    // El porcentaje reducido es (tamaño original - tamaño comprimido) / tamaño original * 100
    const savedPercentage = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10);
    return {
      originalSize,
      compressedSize,
      savedPercentage
    };
  };

  // Función principal para comprimir un PDF
  const compressPDF = async (file: File | null, compressionLevel: CompressionLevel) => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return;
    }

    try {
      setIsProcessing(true);
      setCompressionError(null);
      setCompressedFile(null);
      setCompressionInfo(null);
      setProgress(5);
      
      // Obtener tamaño original
      const fileSize = file.size;
      
      // Comprimir usando el método basado en canvas
      const compressedFile = await compressPDFWithCanvas(file, compressionLevel);
      
      // Si el progreso no llegó a 100%, forzarlo a 100%
      if (progress < 100) {
        setProgress(100);
      }
      
      if (compressedFile) {
        const compressionResult = calculateCompression(fileSize, compressedFile.size);
        
        // Verificar si se logró comprimir
        if (compressionResult.savedPercentage > 0) {
          setCompressedFile(compressedFile);
          setCompressionInfo(compressionResult);
          toast.success(`PDF comprimido con éxito. Ahorro: ${compressionResult.savedPercentage.toFixed(1)}%`);
        } else {
          setCompressionError('No se pudo comprimir significativamente el PDF. Es posible que ya esté optimizado.');
          toast.error('No se pudo comprimir significativamente el PDF.');
        }
      } else {
        setCompressionError('Error al comprimir el PDF. Intenta con otro archivo o nivel de compresión.');
        toast.error('Error al comprimir el PDF.');
      }
      
      // Asegurar que el progreso se complete
      setTimeout(() => setProgress(0), 500);
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      setCompressionError('Error al procesar el PDF. Intenta con otro archivo o nivel de compresión.');
      toast.error('Error al comprimir el PDF.');
      // Asegurar que el progreso se complete incluso en caso de error
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para descargar el archivo comprimido
  const downloadCompressedFile = () => {
    if (!compressedFile) return;
    
    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF descargado con éxito');
  };

  return {
    compressPDF,
    isProcessing,
    progress,
    compressionInfo,
    compressionError,
    compressedFile,
    downloadCompressedFile
  };
};
