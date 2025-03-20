
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ConvertResult {
  success: boolean;
  files: File[];
  message: string;
}

export const useSimpleConvertPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<File[]>([]);

  /**
   * Convertir un PDF a formato DOCX (Word) con un método simplificado
   */
  const convertPDF = async (file: File | null): Promise<ConvertResult> => {
    if (!file) {
      toast.error('Por favor selecciona un archivo PDF');
      return { success: false, files: [], message: 'No se seleccionó ningún archivo' };
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setConvertedFiles([]);
      console.log('Iniciando conversión simplificada de PDF a DOCX...', file.name);

      // Leer el archivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      setProgress(20);
      
      // Cargar el PDF con pdf.js
      const loadingTask = pdfjsLib.getDocument({
        data: typedarray,
        disableFontFace: false,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/',
        cMapPacked: true,
        useSystemFonts: true, // Permitir fuentes del sistema
      });
      
      const pdf = await loadingTask.promise;
      console.log(`PDF cargado: ${pdf.numPages} páginas`);
      setProgress(30);
      
      let fullText = "";
      
      // Extraer texto de cada página
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setProgress(30 + Math.floor((pageNumber / pdf.numPages) * 40));
        console.log(`Procesando página ${pageNumber} de ${pdf.numPages}`);
        
        try {
          const page = await pdf.getPage(pageNumber);
          const textContent = await page.getTextContent();
          
          // Extraer texto de la página
          let pageText = '';
          if (textContent.items.length === 0) {
            pageText = `[Página ${pageNumber}: Sin texto extraíble]\n\n`;
          } else {
            textContent.items.forEach(function(item: any) {
              if ('str' in item) {
                pageText += item.str + " ";
              }
            });
            pageText += "\n\n"; // Separador de página
          }
          
          fullText += pageText;
        } catch (error) {
          console.error(`Error al procesar página ${pageNumber}:`, error);
          fullText += `[Error en página ${pageNumber}]\n\n`;
        }
      }
      
      setProgress(70);
      console.log('Texto extraído de todas las páginas. Longitud:', fullText.length);
      
      if (fullText.trim().length < 10) {
        throw new Error('No se pudo extraer texto del PDF');
      }
      
      // Crear un documento Word simple
      console.log('Creando documento Word simple...');
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Documento convertido: ${file.name}`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: new Date().toLocaleDateString(),
                  italics: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  break: 1,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(fullText),
              ],
            }),
          ],
        }],
      });
      
      setProgress(85);
      
      // Generar blob del documento
      const blob = await Packer.toBlob(doc);
      
      console.log('Documento Word generado. Tamaño:', (blob.size / 1024).toFixed(2), 'KB');
      setProgress(95);
      
      // Crear archivo Word
      const docxFile = new File(
        [blob],
        `${file.name.replace('.pdf', '')}_simple.docx`,
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );
      
      setConvertedFiles([docxFile]);
      setProgress(100);
      
      console.log('Conversión simplificada completada con éxito');
      
      return {
        success: true,
        files: [docxFile],
        message: 'PDF convertido a DOCX correctamente (método simple)'
      };
    } catch (error) {
      console.error('Error al convertir PDF (método simple):', error);
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
    
    // Crear enlace para descargar el archivo
    const url = URL.createObjectURL(convertedFiles[0]);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFiles[0].name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Documento Word descargado correctamente');
  };

  return {
    convertPDF,
    isProcessing,
    progress,
    convertedFiles,
    downloadConvertedFiles
  };
};
