
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ImageRun } from 'docx';

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
      
      // Usar PDF.js para cargar el documento con mayor tolerancia a errores
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        disableFontFace: false,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/',
        cMapPacked: true,
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
            
            // Modo más agresivo de extracción de texto
            const textContent = await page.getTextContent({
              // Solo usar propiedades válidas según TypeScript
              includeMarkedContent: true,
            });
            
            // Extraer texto página por página con mejor manejo de espacios y saltos de línea
            let pageText = '';
            let lastY = null;
            let lastX = null;
            let lastItem = null;

            // Método avanzado de extracción
            for (const item of textContent.items) {
              if (!('str' in item) || typeof item.str !== 'string') continue;
              
              const text = item.str;
              const x = item.transform?.[4] || 0; // Posición X
              const y = item.transform?.[5] || 0; // Posición Y
              
              // Detectar si hay un cambio de línea basado en la posición Y
              if (lastY !== null && Math.abs(y - lastY) > 2) {
                pageText += '\n';
              } 
              // Detectar espacios entre palabras basado en la posición X
              else if (lastX !== null && lastItem && 'str' in lastItem && x - lastX > 5) {
                // Evitar añadir espacios duplicados
                if (!lastItem.str.endsWith(' ') && !text.startsWith(' ')) {
                  pageText += ' ';
                }
              }
              
              pageText += text;
              lastY = y;
              lastX = x + (item.width || 0);
              lastItem = item;
            }
            
            // Etapa adicional: Recuperar información usando operadores de texto
            try {
              const opList = await page.getOperatorList();
              // No procesamos esto directamente, pero nos ayuda a cargar 
              // mejor el contenido en algunos PDFs
            } catch (opError) {
              console.warn(`No se pudieron obtener los operadores de texto para la página ${i}:`, opError);
            }
            
            // Intento de recuperación: renderizar a canvas como respaldo
            if (pageText.trim().length < 100) {
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
                  
                  // Aquí no extraemos texto del canvas (requeriría OCR),
                  // pero en una implementación completa se podría añadir Tesseract.js
                  console.log(`Página ${i}: Renderizada a canvas como respaldo`);
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
            
            if (pageText.trim().length === 0) {
              console.log(`ADVERTENCIA: No se extrajo texto en la página ${i}. Puede ser una imagen o estar escaneada.`);
            }
            
            allPageContent.push({
              text: pageText,
              pageNum: i
            });
          } catch (pageError) {
            console.error(`Error al procesar la página ${i}:`, pageError);
            // En lugar de fallar, simplemente añadimos una página vacía con mensaje de error
            allPageContent.push({
              text: `Error en página ${i}: No se pudo extraer contenido. Posible imagen o contenido escaneado.`,
              pageNum: i
            });
          }
        }
        
        setProgress(70);
        console.log('Texto extraído de todas las páginas. Contenido total:', totalTextExtracted, 'caracteres');
        
        // Verificar contenido extraído con criterios más flexibles
        if (totalTextExtracted < 100 && allPageContent.every(page => page.text.trim().length < 20)) {
          console.error('Se extrajo muy poco texto del PDF');
          return { 
            success: false, 
            files: [], 
            message: 'El documento parece contener principalmente imágenes o texto escaneado. Prueba con la herramienta OCR.' 
          };
        }
        
        console.log('Creando documento DOCX con formato mejorado...');
        
        // Crear el documento DOCX con mejor estructura y formato
        const doc = new Document({
          title: file.name.replace('.pdf', ''),
          description: 'Documento convertido de PDF a DOCX',
          sections: [{
            properties: {},
            children: [
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
              
              // Contenido principal del documento
              ...allPageContent.flatMap(({ text, pageNum }) => {
                // Si la página tiene muy poco texto, añadir un mensaje informativo
                if (text.trim().length < 20) {
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
                          text: "Esta página contiene poco texto extraíble. Podría ser una imagen o estar escaneada.",
                          italics: true,
                          color: "#FF0000"
                        })
                      ]
                    }),
                    new Paragraph({ text: "" }),
                  ];
                }
                
                // Procesar texto en líneas y párrafos más estructurados
                // Primero dividimos por saltos de línea explícitos
                const textLines = text.split('\n');
                const paragraphs: Paragraph[] = [];
                
                // Añadir marcador de página
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
                    }
                  })
                );
                
                // Añadir cada línea como un párrafo individual
                for (const line of textLines) {
                  if (line.trim().length === 0) {
                    // Espacio entre párrafos
                    paragraphs.push(new Paragraph({ text: "" }));
                    continue;
                  }
                  
                  // Detectar si la línea podría ser un título 
                  // (menos de 100 caracteres y termina sin punto)
                  const couldBeHeading = line.length < 100 && 
                                         !line.trim().endsWith('.') && 
                                         !line.trim().endsWith(',');
                  
                  // Si parece un encabezado, formatearlo como tal
                  if (couldBeHeading && line.trim().length > 0) {
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
                    // Párrafo normal
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
            ],
          }],
        });
        
        setProgress(85);
        console.log('Estructura de documento DOCX creada, generando archivo binario...');
        
        try {
          // Generar el blob del documento con opciones de preservación mejoradas
          const blob = await Packer.toBlob(doc);
          const blobSizeMB = (blob.size / 1024 / 1024).toFixed(2);
          const blobSizeKB = (blob.size / 1024).toFixed(2);
          console.log('Blob generado correctamente, tamaño:', blobSizeKB, 'KB');
          
          if (!blob || blob.size === 0) {
            throw new Error('El blob generado está vacío');
          }
          
          // Verificar el tamaño del archivo generado con criterios actualizados
          const minExpectedSize = Math.max(1024, totalTextExtracted / 10); // Mínimo 1KB
          if (blob.size < minExpectedSize && totalTextExtracted > 1000) {
            console.warn(`Advertencia: El tamaño del archivo DOCX (${blob.size} bytes) parece muy pequeño comparado con ${totalTextExtracted} caracteres extraídos`);
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
