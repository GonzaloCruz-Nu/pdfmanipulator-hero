
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  AlignmentType, ImageRun, Table, TableRow, TableCell, 
  WidthType, BorderStyle
} from 'docx';
import { PageContent } from './pdfTextExtractor';

/**
 * Crear un documento DOCX a partir del contenido extraído del PDF
 */
export const createDocxFromPdfContent = async (
  fileName: string, 
  fileSize: number, 
  pageContents: PageContent[], 
  numPages: number
): Promise<Blob> => {
  try {
    console.log('Creando documento DOCX con formato mejorado...');
    
    // Crear el documento DOCX con mejor estructura y formato
    const doc = new Document({
      title: fileName.replace('.pdf', ''),
      description: 'Documento convertido de PDF a DOCX',
      sections: [{
        properties: {},
        children: [
          // Título del documento
          new Paragraph({
            children: [
              new TextRun({
                text: fileName.replace('.pdf', ''),
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
          
          // Tabla de información
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
                      children: [new TextRun({ text: fileName })],
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
                        text: fileSize > 1024 * 1024 
                          ? (fileSize / 1024 / 1024).toFixed(2) + ' MB' 
                          : (fileSize / 1024).toFixed(2) + ' KB' 
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
          ...pageContents.flatMap(({ text, pageNum }) => {
            // Crear un array de párrafos para cada página
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
                pageBreakBefore: pageNum > 1, // Salto de página excepto para la primera
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
            
            // Procesar cada línea como un párrafo independiente
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
    
    console.log('Estructura del documento DOCX creada, generando archivo binario...');
    
    // Generar blob del documento
    const blob = await Packer.toBlob(doc);
    const blobSizeMB = (blob.size / 1024 / 1024).toFixed(2);
    const blobSizeKB = (blob.size / 1024).toFixed(2);
    console.log('Blob generado correctamente, tamaño:', blobSizeKB, 'KB');
    
    return blob;
  } catch (error) {
    console.error("Error al crear el documento DOCX:", error);
    throw error;
  }
};
