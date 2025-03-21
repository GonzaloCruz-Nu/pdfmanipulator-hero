
import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument, rgb } from 'pdf-lib';
import { extractTextFromPDF } from '@/utils/pdf/pdfTextExtractor';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
import { verificarContenidoExtraible } from '@/utils/pdf/fileOperations';

// Ensure PDF.js worker is set
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TranslationResult {
  success: boolean;
  file: File | null;
  message: string;
}

export const useTranslatePDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedFile, setTranslatedFile] = useState<File | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Divide el texto en chunks para no exceder los límites de la API de OpenAI
   */
  const splitTextIntoChunks = (text: string, maxChunkSize: number = 4000): string[] => {
    const chunks: string[] = [];
    let currentChunk = '';
    
    // Dividir por párrafos primero
    const paragraphs = text.split(/\n\s*\n/);
    
    for (const paragraph of paragraphs) {
      // Si el párrafo es demasiado grande, dividirlo por oraciones
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = sentence;
            } else {
              // Si una oración es más larga que maxChunkSize, dividirla por palabras
              if (sentence.length > maxChunkSize) {
                let sentenceChunk = '';
                const words = sentence.split(' ');
                
                for (const word of words) {
                  if (sentenceChunk.length + word.length + 1 <= maxChunkSize) {
                    sentenceChunk += (sentenceChunk ? ' ' : '') + word;
                  } else {
                    chunks.push(sentenceChunk);
                    sentenceChunk = word;
                  }
                }
                
                if (sentenceChunk) {
                  currentChunk = sentenceChunk;
                }
              } else {
                chunks.push(sentence);
              }
            }
          }
        }
      } else {
        // Añadir el párrafo si cabe en el chunk actual
        if (currentChunk.length + paragraph.length + 2 <= maxChunkSize) {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        } else {
          chunks.push(currentChunk);
          currentChunk = paragraph;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  /**
   * Procesa texto con OCR utilizando la API de OpenAI
   */
  const processOCRWithOpenAI = async (imageData: string | ArrayBuffer, apiKey: string): Promise<string> => {
    try {
      // Convertir imageData a base64 si es ArrayBuffer
      let base64Image;
      if (imageData instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(imageData);
        const binary = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        base64Image = btoa(binary);
      } else {
        // Ya es base64
        base64Image = imageData.split(',')[1];
      }

      console.log(`Enviando imagen para OCR (tamaño aproximado: ${Math.round(base64Image.length / 1024)} KB)`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Modelo con capacidad OCR
          messages: [
            {
              role: 'system',
              content: 'Eres un sistema de OCR preciso que extrae y transcribe texto de imágenes o documentos escaneados en español. Mantén exactamente el formato original con los espacios, saltos de línea y estructura del documento.'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extrae y transcribe TODO el texto visible de esta imagen o documento manteniendo el formato exacto. No omitas ningún texto visible, incluso si está en los bordes o es pequeño.' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
              ]
            }
          ],
          temperature: 0.2,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error respuesta API OpenAI (OCR):", errorData);
        throw new Error(`Error de API OCR: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("OCR completado correctamente");
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error(`Error en procesamiento OCR:`, error);
      throw error;
    }
  };

  /**
   * Traduce texto utilizando la API de OpenAI con lógica de reintento
   */
  const translateTextWithOpenAI = async (text: string, apiKey: string, retryCount = 0): Promise<string> => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second delay between retries
    
    try {
      console.log(`Enviando solicitud de traducción (${text.length} caracteres)`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres un traductor profesional de español a inglés. Traduce el siguiente texto manteniendo el formato exacto, incluyendo saltos de línea, viñetas, espacios y formateo. No agregues ni omitas información. No añades notas o clarificaciones. Mantén todos los números, símbolos y caracteres especiales exactamente como están en el original.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error respuesta API OpenAI:", errorData);
        throw new Error(`Error de API: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("Traducción recibida correctamente");
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error(`Error en traducción con OpenAI (intento ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // Implementar lógica de reintento
      if (retryCount < maxRetries) {
        console.log(`Reintentando en ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return translateTextWithOpenAI(text, apiKey, retryCount + 1);
      }
      
      throw error;
    }
  };

  /**
   * Convertir una página de PDF a imagen para OCR
   */
  const convertPdfPageToImage = async (pdfBytes: Uint8Array, pageNum: number): Promise<string> => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);
      
      // Ajustar la escala para obtener una imagen de buena calidad para OCR
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Crear un canvas para renderizar la página
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('No se pudo crear el contexto 2D');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Renderizar la página en el canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convertir el canvas a una imagen data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      return imageDataUrl;
    } catch (error) {
      console.error(`Error al convertir página ${pageNum} a imagen:`, error);
      throw error;
    }
  };

  /**
   * Procesa y traduce un archivo PDF
   */
  const translatePDF = async (file: File, apiKey: string, useOcr: boolean = false): Promise<TranslationResult> => {
    if (!file) {
      toast.error('Por favor selecciona un archivo PDF');
      return { success: false, file: null, message: 'No se seleccionó ningún archivo' };
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('El archivo seleccionado no es un PDF válido');
      return { success: false, file: null, message: 'El archivo no es un PDF válido' };
    }

    setLastError(null);

    try {
      setIsProcessing(true);
      setProgress(5);
      setTranslatedFile(null);
      console.log('Iniciando traducción de PDF...', file.name, 'Modo OCR:', useOcr);

      // Cargar PDF como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(10);

      // PASO 1: Extraer texto del PDF (con o sin OCR)
      let pageContents = [];
      let totalTextExtracted = 0;
      let numPages = 0;

      if (useOcr) {
        // ENFOQUE CON OCR
        console.log("Utilizando OCR para extraer texto...");
        try {
          // Cargar el documento para obtener el número de páginas
          const loadingTask = pdfjsLib.getDocument({ data: pdfData });
          const pdf = await loadingTask.promise;
          numPages = pdf.numPages;
          console.log(`PDF cargado: ${numPages} páginas`);
          
          // Procesar cada página con OCR
          pageContents = [];
          
          for (let i = 1; i <= numPages; i++) {
            console.log(`Procesando página ${i} con OCR...`);
            setProgress(10 + Math.floor((i / numPages) * 40));
            
            try {
              // Convertir página a imagen
              const imageDataUrl = await convertPdfPageToImage(pdfData, i);
              console.log(`Página ${i} convertida a imagen`);
              
              // Procesar imagen con OCR
              const extractedText = await processOCRWithOpenAI(imageDataUrl, apiKey);
              console.log(`OCR completado para página ${i}: ${extractedText.length} caracteres`);
              
              totalTextExtracted += extractedText.length;
              pageContents.push({
                text: extractedText,
                pageNum: i,
                hasImages: true,
                textItems: [] // No usamos textItems en modo OCR
              });
            } catch (pageError) {
              console.error(`Error en OCR para página ${i}:`, pageError);
              pageContents.push({
                text: `[Error en OCR para página ${i}]`,
                pageNum: i,
                hasImages: true,
                textItems: []
              });
            }
          }
          
        } catch (ocrError) {
          console.error("Error en procesamiento OCR:", ocrError);
          setLastError(`Error en OCR: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}`);
          throw new Error(`Error en procesamiento OCR: ${ocrError instanceof Error ? ocrError.message : 'Error desconocido'}`);
        }
      } else {
        // ENFOQUE TRADICIONAL (sin OCR)
        console.log("Extrayendo texto del PDF (método tradicional)...");
        try {
          const extractionResult = await extractTextFromPDF(
            pdfData,
            (newProgress) => setProgress(Math.min(10 + Math.floor(newProgress * 0.4), 50))
          );
          
          pageContents = extractionResult.pageContents;
          totalTextExtracted = extractionResult.totalTextExtracted;
          numPages = extractionResult.numPages;
          
          console.log(`Texto extraído: ${totalTextExtracted} caracteres en ${numPages} páginas`);
        } catch (extractError) {
          console.error("Error al extraer texto:", extractError);
          setLastError(`Error extracción: ${extractError instanceof Error ? extractError.message : String(extractError)}`);
          throw new Error(`Error al extraer texto: ${extractError instanceof Error ? extractError.message : 'Error desconocido'}`);
        }
      }
      
      // Verificar si se extrajo suficiente texto
      if (totalTextExtracted === 0) {
        const errorMsg = 'No se pudo extraer texto del PDF. Intente usar el modo OCR o con un documento PDF que contenga texto extraíble.';
        setLastError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Verificar calidad del contenido extraído
      const verificacion = verificarContenidoExtraible(file.size, totalTextExtracted);
      if (!verificacion.extraible && !useOcr) {
        console.warn(verificacion.mensaje);
        toast.warning(verificacion.mensaje + " Se recomienda usar el modo OCR para mejores resultados.");
      }
      
      setProgress(50);
      
      // PASO 2: TRADUCIR EL TEXTO
      console.log("Comenzando traducción de texto...");
      // Preparar texto para traducción manteniendo separación por páginas
      const textsByPage: string[] = pageContents.map(page => page.text);
      
      // Traducir cada página por separado para mantener la estructura
      const translatedTextsByPage: string[] = [];
      let failedPages = 0;
      
      for (let i = 0; i < textsByPage.length; i++) {
        const pageText = textsByPage[i];
        if (!pageText.trim()) {
          translatedTextsByPage.push(''); // Mantener páginas vacías
          continue;
        }
        
        // Dividir el texto de la página en fragmentos si es muy grande
        const chunks = splitTextIntoChunks(pageText);
        const translatedChunks: string[] = [];
        
        for (let j = 0; j < chunks.length; j++) {
          const chunk = chunks[j];
          console.log(`Traduciendo fragmento ${j + 1} de ${chunks.length} (página ${i + 1}): ${chunk.length} caracteres`);
          
          try {
            const translatedChunk = await translateTextWithOpenAI(chunk, apiKey);
            translatedChunks.push(translatedChunk);
          } catch (error) {
            console.error(`Error al traducir fragmento ${j + 1} de la página ${i + 1}:`, error);
            setLastError(`Error traducción: ${error instanceof Error ? error.message : String(error)}`);
            
            // Si falla, mantener el texto original para preservar el contenido
            translatedChunks.push(chunk);
            failedPages++;
            
            if (failedPages >= 3) {
              throw new Error('Demasiados errores consecutivos en la traducción. Inténtelo de nuevo más tarde.');
            }
          }
        }
        
        translatedTextsByPage.push(translatedChunks.join(' '));
        
        // Actualizar progreso basado en páginas procesadas
        const pageProgress = 50 + Math.floor(((i + 1) / numPages) * 40);
        setProgress(pageProgress);
      }
      
      console.log('Traducción completada, procesando documento final...');
      
      // PASO 3: GENERAR PDF FINAL
      try {
        console.log("Generando nuevo PDF con traducción...");
        // Use pdf-lib to load the original PDF
        const pdfDoc = await PDFDocument.load(pdfData);
        
        // Create a new PDF document that will contain the translated content
        const newPdfDoc = await PDFDocument.create();
        
        // Copy all pages from the original PDF to maintain all elements
        const pageIndices = [...Array(pdfDoc.getPageCount())].map((_, i) => i);
        console.log(`Copiando ${pageIndices.length} páginas del PDF original...`);
        
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
        console.log(`Páginas copiadas correctamente: ${copiedPages.length}`);
        
        // Add copied pages to the new document
        copiedPages.forEach(page => {
          newPdfDoc.addPage(page);
          console.log("Página agregada al nuevo documento");
        });
        
        // Load font for adding translated text
        console.log("Cargando fuente para el texto traducido...");
        const helveticaFont = await newPdfDoc.embedFont('Helvetica');
        
        // Add translated text to each page
        console.log(`Agregando texto traducido a ${translatedTextsByPage.length} páginas...`);
        for (let i = 0; i < Math.min(translatedTextsByPage.length, newPdfDoc.getPageCount()); i++) {
          const translatedText = translatedTextsByPage[i];
          if (!translatedText.trim()) continue;
          
          try {
            // Get current page from new document
            const page = newPdfDoc.getPage(i);
            console.log(`Procesando página ${i+1} para agregar traducción...`);
            
            // Add text overlay with translation in a semi-transparent white box
            // First draw a semi-transparent white background for better readability
            page.drawRectangle({
              x: 50,
              y: 50,
              width: page.getWidth() - 100,
              height: page.getHeight() - 100,
              color: rgb(1, 1, 1),  // White color
              opacity: 0.4,
              borderColor: rgb(0, 0, 0),
              borderWidth: 0,
            });
            
            // Add translated text
            page.drawText(translatedText, {
              x: 60,
              y: page.getHeight() - 60,
              size: 10,
              font: helveticaFont,
              color: rgb(0, 0, 0),  // Black text
              opacity: 1,
              lineHeight: 14,
              maxWidth: page.getWidth() - 120,
            });
            
            console.log(`Texto traducido agregado a la página ${i+1}`);
          } catch (pageError) {
            console.error(`Error al procesar la página ${i} para traducción:`, pageError);
            setLastError(`Error página ${i+1}: ${pageError instanceof Error ? pageError.message : String(pageError)}`);
            // Continue with other pages if one fails
          }
        }
        
        // Save the new PDF document
        console.log("Guardando PDF final...");
        const pdfBytes = await newPdfDoc.save();
        console.log(`PDF generado: ${pdfBytes.length} bytes`);
        
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        console.log("PDF Blob creado correctamente:", pdfBlob.size, "bytes");
        
        // Create file for download
        const translatedFileName = file.name.replace(/.pdf$/i, '_translated.pdf');
        const translatedFile = new File([pdfBlob], translatedFileName, { type: 'application/pdf' });
        console.log(`Archivo traducido creado: ${translatedFileName}`);
        
        setTranslatedFile(translatedFile);
        setProgress(100);
        toast.success('PDF traducido correctamente');
        
        return {
          success: true,
          file: translatedFile,
          message: 'PDF traducido correctamente'
        };
      } catch (pdfError) {
        console.error('Error al procesar el PDF final:', pdfError);
        setLastError(`Error PDF final: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
        throw new Error(`Error al generar el PDF final: ${pdfError instanceof Error ? pdfError.message : 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al traducir PDF:', error);
      toast.error('Error al traducir PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      
      return {
        success: false,
        file: null,
        message: 'Error al traducir PDF: ' + (error instanceof Error ? error.message : 'Error desconocido')
      };
    } finally {
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  /**
   * Descargar el archivo PDF traducido
   */
  const downloadTranslatedFile = () => {
    if (!translatedFile) {
      toast.error('No hay archivo para descargar');
      return;
    }
    
    saveAs(translatedFile, translatedFile.name);
    toast.success('Archivo descargado correctamente');
  };

  return {
    translatePDF,
    isProcessing,
    progress,
    translatedFile,
    downloadTranslatedFile,
    lastError
  };
};
