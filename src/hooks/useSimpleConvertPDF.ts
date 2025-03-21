
import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from 'sonner';
import { extractTextFromPDF } from '@/utils/pdf/pdfTextExtractor';
import { saveAs } from 'file-saver';

// Configurar el worker de PDF.js si no está configurado globalmente
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export const useSimpleConvertPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');

  const extractTextFromPDFWithOCR = async (file: File): Promise<{ success: boolean; text: string; message?: string }> => {
    try {
      setIsProcessing(true);
      setProgress(10);
      setExtractedText('');
      console.log('Iniciando extracción de texto con OCR:', file.name, 'tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // Leer el archivo PDF
      const fileReader = new FileReader();
      
      const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        fileReader.onerror = (error) => {
          console.error('Error leyendo archivo:', error);
          reject(new Error('No se pudo leer el archivo PDF'));
        };
        fileReader.readAsArrayBuffer(file);
      });
      
      const fileData = await fileDataPromise;
      setProgress(30);
      
      // Cargar el PDF y extraer texto
      const typedArray = new Uint8Array(fileData);
      const extractionResult = await extractTextFromPDF(
        typedArray,
        (newProgress) => setProgress(Math.min(30 + Math.floor(newProgress * 0.6), 90))
      );
      
      // Unir el texto de todas las páginas
      let fullText = '';
      for (const page of extractionResult.pageContents) {
        fullText += page.text + '\n\n--- Página ' + page.pageNum + ' ---\n\n';
      }
      
      console.log(`Texto extraído: ${fullText.length} caracteres de ${extractionResult.numPages} páginas`);
      setProgress(95);
      
      // Verificar si se extrajo algún texto
      if (fullText.trim().length === 0) {
        throw new Error('No se pudo extraer texto del PDF. El documento parece contener solo imágenes o necesita un procesamiento OCR más avanzado.');
      }
      
      setExtractedText(fullText);
      setProgress(100);
      console.log('Extracción de texto completada con éxito');
      
      return {
        success: true,
        text: fullText
      };
    } catch (error) {
      console.error('Error en la extracción de texto:', error);
      return {
        success: false,
        text: '',
        message: error instanceof Error ? error.message : 'Error desconocido durante la extracción'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!extractedText) {
      toast.error('No hay texto para copiar');
      return;
    }

    try {
      navigator.clipboard.writeText(extractedText);
      toast.success('Texto copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      toast.error('Error al copiar texto: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const downloadAsTextFile = () => {
    if (!extractedText) {
      toast.error('No hay texto para descargar');
      return;
    }

    try {
      const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, 'texto_extraido.txt');
      toast.success('Archivo de texto descargado correctamente');
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      toast.error('Error al descargar el texto: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  return {
    extractTextFromPDFWithOCR,
    isProcessing,
    progress,
    extractedText,
    copyToClipboard,
    downloadAsTextFile
  };
};
