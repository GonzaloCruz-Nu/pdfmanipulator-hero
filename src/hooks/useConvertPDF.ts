
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
      console.log('Iniciando conversión de PDF a DOCX...');

      // Cargar el PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);
      
      // Usar PDF.js para cargar el documento
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      console.log(`PDF cargado: ${pdf.numPages} páginas`);
      
      setProgress(30);
      
      const numPages = pdf.numPages;
      
      // Estructura para almacenar todo el contenido del PDF
      const allPageContent: Array<{
        text: string;
        pageNum: number;
      }> = [];
      
      // Extraer texto de todas las páginas del PDF
      for (let i = 1; i <= numPages; i++) {
        setProgress(30 + Math.floor((i / numPages) * 40));
        console.log(`Procesando página ${i} de ${numPages}`);
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extraer texto página por página
        const textItems = textContent.items
          .map((item: any) => 'str' in item ? item.str : '')
          .filter(Boolean);
        
        const pageText = textItems.join(' ');
        allPageContent.push({
          text: pageText,
          pageNum: i
        });
      }
      
      setProgress(70);
      console.log('Texto extraído, creando documento DOCX...');
      
      // Crear el documento DOCX
      const doc = new Document({
        title: file.name.replace('.pdf', ''),
        description: 'Documento convertido de PDF a DOCX',
        sections: [{
          properties: {},
          children: [
            // Título del documento
            new Paragraph({
              text: `Documento: ${file.name.replace('.pdf', '')}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            
            // Información de conversión
            new Paragraph({
              text: `Convertido de PDF a DOCX - ${numPages} páginas`,
              alignment: AlignmentType.CENTER,
            }),
            
            new Paragraph({ text: "" }),
            
            // Contenido de las páginas
            ...allPageContent.flatMap(({ text, pageNum }) => [
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
              }),
              
              new Paragraph({ text: "" }),
              
              // Contenido de la página
              new Paragraph({
                text: text,
              }),
              
              // Espacio entre páginas
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
            ]),
          ],
        }],
      });
      
      setProgress(85);
      console.log('Generando archivo DOCX...');
      
      // Generar el blob del documento
      const blob = await Packer.toBlob(doc);
      console.log('Blob generado, tamaño:', blob.size);
      
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
