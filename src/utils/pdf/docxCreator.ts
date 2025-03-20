
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  AlignmentType, ImageRun, Table, TableRow, TableCell, 
  WidthType, BorderStyle
} from 'docx';
import { PageContent } from './pdfTextExtractor';

/**
 * Create a DOCX document from extracted PDF content
 */
export const createDocxFromPdfContent = async (
  fileName: string, 
  fileSize: number, 
  pageContents: PageContent[], 
  numPages: number
): Promise<Blob> => {
  try {
    console.log('Creating DOCX document with improved formatting...');
    
    // Create the DOCX document with better structure and formatting
    const doc = new Document({
      title: fileName.replace('.pdf', ''),
      description: 'Document converted from PDF to DOCX',
      sections: [{
        properties: {},
        children: [
          // Document title
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
          
          // Subtitle with date
          new Paragraph({
            children: [
              new TextRun({
                text: `Document converted to Word - ${new Date().toLocaleDateString()}`,
                italics: true,
                size: 24,
              }),
            ],
            spacing: {
              after: 400
            }
          }),
          
          // Info table
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
                      children: [new TextRun({ text: "Original document:", bold: true })],
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
                      children: [new TextRun({ text: "Pages:", bold: true })],
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
                      children: [new TextRun({ text: "Original size:", bold: true })],
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
          
          // Separator
          new Paragraph({
            text: "",
            spacing: { after: 200 },
          }),
          
          // Main document content
          ...pageContents.flatMap(({ text, pageNum }) => {
            // Create an array of paragraphs for each page
            const paragraphs: Paragraph[] = [];
            
            // Add page header
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Page ${pageNum}`,
                    bold: true,
                    size: 28,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  before: 360,
                  after: 160
                },
                pageBreakBefore: pageNum > 1, // Page break except for the first page
              })
            );
            
            // If the page contains very little text, add an informative message
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
            
            // Process the page text
            const textLines = text.split('\n');
            
            // Process each line as an independent paragraph
            for (const line of textLines) {
              if (line.trim().length === 0) {
                // Space between paragraphs
                paragraphs.push(new Paragraph({ text: "" }));
                continue;
              }
              
              // Detect if the line could be a title 
              const couldBeHeading = line.length < 100 && 
                                     !line.trim().endsWith('.') && 
                                     !line.trim().endsWith(',') &&
                                     line.trim().length > 0;
              
              // If it looks like a heading, format it as such
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
                // Normal paragraph with improved size and spacing
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
          
          // Final message
          new Paragraph({
            children: [
              new TextRun({
                text: "--- End of converted document ---",
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
    
    console.log('DOCX document structure created, generating binary file...');
    
    // Generate document blob
    const blob = await Packer.toBlob(doc);
    const blobSizeMB = (blob.size / 1024 / 1024).toFixed(2);
    const blobSizeKB = (blob.size / 1024).toFixed(2);
    console.log('Blob generated correctly, size:', blobSizeKB, 'KB');
    
    return blob;
  } catch (error) {
    console.error("Error creating DOCX document:", error);
    throw error;
  }
};
