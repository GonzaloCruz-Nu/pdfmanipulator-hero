
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

  // Función auxiliar para renderizar página PDF a canvas utilizando formato de alta calidad para baja y media compresión
  async function renderPageToCanvas(
    pdfPage: pdfjsLib.PDFPageProxy, 
    canvas: HTMLCanvasElement, 
    scaleFactor: number,
    useHighQualityFormat: boolean
  ): Promise<void> {
    const viewport = pdfPage.getViewport({ scale: scaleFactor });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }
    
    // Configuración mejorada para calidad
    if (useHighQualityFormat) {
      // Para alta calidad (baja y media compresión)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    
    // Fondo blanco para eliminar transparencia 
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

  // Método de compresión basado en canvas con mejoras de calidad
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
        preserveTextQuality 
      } = COMPRESSION_FACTORS[level];
      
      // Cargar el documento con PDF.js
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileArrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      
      // Crear un nuevo documento PDF
      const newPdfDoc = await PDFDocument.create();
      
      // Preservar metadatos para nivel bajo y medio para mejor compatibilidad
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
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        
        // Renderizar la página en el canvas con factor de escala adecuado
        await renderPageToCanvas(pdfPage, canvas, scaleFactor, useHighQualityFormat);
        
        // Usar formato PNG para niveles bajo y medio (mejor calidad), JPEG para nivel alto (más compresión)
        let dataUrl: string;
        if (useHighQualityFormat) {
          // PNG para mejor calidad (niveles bajo y medio)
          dataUrl = canvas.toDataURL('image/png');
        } else {
          // JPEG para máxima compresión (nivel alto)
          dataUrl = canvas.toDataURL('image/jpeg', imageQuality);
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
        if (useHighQualityFormat) {
          image = await newPdfDoc.embedPng(bytes);
        } else {
          image = await newPdfDoc.embedJpg(bytes);
        }
        
        // Agregar una nueva página con las dimensiones originales ajustadas
        const pageWidth = level === 'low' ? width : width * colorReduction;
        const pageHeight = level === 'low' ? height : height * colorReduction;
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
        useObjectStreams: level !== 'low', // Para nivel bajo, no usar object streams para mejor calidad
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
