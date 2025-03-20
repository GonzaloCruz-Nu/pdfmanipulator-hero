
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ConvertResult {
  success: boolean;
  files: File[];
  message: string;
}

interface PageContent {
  text: string;
  pageNum: number;
}

export const useConvertPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<File[]>([]);

  /**
   * Convierte un PDF a formato DOCX (Word) con mejoras en la extracción de texto
   */
  const convertPDF = async (file: File | null, format: string): Promise<ConvertResult> => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return { success: false, files: [], message: 'No se ha seleccionado archivo' };
    }

    // Verificar que solo admitimos DOCX como formato
    if (format !== 'docx') {
      toast.error('Solo se admite conversión a formato DOCX');
      return { success: false, files: [], message: 'Formato no soportado' };
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setConvertedFiles([]);
      console.log('Iniciando conversión de PDF a DOCX...', file.name, 'tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // Cargar el PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);
      console.log('PDF cargado en memoria, iniciando procesamiento...');
      
      // Usar PDF.js para cargar el documento
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      console.log(`PDF cargado: ${pdf.numPages} páginas`);
      
      setProgress(30);
      
      const numPages = pdf.numPages;
      
      // Estructura para almacenar todo el contenido del PDF
      const allPageContent: PageContent[] = [];
      
      // Extraer texto de todas las páginas del PDF con mejor manejo
      for (let i = 1; i <= numPages; i++) {
        setProgress(30 + Math.floor((i / numPages) * 40));
        console.log(`Procesando página ${i} de ${numPages}`);
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extraer texto página por página con mejor manejo de espacios
        let pageText = '';
        let lastY;
        let lastItem = null;

        for (const item of textContent.items) {
          if (!('str' in item) || !item.str) continue;
          
          // Si hay un cambio significativo en la posición Y, añadir un salto de línea
          if (lastItem && lastY && Math.abs(lastY - item.transform[5]) > 5) {
            pageText += '\n';
          } else if (lastItem && 'str' in lastItem) {
            // Añadir espacio entre palabras en la misma línea si no hay uno ya
            if (!lastItem.str.endsWith(' ') && !item.str.startsWith(' ')) {
              pageText += ' ';
            }
          }
          
          pageText += item.str;
          lastY = item.transform[5];
          lastItem = item;
        }
        
        console.log(`Página ${i}: Extraídos aproximadamente ${pageText.length} caracteres`);
        
        if (pageText.trim().length === 0) {
          console.log(`ADVERTENCIA: No se extrajo texto en la página ${i}. Puede ser una imagen o estar escaneada.`);
        }
        
        allPageContent.push({
          text: pageText,
          pageNum: i
        });
      }
      
      setProgress(70);
      console.log('Texto extraído de todas las páginas. Contenido total:', 
        allPageContent.reduce((acc, page) => acc + page.text.length, 0), 'caracteres');
      console.log('Creando documento DOCX...');
      
      // Crear el documento DOCX con mejor formato
      const doc = new Document({
        title: file.name.replace('.pdf', ''),
        description: 'Documento convertido de PDF a DOCX',
        sections: [{
          properties: {},
          children: [
            // Título del documento
            new Paragraph({
              children: [
                new TextRun({
                  text: file.name.replace('.pdf', ''),
                  bold: true,
                  size: 32
                })
              ],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 200
              }
            }),
            
            // Información de conversión
            new Paragraph({
              children: [
                new TextRun({
                  text: `Documento convertido de PDF a Word - ${numPages} páginas`,
                  italics: true,
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400
              }
            }),
            
            // Contenido de las páginas
            ...allPageContent.flatMap(({ text, pageNum }) => {
              // Si la página está vacía, añadir un mensaje de advertencia
              if (text.trim().length === 0) {
                return [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Página ${pageNum}`,
                        bold: true,
                        size: 28,
                      }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: {
                      before: 400,
                      after: 200
                    }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Esta página no contiene texto extraíble. Podría ser una imagen o estar escaneada.",
                        italics: true,
                        // Cambio de "red" a un código hexadecimal de color rojo
                        color: "#FF0000"
                      })
                    ]
                  }),
                  new Paragraph({ text: "" }),
                ];
              }
              
              // Dividir el texto en párrafos por saltos de línea
              const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
              
              return [
                // Encabezado de página
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Página ${pageNum}`,
                      bold: true,
                      size: 28,
                    }),
                  ],
                  heading: HeadingLevel.HEADING_2,
                  spacing: {
                    before: 400,
                    after: 200
                  }
                }),
                
                // Contenido de la página como párrafos separados
                ...paragraphs.map(p => 
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: p.trim(),
                      })
                    ],
                    spacing: {
                      after: 120
                    }
                  })
                ),
                
                // Espacio entre páginas
                new Paragraph({ text: "" }),
              ];
            }),
          ],
        }],
      });
      
      setProgress(85);
      console.log('Estructura de documento DOCX creada, generando archivo binario...');
      
      // Generar el blob del documento
      const blob = await Packer.toBlob(doc);
      console.log('Blob generado, tamaño:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Crear archivo Word con nombre descriptivo
      const docxFile = new File(
        [blob],
        `${file.name.replace('.pdf', '')}_convertido.docx`,
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );
      
      setConvertedFiles([docxFile]);
      
      setProgress(100);
      console.log('Conversión completada con éxito');
      
      return {
        success: true,
        files: [docxFile],
        message: 'PDF convertido a DOCX correctamente'
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
    if (convertedFiles.length === 0) {
      toast.error('No hay archivos para descargar');
      return;
    }
    
    // Descargar el archivo directamente
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
