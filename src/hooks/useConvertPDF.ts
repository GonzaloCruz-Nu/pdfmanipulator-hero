
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType } from 'docx';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
   * Convierte un PDF a otro formato (imagen, texto o Word)
   */
  const convertPDF = async (file: File | null, format: string): Promise<ConvertResult> => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return { success: false, files: [], message: 'No se ha seleccionado archivo' };
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setConvertedFiles([]);

      // Cargar el PDF
      const fileUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      
      setProgress(30);
      
      const numPages = pdf.numPages;
      const resultFiles: File[] = [];
      
      if (format === 'docx') {
        // Convertir a formato Word/DOCX
        setProgress(40);
        
        // Estructura para almacenar todo el contenido del PDF
        let allContent = '';
        
        // Extraer texto de todas las páginas del PDF
        for (let i = 1; i <= numPages; i++) {
          setProgress(40 + Math.floor((i / numPages) * 30));
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const textItems = textContent.items.map((item: any) => 
            'str' in item ? item.str : '');
          
          // Agregar separadores de página claros
          allContent += `\n\n--- PÁGINA ${i} ---\n\n`;
          allContent += textItems.join(' ');
        }
        
        setProgress(70);
        
        // Crear el documento DOCX con formato mejorado
        const doc = new Document({
          title: file.name.replace('.pdf', ''),
          description: 'Documento convertido de PDF a DOCX',
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: `Documento: ${file.name.replace('.pdf', '')}`,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                thematicBreak: true,
              }),
              
              new Paragraph({
                text: `Convertido de PDF a DOCX`,
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 200,
                },
              }),
              
              // Dividir el contenido por páginas y crear párrafos estructurados
              ...allContent.split('--- PÁGINA').map((pageContent, index) => {
                if (index === 0) return [];
                
                const pageNumber = pageContent.split('---')[0].trim();
                const content = pageContent.split('---')[1]?.trim() || '';
                
                return [
                  new Paragraph({
                    text: `Página ${pageNumber}`,
                    heading: HeadingLevel.HEADING_2,
                    thematicBreak: true,
                    spacing: {
                      before: 400,
                      after: 200,
                    },
                    border: {
                      bottom: {
                        color: "999999",
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                      },
                    },
                  }),
                  ...content.split('\n').filter(line => line.trim()).map(line => 
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: line,
                        }),
                      ],
                      spacing: {
                        line: 360,
                      }
                    })
                  ),
                ];
              }).flat(),
            ],
          }],
        });
        
        setProgress(80);
        
        try {
          // Generar el documento como base64 y convertirlo a Blob
          const base64 = await Packer.toBase64String(doc);
          
          // Convertir base64 a Blob de manera más eficiente
          const byteCharacters = atob(base64);
          const byteArrays = [];
          
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          
          const blob = new Blob(byteArrays, {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
          
          // Crear archivo Word con nombre descriptivo
          const docxFile = new File(
            [blob],
            `${file.name.replace('.pdf', '')}_convertido.docx`,
            { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
          );
          
          resultFiles.push(docxFile);
        } catch (error) {
          console.error('Error al generar el archivo DOCX:', error);
          throw new Error('Error al generar el archivo DOCX');
        }
      } else {
        // Procesar cada página del PDF para otros formatos
        for (let i = 1; i <= numPages; i++) {
          setProgress(30 + Math.floor((i / numPages) * 50));
          
          const page = await pdf.getPage(i);
          
          if (format === 'text') {
            // Extraer texto de la página
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item: any) => 
              'str' in item ? item.str : '');
            const text = textItems.join(' ');
            
            // Crear archivo de texto
            const textBlob = new Blob([text], { type: 'text/plain' });
            const textFile = new File(
              [textBlob],
              `${file.name.replace('.pdf', '')}_pagina_${i}.txt`,
              { type: 'text/plain' }
            );
            
            resultFiles.push(textFile);
          } else {
            // Convertir a imagen (JPEG o PNG)
            const viewport = page.getViewport({ scale: 2.0 }); // Mayor escala para mejor calidad
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (!context) {
              throw new Error('No se pudo crear el contexto del canvas');
            }
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            // Obtener la imagen del canvas
            const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
            const quality = format === 'jpeg' ? 0.8 : undefined;
            const imageDataUrl = canvas.toDataURL(mimeType, quality);
            
            // Convertir data URL a Blob
            const binaryString = atob(imageDataUrl.split(',')[1]);
            const array = [];
            for (let j = 0; j < binaryString.length; j++) {
              array.push(binaryString.charCodeAt(j));
            }
            const blob = new Blob([new Uint8Array(array)], { type: mimeType });
            
            // Crear archivo de imagen
            const extension = format === 'jpeg' ? 'jpg' : 'png';
            const imageFile = new File(
              [blob],
              `${file.name.replace('.pdf', '')}_pagina_${i}.${extension}`,
              { type: mimeType }
            );
            
            resultFiles.push(imageFile);
          }
        }
      }
      
      setProgress(90);
      setConvertedFiles(resultFiles);
      setProgress(100);
      
      toast.success(`PDF convertido a ${format.toUpperCase()} correctamente`);
      
      return {
        success: true,
        files: resultFiles,
        message: `PDF convertido a ${format.toUpperCase()} correctamente`
      };
      
    } catch (error) {
      console.error('Error al convertir el PDF:', error);
      toast.error('Error al convertir el PDF');
      
      return {
        success: false,
        files: [],
        message: 'Error al convertir el PDF'
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
    if (convertedFiles.length === 0) return;
    
    // Si es un solo archivo, descargarlo directamente
    if (convertedFiles.length === 1) {
      const url = URL.createObjectURL(convertedFiles[0]);
      const a = document.createElement('a');
      a.href = url;
      a.download = convertedFiles[0].name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    
    // Si son múltiples archivos, crear un archivo ZIP
    import('jszip').then(({ default: JSZip }) => {
      const zip = new JSZip();
      
      // Añadir archivos al ZIP
      convertedFiles.forEach(file => {
        zip.file(file.name, file);
      });
      
      // Generar y descargar el ZIP
      zip.generateAsync({ type: 'blob' }).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'archivos_convertidos.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Archivos descargados correctamente');
      });
    }).catch(error => {
      console.error('Error al crear el archivo ZIP:', error);
      toast.error('Error al descargar los archivos');
    });
  };

  return {
    convertPDF,
    isProcessing,
    progress,
    convertedFiles,
    downloadConvertedFiles
  };
};
