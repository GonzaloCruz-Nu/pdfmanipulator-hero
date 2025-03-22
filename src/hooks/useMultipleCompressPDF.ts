
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { COMPRESSION_FACTORS, MIN_SIZE_REDUCTION } from '@/utils/pdf/compression-constants';
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
  const isWebPSupported = () => {
    const canvas = document.createElement('canvas');
    if (canvas && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  };

  // Función mejorada para renderizar página PDF a canvas con calidad óptima
  async function renderPageToCanvas(
    pdfPage: pdfjsLib.PDFPageProxy, 
    canvas: HTMLCanvasElement, 
    scaleFactor: number,
    useHighQualityFormat: boolean,
    preserveTextQuality: boolean
  ): Promise<void> {
    // Usamos alta resolución para capturar todos los detalles del texto
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Para texto, usamos escala mínima de 1.5 para asegurar legibilidad
    let textOptimizedScaleFactor = preserveTextQuality ? Math.max(scaleFactor, 0.95) : scaleFactor;
    
    // Para formatos de alta calidad, usamos DPI más alto
    const dpiMultiplier = useHighQualityFormat ? 1.5 : 1;
    
    // Calculamos dimensiones para asegurar legibilidad del texto
    const viewport = pdfPage.getViewport({ scale: 1.0 });
    
    // Calculamos dimensiones del canvas optimizadas para texto
    const canvasWidth = Math.floor(viewport.width * textOptimizedScaleFactor * pixelRatio * dpiMultiplier);
    const canvasHeight = Math.floor(viewport.height * textOptimizedScaleFactor * pixelRatio * dpiMultiplier);
    
    // Configuramos canvas para renderizado de alta calidad
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${viewport.width * textOptimizedScaleFactor}px`;
    canvas.style.height = `${viewport.height * textOptimizedScaleFactor}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }
    
    // Aplicamos configuración avanzada para renderizado de texto
    ctx.scale(pixelRatio * dpiMultiplier, pixelRatio * dpiMultiplier);
    
    // Configuración optimizada para texto
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Configuración especial para mejorar legibilidad de texto
    if (preserveTextQuality) {
      // Fondo blanco para mejorar contraste de texto
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Aplicamos antialiasing optimizado para texto
      try {
        // @ts-ignore - Esta propiedad puede no estar disponible en todos los navegadores
        ctx.textRendering = 'optimizeLegibility';
      } catch (e) {
        // Ignorar si no está soportado
      }
    } else {
      // Para niveles sin prioridad en texto, usamos fondo blanco simple
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Ajustar viewport con escala optimizada para texto
    const adjustedViewport = pdfPage.getViewport({ 
      scale: textOptimizedScaleFactor
    });
    
    // Opciones de renderizado optimizadas para texto
    const renderContext = {
      canvasContext: ctx,
      viewport: adjustedViewport,
      intent: preserveTextQuality ? 'print' : 'display',
      renderInteractiveForms: true,
      canvasFactory: undefined,
      background: undefined,
      transform: undefined,
      annotationStorage: undefined,
      annotationMode: undefined
    };
    
    // Renderizamos la página con configuración optimizada
    await pdfPage.render(renderContext).promise;
  }

  // Método de compresión con soporte WebP y optimizaciones para legibilidad de texto
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
        jpegQuality,
        useWebP,
        webpQuality 
      } = COMPRESSION_FACTORS[level];
      
      // Verificar si WebP está soportado
      const webpSupported = isWebPSupported() && useWebP;
      
      // Cargar el documento con PDF.js
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileArrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      
      // Crear un nuevo documento PDF
      const newPdfDoc = await PDFDocument.create();
      
      // Preservar metadatos para nivel bajo y medio
      if (level !== 'high') {
        try {
          // Intentar copiar metadatos del PDF original
          const originalDoc = await PDFDocument.load(await file.arrayBuffer());
          newPdfDoc.setTitle(originalDoc.getTitle() || "");
          newPdfDoc.setAuthor(originalDoc.getAuthor() || "");
          newPdfDoc.setSubject(originalDoc.getSubject() || "");
          newPdfDoc.setCreator("PDF Compressor - Nivel " + (level === 'low' ? 'Bajo' : 'Medio'));
        } catch (e) {
          console.log("No se pudieron copiar los metadatos originales");
        }
      } else {
        // Para nivel alto, eliminamos metadatos para maximizar compresión
        newPdfDoc.setTitle("");
        newPdfDoc.setAuthor("");
        newPdfDoc.setSubject("");
        newPdfDoc.setKeywords([]);
        newPdfDoc.setProducer("");
        newPdfDoc.setCreator("");
      }
      
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
        
        // Crear un canvas con configuración de alta calidad
        const canvas = document.createElement('canvas');
        
        // Renderizar la página con configuración optimizada para texto
        await renderPageToCanvas(pdfPage, canvas, scaleFactor, useHighQualityFormat, preserveTextQuality);
        
        // Elegir formato según configuración y soporte
        let dataUrl: string;
        const isLowOrMedium = level === 'low' || level === 'medium';
        
        if (webpSupported) {
          // Usar WebP para mejor relación calidad/compresión cuando esté disponible
          dataUrl = canvas.toDataURL('image/webp', webpQuality);
          console.log(`Usando formato WebP para nivel ${level} con calidad ${webpQuality}`);
        } else if (useHighQualityFormat && isLowOrMedium) {
          // En niveles bajo/medio usamos PNG para máxima calidad si WebP no está disponible
          dataUrl = canvas.toDataURL('image/png');
          console.log(`Usando formato PNG para nivel ${level}`);
        } else {
          // Para nivel alto o cuando las opciones anteriores no aplican, usar JPEG
          dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
          console.log(`Usando formato JPEG para nivel ${level} con calidad ${jpegQuality}`);
        }
        
        // Extraer la base64
        const base64 = dataUrl.split(',')[1];
        
        // Convertir base64 a Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        // Insertar la imagen en el nuevo PDF según el formato usado
        let image;
        if (dataUrl.includes('image/webp') || dataUrl.includes('image/png')) {
          image = await newPdfDoc.embedPng(bytes);
        } else {
          image = await newPdfDoc.embedJpg(bytes);
        }
        
        // Agregar una nueva página con las dimensiones optimizadas para legibilidad
        // Para nivel bajo y medio, mantenemos dimensiones casi exactas
        const pageWidth = isLowOrMedium ? width : width * colorReduction;
        const pageHeight = isLowOrMedium ? height : height * colorReduction;
        const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
        
        // Dibujar la imagen en la página
        newPage.drawImage(image, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight
        });
      }
      
      // Ajustar opciones de guardado según el nivel
      const saveOptions = {
        useObjectStreams: level === 'high', // Solo para nivel alto usar object streams
        addDefaultPage: false,
        objectsPerTick: preserveTextQuality ? 50 : 100 // Menos objetos por tick para niveles que preservan texto
      };
      
      // Guardar el documento comprimido con opciones óptimas
      const compressedBytes = await newPdfDoc.save(saveOptions);
      
      // Progreso casi completado después de guardar
      setProgress(100);
      
      // Crear un nuevo archivo con nombre descriptivo
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

  // Función auxiliar para ajustar la compresión de nivel bajo si aumenta demasiado el tamaño
  async function adjustCompressionForLowLevel(file: File, originalPdfDoc: PDFDocument): Promise<Uint8Array | null> {
    try {
      // Parámetros ajustados para nivel bajo cuando hay aumento de tamaño
      const adjustedOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        compress: true
      };
      
      // Intentar guardar con estos parámetros
      return await originalPdfDoc.save(adjustedOptions);
    } catch (error) {
      console.error('Error al ajustar compresión baja:', error);
      return null;
    }
  }

  // Función para calcular el porcentaje de compresión correctamente
  const calculateCompression = (originalSize: number, compressedSize: number) => {
    // El porcentaje reducido es (tamaño original - tamaño comprimido) / tamaño original * 100
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
          compressedFilesArray.push(compressedFile);
          
          // Si es el último archivo o hay un solo archivo, mostrar la info de compresión
          if (i === files.length - 1 || files.length === 1) {
            const compressionResult = calculateCompression(fileSize, compressedFile.size);
            setCompressionInfo(compressionResult);
            
            // Mensaje según resultado para el último archivo
            if (compressionResult.savedPercentage <= 0) {
              if (files.length === 1) {
                toast.info('PDF procesado sin reducción de tamaño significativa.');
              }
            } else {
              if (files.length === 1) {
                toast.success(`PDF comprimido con éxito. Ahorro: ${compressionResult.savedPercentage.toFixed(1)}%`);
              } else {
                toast.success(`Todos los PDFs comprimidos con éxito.`);
              }
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
      // Asegurar que se completa el progreso incluso en caso de error
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
