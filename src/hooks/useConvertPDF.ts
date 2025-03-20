
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  AlignmentType, ImageRun, Table, TableRow, TableCell, 
  WidthType, BorderStyle
} from 'docx';

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

      // Cargar el PDF como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);
      console.log('PDF cargado en memoria, iniciando procesamiento...');
      
      // Usar PDF.js para cargar el documento con mayor tolerancia a errores
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        disableFontFace: false,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/',
        cMapPacked: true,
        useSystemFonts: true, // Permitir uso de fuentes del sistema
      });
      
      try {
        const pdf = await loadingTask.promise;
        console.log(`PDF cargado: ${pdf.numPages} páginas`);
        
        setProgress(30);
        
        const numPages = pdf.numPages;
        
        // Estructura para almacenar todo el contenido del PDF
        const allPageContent: PageContent[] = [];
        let totalTextExtracted = 0;
        
        // Extraer texto de todas las páginas del PDF con mejor manejo
        for (let i = 1; i <= numPages; i++) {
          setProgress(30 + Math.floor((i / numPages) * 40));
          console.log(`Procesando página ${i} de ${numPages}`);
          
          try {
            const page = await pdf.getPage(i);
            
            // Modo mejorado de extracción de texto con opciones compatibles
            const textContent = await page.getTextContent({
              // Solo usar propiedades válidas
              includeMarkedContent: true,
              normalizeWhitespace: true,
            });
            
            // Extraer texto página por página con mejor manejo de espacios y saltos de línea
            let pageText = '';
            let lastY = null;
            let lastX = null;
            
            if (textContent.items.length === 0) {
              console.log(`Página ${i}: No contiene texto extraíble. Podría ser una imagen.`);
              pageText = `[Esta página parece contener solo imágenes o gráficos sin texto extraíble]`;
            } else {
              for (const item of textContent.items) {
                if (!('str' in item) || typeof item.str !== 'string') continue;
                
                const text = item.str;
                const x = item.transform?.[4] || 0; // Posición X
                const y = item.transform?.[5] || 0; // Posición Y
                
                // Detectar cambios de línea basados en la posición Y
                if (lastY !== null && Math.abs(y - lastY) > 3) {
                  // Es un cambio de línea significativo
                  pageText += '\n';
                } 
                // Detectar espacios entre palabras basado en la posición X
                else if (lastX !== null && x - lastX > 10) {
                  // Hay un espacio significativo horizontal
                  if (!pageText.endsWith(' ') && !text.startsWith(' ')) {
                    pageText += ' ';
                  }
                }
                
                pageText += text;
                lastY = y;
                lastX = x + (item.width || 0);
              }
            }
            
            // Método avanzado para obtener operadores de contenido
            try {
              const opList = await page.getOperatorList();
              // Análisis básico para detectar si hay contenido que no es texto
              const hasImages = opList.fnArray.some(op => op === pdfjsLib.OPS.paintImageXObject);
              
              if (hasImages && pageText.trim().length < 100) {
                console.log(`Página ${i}: Contiene imágenes pero poco texto extraíble.`);
                if (pageText.trim().length === 0) {
                  pageText = `[Esta página contiene imágenes sin texto extraíble]`;
                }
              }
            } catch (opError) {
              console.warn(`No se pudieron obtener los operadores para la página ${i}:`, opError);
            }
            
            // Mejora: Renderizar a canvas como respaldo para páginas sin texto
            if (pageText.trim().length < 50) {
              try {
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  
                  await page.render({
                    canvasContext: ctx,
                    viewport: viewport
                  }).promise;
                  
                  console.log(`Página ${i}: Renderizada a canvas como respaldo`);
                  
                  // Nota informativa en el texto
                  if (pageText.trim().length === 0) {
                    pageText = `[Página ${i}: Esta página parece contener principalmente imágenes o gráficos]`;
                  }
                }
              } catch (canvasError) {
                console.warn(`Error al renderizar página ${i} a canvas:`, canvasError);
              }
            }
            
            // Limpiar espacios en blanco excesivos
            pageText = pageText
              .replace(/\s+/g, ' ')  // Convertir múltiples espacios en uno solo
              .replace(/\n\s+/g, '\n')  // Eliminar espacios al inicio de líneas
              .replace(/\s+\n/g, '\n')  // Eliminar espacios al final de líneas
              .replace(/\n{3,}/g, '\n\n'); // Limitar múltiples saltos de línea a máximo 2
            
            console.log(`Página ${i}: Extraídos aproximadamente ${pageText.length} caracteres`);
            totalTextExtracted += pageText.length;
            
            allPageContent.push({
              text: pageText,
              pageNum: i
            });
          } catch (pageError) {
            console.error(`Error al procesar la página ${i}:`, pageError);
            // En lugar de fallar, añadimos una página con mensaje de error
            allPageContent.push({
              text: `[Error en página ${i}: No se pudo extraer contenido. Posible imagen o contenido escaneado.]`,
              pageNum: i
            });
          }
        }
        
        setProgress(70);
        console.log('Texto extraído de todas las páginas. Contenido total:', totalTextExtracted, 'caracteres');
        
        // Verificar contenido extraído con criterios flexibles
        if (totalTextExtracted < 100 && numPages > 1) {
          console.error('Se extrajo muy poco texto del PDF, posible documento escaneado o con imágenes');
          return { 
            success: false, 
            files: [], 
            message: 'El documento parece contener principalmente imágenes o texto escaneado. Prueba con la herramienta OCR.' 
          };
        }
        
        console.log('Creando documento DOCX con formato mejorado...');
        
        // MEJORA: Crear el documento DOCX con mejor estructura y formato
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
                    size: 32,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: {
                  before: 400,
                  after: 200
                }
              }),
              
              // Subtítulo con fecha
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Documento convertido a Word - ${new Date().toLocaleDateString()}`,
                    italics: true,
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 400
                }
              }),
              
              // Tabla informativa
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "#DDDDDD" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "#DDDDDD" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "#DDDDDD" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "#DDDDDD" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "#DDDDDD" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "#DDDDDD" },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Documento original:", bold: true })],
                        })],
                        width: { size: 30, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: file.name })],
                        })],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Páginas:", bold: true })],
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: numPages.toString() })],
                        })],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Tamaño original:", bold: true })],
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ 
                            text: file.size > 1024 * 1024 
                              ? (file.size / 1024 / 1024).toFixed(2) + ' MB' 
                              : (file.size / 1024).toFixed(2) + ' KB' 
                          })],
                        })],
                      }),
                    ],
                  }),
                ],
              }),
              
              // Separador
              new Paragraph({
                text: "",
                spacing: { after: 200 },
              }),
              
              // Contenido principal del documento
              ...allPageContent.flatMap(({ text, pageNum }) => {
                // Crear un array de paragraphs para cada página
                const paragraphs: Paragraph[] = [];
                
                // Añadir encabezado de página
                paragraphs.push(
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
                      before: 360,
                      after: 160
                    },
                    pageBreakBefore: pageNum > 1, // Salto de página excepto en la primera
                  })
                );
                
                // Si la página contiene muy poco texto, añadir un mensaje informativo
                if (text.startsWith('[') && text.endsWith(']')) {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: text,
                          italics: true,
                          color: "#FF0000"
                        })
                      ],
                      spacing: { before: 120, after: 120 }
                    })
                  );
                  return paragraphs;
                }
                
                // Procesar el texto de la página
                const textLines = text.split('\n');
                
                // Procesar cada línea como párrafo independiente
                for (const line of textLines) {
                  if (line.trim().length === 0) {
                    // Espacio entre párrafos
                    paragraphs.push(new Paragraph({ text: "" }));
                    continue;
                  }
                  
                  // Detectar si la línea podría ser un título 
                  const couldBeHeading = line.length < 100 && 
                                         !line.trim().endsWith('.') && 
                                         !line.trim().endsWith(',') &&
                                         line.trim().length > 0;
                  
                  // Si parece un encabezado, formatearlo como tal
                  if (couldBeHeading) {
                    paragraphs.push(
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: line.trim(),
                            bold: true,
                            size: 28,
                          }),
                        ],
                        heading: HeadingLevel.HEADING_3,
                        spacing: {
                          before: 280,
                          after: 140
                        }
                      })
                    );
                  } else {
                    // Párrafo normal con tamaño y espaciado mejorados
                    paragraphs.push(
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: line.trim(),
                            size: 24, // 12pt
                          }),
                        ],
                        spacing: {
                          before: 120,
                          after: 120
                        }
                      })
                    );
                  }
                }
                
                return paragraphs;
              }),
              
              // Mensaje final
              new Paragraph({
                children: [
                  new TextRun({
                    text: "--- Fin del documento convertido ---",
                    italics: true,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: {
                  before: 500,
                }
              }),
            ],
          }],
        });
        
        setProgress(85);
        console.log('Estructura de documento DOCX creada, generando archivo binario...');
        
        try {
          // Generar el blob del documento
          const blob = await Packer.toBlob(doc);
          const blobSizeMB = (blob.size / 1024 / 1024).toFixed(2);
          const blobSizeKB = (blob.size / 1024).toFixed(2);
          console.log('Blob generado correctamente, tamaño:', blobSizeKB, 'KB');
          
          if (!blob || blob.size === 0) {
            throw new Error('El blob generado está vacío');
          }
          
          // Verificar el tamaño del archivo generado
          if (blob.size < 20000 && totalTextExtracted > 1000) { // 20KB mínimo para documentos con texto
            console.warn(`Advertencia: El tamaño del archivo DOCX (${blob.size / 1024} KB) parece pequeño para ${totalTextExtracted} caracteres`);
          }
          
          // Crear archivo Word con nombre descriptivo
          const docxFile = new File(
            [blob],
            `${file.name.replace('.pdf', '')}_convertido.docx`,
            { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
          );
          
          console.log('Archivo Word creado:', docxFile.name, 'tamaño:', 
            docxFile.size > 1024 * 1024 
              ? (docxFile.size / 1024 / 1024).toFixed(2) + ' MB' 
              : (docxFile.size / 1024).toFixed(2) + ' KB'
          );
          
          if (docxFile.size === 0) {
            throw new Error('El archivo generado está vacío');
          }
          
          setConvertedFiles([docxFile]);
          
          setProgress(100);
          console.log('Conversión completada con éxito');
          
          return {
            success: true,
            files: [docxFile],
            message: 'PDF convertido a DOCX correctamente'
          };
        } catch (blobError) {
          console.error('Error al generar el archivo DOCX:', blobError);
          return {
            success: false,
            files: [],
            message: 'Error al generar el archivo DOCX: ' + (blobError instanceof Error ? blobError.message : 'Error desconocido')
          };
        }
      } catch (pdfError) {
        console.error('Error al procesar el PDF:', pdfError);
        return {
          success: false,
          files: [],
          message: 'Error al procesar el PDF: ' + (pdfError instanceof Error ? pdfError.message : 'Error desconocido')
        };
      }
    } catch (error) {
      console.error('Error al convertir el PDF:', error);
      toast.error('Error al convertir el PDF');
      
      return {
        success: false,
        files: [],
        message: 'Error al convertir el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido')
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
    
    try {
      // Verificación adicional antes de la descarga
      if (convertedFiles[0].size === 0) {
        throw new Error('El archivo a descargar está vacío');
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
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      toast.error('Error al descargar el archivo: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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
