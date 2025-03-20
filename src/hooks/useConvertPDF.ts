
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

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
   * Convierte un PDF a formato DOCX (Word)
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

      // Cargar el PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);
      
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      
      setProgress(30);
      
      const numPages = pdf.numPages;
      
      // Estructura para almacenar todo el contenido del PDF
      const allTextContent: string[] = [];
      
      // Extraer texto de todas las páginas del PDF
      for (let i = 1; i <= numPages; i++) {
        setProgress(30 + Math.floor((i / numPages) * 40));
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extraer texto página por página
        const textItems = textContent.items
          .map((item: any) => 'str' in item ? item.str : '')
          .filter(Boolean);
        
        const pageText = textItems.join(' ');
        allTextContent.push(`Página ${i}\n\n${pageText}`);
      }
      
      setProgress(70);
      
      // Crear el documento DOCX
      const docChildren = [];
      
      // Añadir título del documento
      docChildren.push(
        new Paragraph({
          text: `Documento: ${file.name.replace('.pdf', '')}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })
      );
      
      // Añadir metadatos de conversión
      docChildren.push(
        new Paragraph({
          text: `Convertido de PDF a DOCX - ${numPages} páginas`,
          alignment: AlignmentType.CENTER,
        })
      );
      
      docChildren.push(new Paragraph({ text: "" }));
      
      // Añadir el contenido de cada página
      for (let i = 0; i < allTextContent.length; i++) {
        // Añadir encabezado de página
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Página ${i + 1}`,
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          })
        );
        
        docChildren.push(new Paragraph({ text: "" }));
        
        // Dividir el texto en párrafos para mejor formato
        const pageContent = allTextContent[i];
        const paragraphs = pageContent.split('\n').filter(p => p.trim());
        
        for (const paragraph of paragraphs) {
          if (paragraph.startsWith('Página')) continue;
          
          docChildren.push(
            new Paragraph({
              text: paragraph,
            })
          );
        }
        
        // Añadir espacio entre páginas
        if (i < allTextContent.length - 1) {
          docChildren.push(new Paragraph({ text: "" }));
          docChildren.push(new Paragraph({ text: "" }));
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
      
      setProgress(85);
      
      try {
        // Usar Packer.toBlob para generar el documento
        const blob = await Packer.toBlob(doc);
        
        // Crear archivo Word con nombre descriptivo
        const docxFile = new File(
          [blob],
          `${file.name.replace('.pdf', '')}_convertido.docx`,
          { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
        );
        
        setConvertedFiles([docxFile]);
        
        setProgress(100);
        toast.success('PDF convertido a DOCX correctamente');
        
        return {
          success: true,
          files: [docxFile],
          message: 'PDF convertido a DOCX correctamente'
        };
      } catch (error) {
        console.error('Error al generar el archivo DOCX:', error);
        throw new Error('Error al generar el archivo DOCX');
      }
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
