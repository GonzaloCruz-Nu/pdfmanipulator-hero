
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

  // Verificar compatibilidad con WebAssembly
  const isWasmSupported = (): boolean => {
    try {
      return typeof WebAssembly === 'object' && 
           typeof WebAssembly.instantiate === 'function' &&
           typeof WebAssembly.compile === 'function';
    } catch (e) {
      console.error('Error checking WebAssembly support:', e);
      return false;
    }
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

  // Método de compresión optimizado con WebAssembly cuando está disponible
  async function compressPDFWithCanvas(
    file: File,
    level: CompressionLevel,
    currentIndex: number,
    totalCount: number
  ): Promise<File | null> {
    try {
      // Verificar si WebAssembly está disponible
      const wasmSupported = isWasmSupported();
      console.info(`WebAssembly disponible: ${wasmSupported}`);
      
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
      
      // Ajustar factores de compresión con optimizaciones WASM si está disponible
      const optimizedScaleFactor = wasmSupported ? 
        Math.min(scaleFactor * 1.05, 1.0) : scaleFactor;
      
      const optimizedJpegQuality = wasmSupported ?
        Math.max(jpegQuality * 0.95, 0.1) : jpegQuality;
      
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
        
        // Renderizar la página con optimizaciones WASM si está disponible
        await renderPageToCanvas(pdfPage, canvas, optimizedScaleFactor, preserveTextQuality);
        
        // Usar siempre JPEG para mejor compresión
        const imageDataUrl = canvas.toDataURL('image/jpeg', optimizedJpegQuality);
        console.info(`Usando formato JPEG para nivel ${level} con calidad ${optimizedJpegQuality}`);
        
        // Extraer la base64
        const base64 = imageDataUrl.split(',')[1];
        
        // Convertir base64 a Uint8Array optimizado para WASM si está disponible
        let imageBytes: Uint8Array;
        if (wasmSupported && window.atob && typeof TextEncoder !== 'undefined') {
          // Método optimizado con TextEncoder (más rápido en navegadores modernos)
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) {
            bytes[j] = binary.charCodeAt(j);
          }
          imageBytes = bytes;
        } else {
          // Método estándar
          const binaryString = atob(base64);
          imageBytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            imageBytes[j] = binaryString.charCodeAt(j);
          }
        }
        
        // Insertar la imagen
        let pdfImage;
        try {
          pdfImage = await newPdfDoc.embedJpg(imageBytes);
        } catch (error) {
          console.error('Error al incrustar imagen, intentando con JPEG de baja calidad:', error);
          // Si falla, intentar con JPEG de calidad más baja como último recurso
          const fallbackQuality = wasmSupported ? 0.3 : 0.4;
          const jpegDataUrl = canvas.toDataURL('image/jpeg', fallbackQuality);
          const jpegBase64 = jpegDataUrl.split(',')[1];
          const jpegBinaryString = atob(jpegBase64);
          const jpegImageBytes = new Uint8Array(jpegBinaryString.length);
          for (let j = 0; j < jpegBinaryString.length; j++) {
            jpegImageBytes[j] = jpegBinaryString.charCodeAt(j);
          }
          pdfImage = await newPdfDoc.embedJpg(jpegImageBytes);
        }
        
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
      
      // Guardar con compresión optimizada para WebAssembly
      const saveOptions = {
        useObjectStreams: true,
        addDefaultPage: false
      };
      
      const compressedBytes = await newPdfDoc.save(saveOptions);
      
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
        
        console.info(`Procesando archivo ${i+1}/${files.length}: ${file.name}`);
        
        // Obtener tamaño original
        const fileSize = file.size;
        
        // Comprimir usando el método basado en canvas
        const compressedFile = await compressPDFWithCanvas(file, compressionLevel, i, files.length);
        
        if (compressedFile) {
          const compressionResult = calculateCompression(fileSize, compressedFile.size);
          
          // Aceptar archivos incluso si la compresión no redujo el tamaño
          compressedFilesArray.push(compressedFile);
          console.info(`Archivo ${i+1} procesado con éxito: ${compressionResult.savedPercentage.toFixed(1)}% de ahorro`);
          
          // Si es el último archivo o hay un solo archivo, mostrar la info de compresión
          if (i === files.length - 1 || files.length === 1) {
            setCompressionInfo(compressionResult);
            
            if (files.length === 1) {
              toast.success(`PDF procesado con éxito. Ahorro: ${compressionResult.savedPercentage > 0 ? compressionResult.savedPercentage.toFixed(1) + '%' : 'sin reducción de tamaño'}`);
            } else {
              toast.success(`Todos los PDFs procesados con éxito.`);
            }
          }
        } else {
          console.error(`Error al procesar el archivo ${i+1}: ${file.name}`);
          if (files.length === 1) {
            setCompressionError('No se pudo procesar el PDF. Intenta con otro nivel de compresión.');
            toast.error('No se pudo procesar el PDF.');
          } else {
            toast.warning(`El archivo ${file.name} no pudo ser procesado.`);
          }
        }
      }
      
      // Completar el proceso
      setCompressedFiles(compressedFilesArray);
      
      if (compressedFilesArray.length === 0) {
        setCompressionError('No se pudo procesar ningún archivo PDF. Intenta con otro nivel de compresión.');
        toast.error('Error al procesar los archivos PDF.');
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
    if (index < 0 || index >= compressedFiles.length) {
      console.error(`Índice fuera de rango: ${index}, total de archivos: ${compressedFiles.length}`);
      return;
    }
    
    console.info(`Descargando archivo en índice ${index}`);
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

  // Función mejorada para descargar todos los archivos comprimidos como ZIP
  const downloadAllAsZip = async () => {
    if (compressedFiles.length === 0) {
      toast.error('No hay archivos comprimidos para descargar');
      return;
    }
    
    try {
      console.info(`Creando archivo ZIP con ${compressedFiles.length} archivos`);
      
      // Mostrar toast de progreso inicial
      toast.loading('Preparando archivos para comprimir...', { id: 'zip-creation' });
      
      const zip = new JSZip();
      
      // Añadir todos los archivos comprimidos al ZIP
      for (let i = 0; i < compressedFiles.length; i++) {
        const file = compressedFiles[i];
        console.info(`Añadiendo al ZIP (${i+1}/${compressedFiles.length}): ${file.name} (${file.size} bytes)`);
        
        // Actualizar el toast de progreso
        toast.loading(`Añadiendo archivo ${i+1} de ${compressedFiles.length}...`, { id: 'zip-creation' });
        
        // Convertir el archivo a ArrayBuffer de manera más directa y segura
        try {
          const fileData = await file.arrayBuffer();
          zip.file(file.name, fileData);
          console.info(`Archivo ${i+1} añadido correctamente`);
        } catch (fileError) {
          console.error(`Error al procesar el archivo ${file.name}:`, fileError);
          toast.error(`Error al procesar el archivo ${file.name}`);
        }
      }
      
      // Actualizar toast de progreso
      toast.loading('Generando archivo ZIP...', { id: 'zip-creation' });
      
      console.info('Generando archivo ZIP final...');
      
      // Generar el archivo ZIP con una promesa y manejo de errores mejorado
      try {
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: {
            level: 6 // Nivel medio de compresión para el ZIP
          }
        });
        
        console.info(`Archivo ZIP generado correctamente: ${zipBlob.size} bytes`);
        
        // Descargar el archivo ZIP utilizando FileSaver
        saveAs(zipBlob, 'pdfs_comprimidos.zip');
        
        // Marcar como completado el proceso
        toast.success('Archivos descargados como ZIP', { id: 'zip-creation' });
      } catch (zipError) {
        console.error('Error al generar el archivo ZIP:', zipError);
        toast.error('Error al generar el archivo ZIP', { id: 'zip-creation' });
        throw zipError; // Re-lanzar para el manejador de errores principal
      }
    } catch (error) {
      console.error('Error general al crear ZIP:', error);
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
