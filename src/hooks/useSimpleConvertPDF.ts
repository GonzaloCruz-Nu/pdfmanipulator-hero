
import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph } from 'docx';

export const useSimpleConvertPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<File[]>([]);

  const convertPDF = async (file: File): Promise<{ success: boolean; files: File[]; message?: string }> => {
    try {
      setIsProcessing(true);
      setProgress(10);
      setConvertedFiles([]);

      // Leer el archivo PDF
      const fileReader = new FileReader();
      
      const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        fileReader.onerror = () => reject(new Error('No se pudo leer el archivo PDF'));
        fileReader.readAsArrayBuffer(file);
      });
      
      const fileData = await fileDataPromise;
      setProgress(30);
      
      // Cargar el PDF con pdf.js
      const typedArray = new Uint8Array(fileData);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      setProgress(40);
      
      console.log(`PDF cargado: ${pdf.numPages} páginas`);
      
      // Extraer texto de todas las páginas
      let fullText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        // Actualizar progreso basado en el número de páginas procesadas
        setProgress(40 + Math.floor((pageNum / pdf.numPages) * 30));
        
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Simple text extraction - just concatenate all text items
          let pageText = '';
          textContent.items.forEach((item: any) => {
            if ('str' in item) {
              pageText += item.str + ' ';
            }
          });
          
          // Add page separator
          fullText += pageText + '\n\n';
          console.log(`Página ${pageNum}: ${pageText.length} caracteres extraídos`);
        } catch (pageError) {
          console.error(`Error al procesar la página ${pageNum}:`, pageError);
          fullText += `[Error en la página ${pageNum}]\n\n`;
        }
      }
      
      setProgress(75);
      console.log(`Texto total extraído: ${fullText.length} caracteres`);
      
      // Crear un documento Word simple
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph(fullText)
          ]
        }]
      });
      
      setProgress(85);
      
      // Generar el blob y crear el archivo
      const blob = await Packer.toBlob(doc);
      const resultFile = new File(
        [blob], 
        file.name.replace(/\.pdf$/i, '') + '.docx', 
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );
      
      setProgress(100);
      setConvertedFiles([resultFile]);
      console.log('Conversión simple completada con éxito');
      
      return {
        success: true,
        files: [resultFile]
      };
    } catch (error) {
      console.error('Error en la conversión simple:', error);
      return {
        success: false,
        files: [],
        message: error instanceof Error ? error.message : 'Error desconocido durante la conversión'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadConvertedFiles = () => {
    if (convertedFiles.length > 0) {
      const file = convertedFiles[0];
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return {
    convertPDF,
    isProcessing,
    progress,
    convertedFiles,
    downloadConvertedFiles
  };
};
