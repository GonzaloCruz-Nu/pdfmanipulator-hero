
import { useState } from 'react';
import { toast } from 'sonner';
import { extractTextFromPDF } from '@/utils/pdf/pdfTextExtractor';
import { createDocxFromPdfContent } from '@/utils/pdf/docxCreator';
import { createWordFile, downloadFile, verificarContenidoExtraible } from '@/utils/pdf/fileOperations';

interface ConvertResult {
  success: boolean;
  files: File[];
  message: string;
}

export const useConvertPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<File[]>([]);

  /**
   * Convertir un PDF a formato DOCX (Word) con extracción de texto mejorada
   */
  const convertPDF = async (file: File | null, format: string): Promise<ConvertResult> => {
    if (!file) {
      toast.error('Por favor selecciona un archivo PDF');
      return { success: false, files: [], message: 'No se seleccionó ningún archivo' };
    }

    // Verificar que solo soportamos DOCX como formato
    if (format !== 'docx') {
      toast.error('Solo se admite la conversión al formato DOCX');
      return { success: false, files: [], message: 'Formato no soportado' };
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setConvertedFiles([]);
      console.log('Iniciando conversión de PDF a DOCX...', file.name, 'tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // Cargar PDF como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);
      console.log('PDF cargado en memoria, iniciando procesamiento...');

      // Extraer texto del PDF usando la utilidad mejorada
      const { pageContents, totalTextExtracted, numPages, documentTitle } = await extractTextFromPDF(
        pdfData,
        (newProgress) => setProgress(Math.min(20 + Math.floor(newProgress * 0.5), 70)) // Ajuste de progreso
      );
      
      setProgress(70);
      console.log('Texto extraído de todas las páginas. Contenido total:', totalTextExtracted, 'caracteres');
      
      // Verificar contenido extraído con criterios flexibles
      const verificacion = verificarContenidoExtraible(file.size, totalTextExtracted);
      
      if (!verificacion.extraible) {
        console.warn('Advertencia de contenido:', verificacion.mensaje);
        // No fallar inmediatamente, pero mostrar una advertencia al usuario
        toast.warning(verificacion.mensaje || 'El documento puede contener principalmente imágenes');
      }
      
      // Permitir continuar incluso con poco texto, a menos que sea realmente vacío
      if (totalTextExtracted < 10) {
        console.error('No se extrajo texto del PDF');
        return { 
          success: false, 
          files: [], 
          message: 'No se pudo extraer texto del documento. Es posible que esté protegido, dañado o contenga solo imágenes.' 
        };
      }
      
      console.log('Generando documento DOCX con', pageContents.length, 'páginas y', totalTextExtracted, 'caracteres');
      setProgress(75);
      
      // Crear documento DOCX a partir del contenido extraído con título original si está disponible
      const docxBlob = await createDocxFromPdfContent(
        file.name,
        file.size,
        pageContents,
        numPages,
        documentTitle
      );
      
      setProgress(90);
      
      if (!docxBlob || docxBlob.size === 0) {
        throw new Error('El blob generado está vacío');
      }
      
      // Verificar el tamaño del archivo generado
      if (docxBlob.size < 20000 && totalTextExtracted > 1000) { 
        console.warn(`Advertencia: El tamaño del archivo DOCX (${docxBlob.size / 1024} KB) parece pequeño para ${totalTextExtracted} caracteres`);
      }
      
      console.log('Blob DOCX generado correctamente, tamaño:', (docxBlob.size / 1024).toFixed(2), 'KB');
      
      // Crear archivo Word
      const docxFile = createWordFile(docxBlob, file.name);
      
      if (docxFile.size === 0) {
        throw new Error('El archivo generado está vacío');
      }
      
      setConvertedFiles([docxFile]);
      
      setProgress(100);
      console.log('Conversión completada con éxito. Archivo creado:', docxFile.name, 'tamaño:', (docxFile.size / 1024).toFixed(2), 'KB');
      
      return {
        success: true,
        files: [docxFile],
        message: 'PDF convertido a DOCX correctamente'
      };
    } catch (error) {
      console.error('Error al convertir PDF:', error);
      toast.error('Error al convertir PDF');
      
      return {
        success: false,
        files: [],
        message: 'Error al convertir PDF: ' + (error instanceof Error ? error.message : 'Error desconocido')
      };
    } finally {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  /**
   * Descargar los archivos convertidos
   */
  const downloadConvertedFiles = () => {
    if (convertedFiles.length === 0) {
      toast.error('No hay archivos para descargar');
      return;
    }
    
    downloadFile(convertedFiles[0]);
  };

  return {
    convertPDF,
    isProcessing,
    progress,
    convertedFiles,
    downloadConvertedFiles
  };
};

