import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ImageRun } from 'docx';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ConvertResult {
  success: boolean;
  files: File[];
  message: string;
}

// Función para convertir base64 a ArrayBuffer (reemplazo para Buffer)
const base64ToArrayBuffer = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

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
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);
      
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      
      setProgress(30);
      
      const numPages = pdf.numPages;
      const resultFiles: File[] = [];
      
      if (format === 'docx') {
        // Convertir a formato Word/DOCX
        setProgress(40);
        
        // Estructura para almacenar todo el contenido del PDF
        const allTextContent: string[] = [];
        const allImageContents: { dataUrl: string, width: number, height: number }[] = [];
        
        // Extraer texto e imágenes de todas las páginas del PDF
        for (let i = 1; i <= numPages; i++) {
          setProgress(40 + Math.floor((i / numPages) * 30));
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Extraer texto página por página
          const textItems = textContent.items.map((item: any) => 
            'str' in item ? item.str : '').filter(Boolean);
          
          allTextContent.push(`--- PÁGINA ${i} ---\n${textItems.join(' ')}`);
          
          // Extraer imágenes de cada página
          try {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
              
              // Almacenar la imagen de la página
              allImageContents.push({
                dataUrl: canvas.toDataURL('image/jpeg', 0.7),
                width: viewport.width,
                height: viewport.height
              });
            }
          } catch (error) {
            console.warn(`No se pudo extraer imagen de la página ${i}:`, error);
          }
        }
        
        setProgress(70);
        
        // Crear el documento DOCX con formato mejorado y contenido completo
        const docChildren = [];
        
        // Añadir título del documento
        docChildren.push(
          new Paragraph({
            text: `Documento: ${file.name.replace('.pdf', '')}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            thematicBreak: true,
            spacing: {
              after: 200,
            },
          })
        );
        
        // Añadir metadatos de conversión
        docChildren.push(
          new Paragraph({
            text: `Convertido de PDF a DOCX - ${numPages} páginas`,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
            },
          })
        );
        
        // Procesar el contenido página por página
        for (let i = 0; i < allTextContent.length; i++) {
          const pageContent = allTextContent[i];
          const pageNumber = i + 1;
          
          // Añadir encabezado de página
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Página ${pageNumber}`,
                  bold: true,
                  size: 28,
                }),
              ],
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
            })
          );
          
          // Añadir imagen de la página (si está disponible)
          if (i < allImageContents.length) {
            try {
              const image = allImageContents[i];
              // Convertir dataUrl a base64
              const base64Image = image.dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
              
              // Calcular dimensiones apropiadas (conservar relación de aspecto)
              const maxWidth = 500;
              const ratio = image.width / image.height;
              const width = Math.min(image.width, maxWidth);
              const height = width / ratio;
              
              // Usamos nuestra función auxiliar en lugar de Buffer
              const imageData = base64ToArrayBuffer(base64Image);
              
              docChildren.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: imageData,
                      transformation: {
                        width,
                        height,
                      },
                      type: 'jpg',
                    }),
                  ],
                  spacing: {
                    after: 200,
                  },
                })
              );
            } catch (error) {
              console.error('Error al insertar imagen en el documento DOCX:', error);
            }
          }
          
          // Añadir el texto de la página
          // Dividir el contenido en párrafos para mejor formato
          const textParagraphs = pageContent.split('\n').filter(p => p.trim());
          
          for (const paragraph of textParagraphs) {
            if (paragraph.startsWith('--- PÁGINA')) continue;
            
            // Separar el texto en párrafos más pequeños para mejorar la legibilidad
            const sentences = paragraph.split(/(?<=\.|\?|\!)\s+/g);
            
            for (let j = 0; j < sentences.length; j += 3) {
              const sentenceGroup = sentences.slice(j, j + 3).join(' ');
              if (sentenceGroup.trim()) {
                docChildren.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: sentenceGroup,
                      }),
                    ],
                    spacing: {
                      line: 360,
                      after: 120,
                    }
                  })
                );
              }
            }
          }
          
          // Añadir separador entre páginas
          if (i < allTextContent.length - 1) {
            docChildren.push(
              new Paragraph({
                text: "",
                thematicBreak: true,
                spacing: {
                  before: 200,
                  after: 200,
                },
              })
            );
          }
        }
        
        // Construir el documento final
        const doc = new Document({
          title: file.name.replace('.pdf', ''),
          description: 'Documento convertido de PDF a DOCX',
          sections: [{
            properties: {},
            children: docChildren,
          }],
        });
        
        setProgress(80);
        
        try {
          // Usar Packer.toBlob para generar el documento
          const blob = await Packer.toBlob(doc);
          
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
