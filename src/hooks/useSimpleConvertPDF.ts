import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { toast } from 'sonner';

// Configurar el worker de PDF.js si no está configurado globalmente
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export const useSimpleConvertPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<File[]>([]);

  const convertPDF = async (file: File): Promise<{ success: boolean; files: File[]; message?: string }> => {
    try {
      setIsProcessing(true);
      setProgress(10);
      setConvertedFiles([]);
      console.log('Iniciando conversión simple de PDF a DOCX:', file.name, 'tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');

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
      
      // Cargar el PDF con pdf.js
      const typedArray = new Uint8Array(fileData);
      
      console.log('Iniciando carga del PDF con pdf.js');
      const loadingTask = pdfjsLib.getDocument({
        data: typedArray,
        disableFontFace: false,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/',
        cMapPacked: true,
        useSystemFonts: true,
      });
      
      const pdf = await loadingTask.promise;
      setProgress(40);
      
      console.log(`PDF cargado: ${pdf.numPages} páginas`);
      
      // Intentar obtener metadatos para el título
      let documentTitle = null;
      try {
        const metadata = await pdf.getMetadata();
        if (metadata && metadata.info) {
          const info = metadata.info as Record<string, unknown>;
          if (info && 'Title' in info && typeof info['Title'] === 'string') {
            documentTitle = info['Title'];
          }
        }
      } catch (metadataError) {
        console.warn("No se pudieron obtener metadatos:", metadataError);
      }
      
      // Extraer texto de todas las páginas
      let fullText = "";
      const pageTexts: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        // Actualizar progreso basado en el número de páginas procesadas
        const progressPercent = 40 + Math.floor((pageNum / pdf.numPages) * 40);
        setProgress(progressPercent);
        console.log(`Procesando página ${pageNum} de ${pdf.numPages} (${progressPercent}%)`);
        
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Mejorado: extracto de texto estructurado
          let pageText = '';
          let lastY = null;
          
          // Iterar sobre los items de texto de la página
          for (const item of textContent.items) {
            if (!('str' in item) || typeof item.str !== 'string') continue;
            
            // Detectar saltos de línea
            const transform = 'transform' in item ? item.transform : null;
            const y = transform && transform.length >= 6 ? transform[5] : 0;
            
            if (lastY !== null && Math.abs(y - lastY) > 5) {
              pageText += '\n';
            } else if (pageText.length > 0 && !pageText.endsWith(' ') && !item.str.startsWith(' ')) {
              pageText += ' ';
            }
            
            pageText += item.str;
            lastY = y;
          }
          
          // Limpiar el texto (quitar espacios múltiples, etc.)
          pageText = pageText
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .replace(/\s+\n/g, '\n')
            .trim();
            
          pageTexts.push(pageText);
          console.log(`Página ${pageNum}: ${pageText.length} caracteres extraídos`);
        } catch (pageError) {
          console.error(`Error al procesar la página ${pageNum}:`, pageError);
          pageTexts.push(`[Error en la página ${pageNum}]`);
        }
      }
      
      // Unir textos de páginas con separadores
      fullText = pageTexts.join('\n\n--- Página siguiente ---\n\n');
      
      setProgress(85);
      console.log(`Texto total extraído: ${fullText.length} caracteres`);
      
      // Verificar si se extrajo algún texto
      if (fullText.trim().length === 0) {
        throw new Error('No se pudo extraer texto del PDF. El documento parece contener solo imágenes.');
      }
      
      // Crear un documento Word más estructurado
      const title = documentTitle || file.name.replace('.pdf', '');
      
      const doc = new Document({
        title: title,
        description: 'Documento convertido de PDF a DOCX',
        sections: [{
          properties: {},
          children: [
            // Título del documento
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 36,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 }
            }),
            
            // Subtítulo
            new Paragraph({
              children: [
                new TextRun({
                  text: `Documento PDF convertido a Word - ${new Date().toLocaleDateString('es-ES')}`,
                  italics: true,
                  size: 24,
                }),
              ],
              spacing: { after: 400 }
            }),
            
            // Contenido del PDF
            ...pageTexts.map((pageText, index) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Página ${index + 1}`,
                    bold: true,
                    size: 28,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
                pageBreakBefore: index > 0
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: pageText,
                    size: 24,
                  }),
                ],
              })
            ]).flat(),
            
            // Pie de documento
            new Paragraph({
              children: [
                new TextRun({
                  text: "--- Fin del documento convertido ---",
                  italics: true,
                  size: 20,
                }),
              ],
              spacing: { before: 400 },
              alignment: AlignmentType.CENTER
            })
          ]
        }]
      });
      
      setProgress(90);
      console.log('Generando documento Word...');
      
      // Generar el blob y crear el archivo
      try {
        const blob = await Packer.toBlob(doc);
        
        if (!blob || blob.size === 0) {
          throw new Error('Se generó un archivo Word vacío');
        }
        
        const resultFile = new File(
          [blob], 
          file.name.replace(/\.pdf$/i, '') + '_convertido.docx', 
          { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
        );
        
        setProgress(100);
        setConvertedFiles([resultFile]);
        console.log('Conversión simple completada con éxito:', resultFile.name, 'tamaño:', (resultFile.size / 1024).toFixed(2), 'KB');
        
        return {
          success: true,
          files: [resultFile]
        };
      } catch (docxError) {
        console.error('Error generando documento DOCX:', docxError);
        throw new Error('Error al generar el documento Word: ' + (docxError instanceof Error ? docxError.message : 'Error desconocido'));
      }
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
      try {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast.success('Documento Word descargado correctamente');
      } catch (error) {
        console.error('Error al descargar archivo:', error);
        toast.error('Error al descargar el documento: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    } else {
      toast.error('No hay archivos para descargar');
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
