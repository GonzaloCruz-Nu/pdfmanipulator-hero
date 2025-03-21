
import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { extractTextFromPDF } from '@/utils/pdf/pdfTextExtractor';
import { saveAs } from 'file-saver';

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
   * Traduce texto utilizando la API de OpenAI
   */
  const translateTextWithOpenAI = async (text: string, apiKey: string): Promise<string> => {
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
              content: 'Eres un traductor profesional de español a inglés. Traduce el siguiente texto manteniendo el formato, incluyendo saltos de línea, viñetas y formateo. No agregues ni omitas información. No añadas notas o clarificaciones.'
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
      console.error('Error en traducción con OpenAI:', error);
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

    try {
      setIsProcessing(true);
      setProgress(10);
      setTranslatedFile(null);
      console.log('Iniciando traducción de PDF...', file.name);

      // Cargar PDF como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);

      // Extraer texto del PDF usando la utilidad existente
      const { pageContents, totalTextExtracted, numPages } = await extractTextFromPDF(
        pdfData,
        (newProgress) => setProgress(Math.min(20 + Math.floor(newProgress * 0.3), 50))
      );
      
      setProgress(50);
      console.log(`Texto extraído: ${totalTextExtracted} caracteres en ${numPages} páginas`);
      
      if (totalTextExtracted === 0) {
        throw new Error('No se pudo extraer texto del PDF. Es posible que sea un documento escaneado sin OCR.');
      }
      
      // Preparar texto para traducción
      const allTexts: string[] = [];
      for (const page of pageContents) {
        allTexts.push(page.text);
      }
      
      const combinedText = allTexts.join('\n\n--- NUEVA PÁGINA ---\n\n');
      const textChunks = splitTextIntoChunks(combinedText);
      console.log(`Texto dividido en ${textChunks.length} fragmentos para traducción`);
      
      // Traducir cada fragmento de texto
      const translatedChunks: string[] = [];
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        console.log(`Traduciendo fragmento ${i + 1} de ${textChunks.length}: ${chunk.length} caracteres`);
        
        const translatedChunk = await translateTextWithOpenAI(chunk, apiKey);
        translatedChunks.push(translatedChunk);
        
        // Actualizar progreso basado en la cantidad de fragmentos procesados
        const chunkProgress = 50 + Math.floor(((i + 1) / textChunks.length) * 40);
        setProgress(chunkProgress);
      }
      
      // Combinar texto traducido
      const translatedText = translatedChunks.join('\n\n');
      console.log('Traducción completada, procesando documento final...');
      
      // Crear un nuevo PDF con el texto traducido
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont('Helvetica');
      
      // Dividir el texto traducido de nuevo en páginas
      const translatedPages = translatedText.split('--- NUEVA PÁGINA ---');
      
      for (const pageText of translatedPages) {
        const page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();
        const fontSize = 11;
        const lineHeight = fontSize * 1.2;
        const margin = 50;
        
        // Dibujar texto en la página
        page.drawText(pageText.trim(), {
          x: margin,
          y: height - margin,
          size: fontSize,
          font: helveticaFont,
          maxWidth: width - margin * 2,
          lineHeight: lineHeight
        });
      }
      
      // Guardar documento PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Crear archivo para descarga
      const translatedFileName = file.name.replace('.pdf', '_translated.pdf');
      const translatedFile = new File([pdfBlob], translatedFileName, { type: 'application/pdf' });
      
      setTranslatedFile(translatedFile);
      setProgress(100);
      toast.success('PDF traducido correctamente');
      
      return {
        success: true,
        file: translatedFile,
        message: 'PDF traducido correctamente'
      };
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
