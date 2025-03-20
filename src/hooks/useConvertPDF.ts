
import { useState } from 'react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';

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
        
        // Crear un documento de Word
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: []
            }
          ]
        });
        
        // Procesar cada página del PDF
        for (let i = 1; i <= numPages; i++) {
          setProgress(40 + Math.floor((i / numPages) * 40));
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const textItems = textContent.items.map((item: any) => 
            'str' in item ? item.str : '');
          const text = textItems.join(' ');
          
          // Agregar el texto al documento Word
          doc.addSection({
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Página ${i}`,
                    bold: true
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: text
                  })
                ]
              })
            ]
          });
        }
        
        setProgress(80);
        
        // Generar el archivo DOCX
        const buffer = await Packer.toBuffer(doc);
        const docxBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        // Crear archivo Word
        const docxFile = new File(
          [docxBlob],
          `${file.name.replace('.pdf', '')}.docx`,
          { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
        );
        
        resultFiles.push(docxFile);
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
