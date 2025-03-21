
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { COMPRESSION_FACTORS, MIN_SIZE_REDUCTION } from '@/utils/pdf/compression-constants';

// Configurar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Tipos de nivel de compresión
type CompressionLevel = 'low' | 'medium' | 'high';

interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

export const useCompressPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);

  // Función auxiliar para renderizar página PDF a canvas
  async function renderPageToCanvas(pdfPage: pdfjsLib.PDFPageProxy, canvas: HTMLCanvasElement, scaleFactor: number): Promise<void> {
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
      intent: 'print', // Usar intent print para mejor calidad de texto
      antialiasing: true // Mejorar la calidad visual
    };
    
    await pdfPage.render(renderContext).promise;
  }

  // Método de compresión basado en canvas (similar a GhostScript)
  async function compressPDFWithCanvas(
    file: File,
    level: CompressionLevel
  ): Promise<File | null> {
    try {
      // Obtener configuración según nivel
      const { imageQuality, scaleFactor, colorReduction } = COMPRESSION_FACTORS[level];
      
      // Cargar el documento con PDF.js
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileArrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      
      // Crear un nuevo documento PDF
      const newPdfDoc = await PDFDocument.create();
      
      // Para nivel bajo, preservamos algunos metadatos pero aplicamos compresión básica
      if (level !== 'low') {
        // Eliminar metadatos para niveles medio y alto
        newPdfDoc.setTitle("");
        newPdfDoc.setAuthor("");
        newPdfDoc.setSubject("");
        newPdfDoc.setKeywords([]);
        newPdfDoc.setProducer("");
        newPdfDoc.setCreator("");
      } else {
        // Para nivel bajo, podemos preservar algunos metadatos importantes
        try {
          // Intentar copiar metadatos del PDF original
          const originalDoc = await PDFDocument.load(await file.arrayBuffer());
          newPdfDoc.setTitle(originalDoc.getTitle() || "");
          newPdfDoc.setAuthor(originalDoc.getAuthor() || "");
          newPdfDoc.setSubject(originalDoc.getSubject() || "");
          newPdfDoc.setCreator("PDF Compressor - Nivel Bajo");
        } catch (e) {
          console.log("No se pudieron copiar los metadatos originales");
        }
      }
      
      // Procesar cada página
      const totalPages = pdfDoc.numPages;
      
      for (let i = 0; i < totalPages; i++) {
        // Actualizar progreso
        const pageProgress = 10 + Math.floor((i / totalPages) * 75);
        setProgress(pageProgress);
        
        // Obtener la página
        const pdfPage = await pdfDoc.getPage(i + 1);
        
        // Obtener dimensiones originales
        const viewport = pdfPage.getViewport({ scale: 1.0 });
        const width = viewport.width;
        const height = viewport.height;
        
        // Crear un canvas con configuración de alta calidad
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        if (ctx) {
          // Aplicar configuración para mejorar la calidad visual
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
        
        // Renderizar la página en el canvas con factor de escala adecuado
        await renderPageToCanvas(pdfPage, canvas, scaleFactor);
        
        // Aplicar compresión JPEG con calidad adecuada según el nivel
        const jpegDataUrl = canvas.toDataURL('image/jpeg', imageQuality);
        
        // Extraer la base64
        const base64 = jpegDataUrl.split(',')[1];
        
        // Convertir base64 a Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        // Insertar la imagen JPEG en el nuevo PDF
        const jpgImage = await newPdfDoc.embedJpg(bytes);
        
        // Agregar una nueva página con las dimensiones originales ajustadas
        const pageWidth = level === 'low' ? width : width * colorReduction;
        const pageHeight = level === 'low' ? height : height * colorReduction;
        const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
        
        // Dibujar la imagen en la página
        newPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight
        });
      }
      
      // Indicar progreso antes de guardar
      setProgress(85);
      
      // Ajustar opciones de guardado según el nivel
      const saveOptions = {
        useObjectStreams: level !== 'low', // Para nivel bajo, no usar object streams para mejor calidad
        addDefaultPage: false,
        objectsPerTick: level === 'low' ? 50 : 100 // Menos objetos por tick para nivel bajo = mejor calidad
      };
      
      // Guardar el documento comprimido con opciones óptimas
      const compressedBytes = await newPdfDoc.save(saveOptions);
      
      // Progreso casi completado después de guardar
      setProgress(95);
      
      // Crear un nuevo archivo
      return new File(
        [compressedBytes],
        `comprimido_${file.name}`,
        { type: 'application/pdf' }
      );
    } catch (error) {
      console.error('Error al comprimir PDF con canvas:', error);
      // Asegurar que el progreso se actualiza incluso en caso de error
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
      setProgress(10);
      
      const compressedFile = await compressPDFWithCanvas(file, compressionLevel);
      
      // Asegurar que progreso llega a 100 siempre
      setProgress(100);
      
      if (compressedFile) {
        const compressionResult = calculateCompression(fileSize, compressedFile.size);
        
        // Para nivel bajo, aceptamos el resultado incluso si el tamaño no se reduce significativamente
        // o incluso si aumenta ligeramente, para evitar errores de usuario
        if (compressionLevel === 'low' || compressionResult.savedPercentage > 0) {
          setCompressedFile(compressedFile);
          setCompressionInfo(compressionResult);
          
          // Mensaje personalizado según resultado
          if (compressionResult.savedPercentage <= 0) {
            toast.info('PDF procesado sin reducción de tamaño significativa.');
          } else {
            toast.success(`PDF comprimido con éxito. Ahorro: ${compressionResult.savedPercentage.toFixed(1)}%`);
          }
        } else {
          setCompressionError('No se pudo comprimir significativamente el PDF. Es posible que ya esté optimizado.');
          toast.error('No se pudo comprimir significativamente el PDF.');
        }
      } else {
        setCompressionError('Error al comprimir el PDF. Intenta con otro archivo o nivel de compresión.');
        toast.error('Error al comprimir el PDF.');
      }
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      setCompressionError('Error al procesar el PDF. Intenta con otro archivo o nivel de compresión.');
      toast.error('Error al comprimir el PDF.');
    } finally {
      // Asegurar que se completa el progreso incluso en caso de error
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
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
