import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument, rgb } from 'pdf-lib';
import { extractTextFromPDF } from '@/utils/pdf/pdfTextExtractor';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';

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
   * Traduce texto utilizando la API de OpenAI con lógica de reintento
   */
  const translateTextWithOpenAI = async (text: string, apiKey: string, retryCount = 0): Promise<string> => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second delay between retries
    
    try {
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
        throw new Error(`Error de API: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
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
   * Procesa y traduce un archivo PDF
   */
  const translatePDF = async (file: File, apiKey: string): Promise<TranslationResult> => {
    if (!file) {
      toast.error('Por favor selecciona un archivo PDF');
      return { success: false, file: null, message: 'No se seleccionó ningún archivo' };
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('El archivo seleccionado no es un PDF válido');
      return { success: false, file: null, message: 'El archivo no es un PDF válido' };
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setTranslatedFile(null);
      console.log('Iniciando traducción de PDF...', file.name);

      // Cargar PDF como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);

      // Extraer texto del PDF manteniendo la información de posición
      const { pageContents, totalTextExtracted, numPages } = await extractTextFromPDF(
        pdfData,
        (newProgress) => setProgress(Math.min(20 + Math.floor(newProgress * 0.3), 50))
      );
      
      setProgress(50);
      console.log(`Texto extraído: ${totalTextExtracted} caracteres en ${numPages} páginas`);
      
      if (totalTextExtracted === 0) {
        throw new Error('No se pudo extraer texto del PDF. Es posible que sea un documento escaneado sin OCR.');
      }
      
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
      
      // ---- IMPROVED PDF GENERATION APPROACH ----
      try {
        // Use pdf-lib to load the original PDF
        const pdfDoc = await PDFDocument.load(pdfData);
        
        // Create a new PDF document that will contain the translated content
        const newPdfDoc = await PDFDocument.create();
        
        // Copy all pages from the original PDF to maintain all elements
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, [...Array(pdfDoc.getPageCount())].map((_, i) => i));
        copiedPages.forEach(page => newPdfDoc.addPage(page));
        
        // Load font for adding translated text
        const helveticaFont = await newPdfDoc.embedFont('Helvetica');
        
        // Get text positions from original PDF for proper text placement
        for (let i = 0; i < translatedTextsByPage.length && i < newPdfDoc.getPageCount(); i++) {
          const translatedText = translatedTextsByPage[i];
          if (!translatedText.trim()) continue;
          
          try {
            // Get current page from new document
            const page = newPdfDoc.getPage(i);
            
            // Add text overlay with translation in a semi-transparent white box
            // First draw a semi-transparent white background for better readability
            page.drawRectangle({
              x: 50,
              y: 50,
              width: page.getWidth() - 100,
              height: page.getHeight() - 100,
              color: rgb(1, 1, 1, 0.4),  // White with 40% opacity
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
          } catch (pageError) {
            console.error(`Error al procesar la página ${i} para traducción:`, pageError);
            // Continue with other pages if one fails
          }
        }
        
        // Save the new PDF document
        const pdfBytes = await newPdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Create file for download
        const translatedFileName = file.name.replace(/.pdf$/i, '_translated.pdf');
        const translatedFile = new File([pdfBlob], translatedFileName, { type: 'application/pdf' });
        
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
    downloadTranslatedFile
  };
};
