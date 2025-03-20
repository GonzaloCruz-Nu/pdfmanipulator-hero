
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  AlignmentType, ImageRun, Table, TableRow, TableCell, 
  WidthType, BorderStyle, TableOfContents, Header, Footer,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
  HorizontalPositionAlign, VerticalPositionAlign, ExternalHyperlink
} from 'docx';
import { PageContent, detectHeadings } from './pdfTextExtractor';

/**
 * Crear un documento DOCX a partir del contenido extraído del PDF
 */
export const createDocxFromPdfContent = async (
  fileName: string, 
  fileSize: number, 
  pageContents: PageContent[], 
  numPages: number,
  documentTitle: string | null = null
): Promise<Blob> => {
  try {
    console.log('Creando documento DOCX con formato mejorado...');
    
    // Título para el documento
    const title = documentTitle || fileName.replace('.pdf', '');
    
    // Crear el documento DOCX con mejor estructura y formato
    const doc = new Document({
      title: title,
      description: 'Documento convertido de PDF a DOCX',
      externalStyles: undefined,
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 pulgada
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    size: 18,
                    color: "888888",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Página ",
                    size: 18,
                    color: "888888",
                  }),
                  new TextRun({
                    children: [
                      "PAGE",
                    ],
                    size: 18,
                    color: "888888",
                  }),
                  new TextRun({
                    text: " de ",
                    size: 18,
                    color: "888888",
                  }),
                  new TextRun({
                    children: [
                      "NUMPAGES",
                    ],
                    size: 18,
                    color: "888888",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // Título del documento
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 36, 
                color: "1F2A44", // Color azul corporativo
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
                text: `Documento convertido a Word - ${new Date().toLocaleDateString('es-ES')}`,
                italics: true,
                size: 24,
                color: "555555",
              }),
            ],
            spacing: {
              after: 400
            }
          }),
          
          // Tabla de contenido (índice)
          new TableOfContents("Índice", {
            hyperlink: true,
            headingStyleRange: "1-3",
            stylesWithLevels: [
              { styleName: "Heading1", level: 1 },
              { styleName: "Heading2", level: 2 },
              { styleName: "Heading3", level: 3 },
            ],
          }),
          
          // Separador después del índice
          new Paragraph({
            text: "",
            spacing: { after: 400 },
            pageBreakAfter: true,
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
          ...pageContents.flatMap(({ text, pageNum, hasImages, textItems }) => {
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
                    color: "1F2A44", // Color azul corporativo
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
            
            // Si la página contiene muy poco texto o tiene mensaje de error/imagen
            if (text.startsWith('[') && text.endsWith(']')) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: text,
                      italics: true,
                      color: "#F68D2E" // Color naranja corporativo
                    })
                  ],
                  spacing: { before: 120, after: 120 }
                })
              );
              
              if (hasImages) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Se ha detectado contenido gráfico en esta página que requiere OCR para extraer texto de imágenes.",
                        italics: true,
                        color: "#555555"
                      })
                    ],
                    spacing: { before: 120, after: 120 }
                  })
                );
              }
              
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
              
              // Detectar si la línea podría ser un título utilizando la función auxiliar
              const headingInfo = detectHeadings(line.trim());
              
              // Si parece un encabezado, formatearlo como tal
              if (headingInfo.isHeading) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line.trim(),
                        bold: true,
                        size: headingInfo.level === 1 ? 32 : (headingInfo.level === 2 ? 28 : 24),
                        color: "1F2A44", // Color azul corporativo
                      }),
                    ],
                    heading: headingInfo.level === 1 ? 
                             HeadingLevel.HEADING_1 : 
                             (headingInfo.level === 2 ? 
                              HeadingLevel.HEADING_2 : 
                              HeadingLevel.HEADING_3),
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
                color: "888888",
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
    const blobSizeKB = (blob.size / 1024).toFixed(2);
    console.log('Blob generado correctamente, tamaño:', blobSizeKB, 'KB');
    
    return blob;
  } catch (error) {
    console.error("Error al crear el documento DOCX:", error);
    throw error;
  }
};
