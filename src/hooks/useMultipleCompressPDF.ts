import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { COMPRESSION_FACTORS, MIN_SIZE_REDUCTION } from '@/utils/pdf/compression-constants';
import { calculateCompression } from '@/utils/pdf/compression-utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Configurar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Tipos de nivel de compresión
type CompressionLevel = 'low' | 'medium' | 'high';

interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

export const useMultipleCompressPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [compressedFiles, setCompressedFiles] = useState<File[]>([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Verificar compatibilidad con WebP
  const isWebPSupported = (): boolean => {
    try {
      const canvas = document.createElement('canvas');
      if (canvas && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
    } catch (e) {
      console.error('Error checking WebP support:', e);
    }
    return false;
  };

  // Función mejorada para renderizar página PDF a canvas con calidad óptima
  async function renderPageToCanvas(
    pdfPage: pdfjsLib.PDFPageProxy, 
    canvas: HTMLCanvasElement, 
    scaleFactor: number,
    preserveTextQuality: boolean
  ): Promise<void> {
    try {
      // Usamos escala basada en la configuración
      const viewport = pdfPage.getViewport({ scale: 1.0 });
      
      // Calculamos dimensiones del canvas optimizadas
      const canvasWidth = Math.floor(viewport.width * scaleFactor);
      const canvasHeight = Math.floor(viewport.height * scaleFactor);
      
      // Configuramos canvas
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto 2D del canvas');
      }
      
      // Fondo blanco para eliminar transparencia y mejorar compresión
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Configuramos calidad de renderizado
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Ajustar viewport con escala
      const adjustedViewport = pdfPage.getViewport({ scale: scaleFactor });
      
      // Opciones de renderizado
      const renderContext = {
        canvasContext: ctx,
        viewport: adjustedViewport,
        intent: preserveTextQuality ? 'print' : 'display'
      };
      
      // Renderizamos la página
      await pdfPage.render(renderContext).promise;
    } catch (error) {
      console.error('Error al renderizar página:', error);
      throw error;
    }
  }

  // Método de compresión optimizado
  async function compressPDFWithCanvas(
    file: File,
    level: CompressionLevel,
    currentIndex: number,
    totalCount: number
  ): Promise<File | null> {
    try {
      // Obtener configuración según nivel
      const { 
        imageQuality, 
        scaleFactor, 
        colorReduction, 
        useHighQualityFormat,
        preserveTextQuality,
        useJpegFormat,
        jpegQuality
      } = COMPRESSION_FACTORS[level];
      
      // Cargar el documento con PDF.js
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileArrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      
      // Crear un nuevo documento PDF
      const newPdfDoc = await PDFDocument.create();
      
      // Configurar metadatos básicos
      newPdfDoc.setCreator("PDF Compressor");
      
      // Procesar cada página
      const totalPages = pdfDoc.numPages;
      
      for (let i = 0; i < totalPages; i++) {
        // Actualizar progreso
        const pageProgress = Math.floor((i / totalPages) * 90);
        const fileProgress = (currentIndex / totalCount) * 100 + (pageProgress / totalCount);
        setProgress(Math.min(99, Math.floor(fileProgress)));
        
        // Obtener la página
        const pdfPage = await pdfDoc.getPage(i + 1);
        
        // Obtener dimensiones originales
        const viewport = pdfPage.getViewport({ scale: 1.0 });
        const width = viewport.width;
        const height = viewport.height;
        
        // Crear un canvas
        const canvas = document.createElement('canvas');
        
        // Renderizar la página
        await renderPageToCanvas(pdfPage, canvas, scaleFactor, preserveTextQuality);
        
        // Usar siempre JPEG para mejor compresión
        const imageDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        console.info(`Usando formato JPEG para nivel ${level} con calidad ${jpegQuality}`);
        
        // Extraer la base64
        const base64 = imageDataUrl.split(',')[1];
        
        // Convertir base64 a Uint8Array
        const binaryString = atob(base64);
        const imageBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          imageBytes[j] = binaryString.charCodeAt(j);
        }
        
        // Insertar la imagen
        const pdfImage = await newPdfDoc.embedJpg(imageBytes);
        
        // Aplicar reducción de dimensiones según nivel
        const pageWidth = width * colorReduction;
        const pageHeight = height * colorReduction;
        
        // Agregar página
        const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
        
        // Dibujar la imagen
        newPage.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight
        });
      }
      
      // Guardar con compresión
      const compressedBytes = await newPdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false
      });
      
      // Crear archivo resultado
      const result = new File(
        [compressedBytes],
        `comprimido_${file.name}`,
        { type: 'application/pdf' }
      );
      
      // Verificar si realmente se redujo el tamaño
      if (result.size >= file.size) {
        console.warn("El archivo comprimido no es más pequeño que el original");
        // Si usando compresión baja o media y el archivo creció mucho, intentar otra vez con parámetros más agresivos
        if ((level === 'low' || level === 'medium') && (result.size > file.size * 1.5)) {
          console.info("Intentando con parámetros más agresivos...");
          const moreAggressiveLevel = level === 'low' ? 'medium' : 'high';
          return await compressPDFWithCanvas(file, moreAggressiveLevel, currentIndex, totalCount);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error al comprimir PDF con canvas:', error);
      setProgress(100);
      return null;
    }
  }

  // Función para calcular el porcentaje de compresión correctamente
  const calculateCompression = (originalSize: number, compressedSize: number) => {
    const savedPercentage = Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10;
    return {
      originalSize,
      compressedSize,
      savedPercentage
    };
  };

  // Función principal para comprimir múltiples PDFs
  const compressMultiplePDFs = async (files: File[], compressionLevel: CompressionLevel) => {
    if (!files.length) {
      toast.error('Por favor, selecciona al menos un archivo PDF');
      return;
    }

    try {
      setIsProcessing(true);
      setCompressionError(null);
      setCompressedFiles([]);
      setCompressionInfo(null);
      setProgress(0);
      setTotalFiles(files.length);
      
      const compressedFilesArray: File[] = [];
      
      // Procesar cada archivo secuencialmente
      for (let i = 0; i < files.length; i++) {
        setCurrentProcessingIndex(i);
        const file = files[i];
        
        // Obtener tamaño original
        const fileSize = file.size;
        
        // Comprimir usando el método basado en canvas
        const compressedFile = await compressPDFWithCanvas(file, compressionLevel, i, files.length);
        
        if (compressedFile) {
          const compressionResult = calculateCompression(fileSize, compressedFile.size);
          
          // Solo aceptar archivos que realmente se hayan comprimido
          if (compressionResult.savedPercentage > 0) {
            compressedFilesArray.push(compressedFile);
            
            // Si es el último archivo o hay un solo archivo, mostrar la info de compresión
            if (i === files.length - 1 || files.length === 1) {
              setCompressionInfo(compressionResult);
              
              if (files.length === 1) {
                toast.success(`PDF comprimido con éxito. Ahorro: ${compressionResult.savedPercentage.toFixed(1)}%`);
              } else {
                toast.success(`Todos los PDFs comprimidos con éxito.`);
              }
            }
          } else {
            if (files.length === 1) {
              setCompressionError('No se pudo reducir el tamaño del PDF. Intenta con un nivel más alto de compresión.');
              toast.error('No se pudo reducir el tamaño del PDF.');
            } else {
              toast.warning(`El archivo ${file.name} no pudo ser comprimido.`);
            }
          }
        } else {
          toast.error(`Error al comprimir el archivo ${file.name}`);
        }
      }
      
      // Completar el proceso
      setCompressedFiles(compressedFilesArray);
      
      if (compressedFilesArray.length === 0) {
        setCompressionError('No se pudo comprimir ningún archivo PDF. Intenta con otro nivel de compresión.');
        toast.error('Error al comprimir los archivos PDF.');
      } else if (compressedFilesArray.length < files.length) {
        toast.warning(`Se procesaron ${compressedFilesArray.length} de ${files.length} archivos.`);
      } else {
        toast.success(`Se procesaron ${files.length} archivos correctamente.`);
      }
      
    } catch (error) {
      console.error('Error al comprimir PDFs:', error);
      setCompressionError('Error al procesar los PDFs. Intenta con otros archivos o nivel de compresión.');
      toast.error('Error al comprimir los PDFs.');
    } finally {
      // Asegurar que se completa el progreso
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  // Función para descargar un archivo comprimido específico
  const downloadCompressedFile = (index: number) => {
    if (index < 0 || index >= compressedFiles.length) return;
    
    const file = compressedFiles[index];
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF descargado con éxito');
  };

  // Función para descargar todos los archivos comprimidos como ZIP
  const downloadAllAsZip = async () => {
    if (compressedFiles.length === 0) {
      toast.error('No hay archivos comprimidos para descargar');
      return;
    }
    
    try {
      const zip = new JSZip();
      
      // Añadir todos los archivos comprimidos al ZIP
      for (const file of compressedFiles) {
        const fileData = await file.arrayBuffer();
        zip.file(file.name, fileData);
      }
      
      // Generar el archivo ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6 // Nivel medio de compresión para el ZIP
        }
      });
      
      // Descargar el archivo ZIP
      saveAs(zipBlob, 'pdfs_comprimidos.zip');
      
      toast.success('Archivos descargados como ZIP');
    } catch (error) {
      console.error('Error al crear ZIP:', error);
      toast.error('Error al crear el archivo ZIP');
    }
  };

  return {
    compressMultiplePDFs,
    isProcessing,
    progress,
    compressionInfo,
    compressionError,
    compressedFiles,
    downloadCompressedFile,
    downloadAllAsZip,
    currentProcessingIndex,
    totalFiles
  };
};
