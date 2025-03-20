
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PageContent {
  text: string;
  pageNum: number;
}

/**
 * Extraer contenido de texto de un archivo PDF
 */
export const extractTextFromPDF = async (
  pdfData: Uint8Array, 
  onProgressUpdate: (progress: number) => void
): Promise<{ 
  pageContents: PageContent[], 
  totalTextExtracted: number, 
  numPages: number 
}> => {
  try {
    // Cargar el documento PDF con opciones de tolerancia a errores
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      disableFontFace: false,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/',
      cMapPacked: true,
      useSystemFonts: true, // Permitir fuentes del sistema
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF cargado: ${pdf.numPages} páginas`);
    
    onProgressUpdate(30);
    
    const numPages = pdf.numPages;
    
    // Estructura para almacenar todo el contenido del PDF
    const pageContents: PageContent[] = [];
    let totalTextExtracted = 0;
    
    // Extraer texto de todas las páginas del PDF con mejor manejo
    for (let i = 1; i <= numPages; i++) {
      onProgressUpdate(30 + Math.floor((i / numPages) * 40));
      console.log(`Procesando página ${i} de ${numPages}`);
      
      try {
        const page = await pdf.getPage(i);
        
        // Modo de extracción de texto mejorado con opciones compatibles
        const textContent = await page.getTextContent({
          // Solo usar propiedades válidas según la API de PDF.js
          includeMarkedContent: true,
        });
        
        // Extraer texto página por página con mejor manejo de espacios y saltos de línea
        let pageText = '';
        let lastY = null;
        let lastX = null;
        
        if (textContent.items.length === 0) {
          console.log(`Página ${i}: Sin texto extraíble. Podría ser una imagen.`);
          pageText = `[Esta página parece contener solo imágenes o gráficos sin texto extraíble]`;
        } else {
          for (const item of textContent.items) {
            if (!('str' in item) || typeof item.str !== 'string') continue;
            
            const text = item.str;
            const x = item.transform?.[4] || 0; // Posición X
            const y = item.transform?.[5] || 0; // Posición Y
            
            // Detectar saltos de línea basados en la posición Y
            if (lastY !== null && Math.abs(y - lastY) > 3) {
              // Es un cambio de línea significativo
              pageText += '\n';
            } 
            // Detectar espacios entre palabras basados en la posición X
            else if (lastX !== null && x - lastX > 10) {
              // Hay un espacio horizontal significativo
              if (!pageText.endsWith(' ') && !text.startsWith(' ')) {
                pageText += ' ';
              }
            }
            
            pageText += text;
            lastY = y;
            lastX = x + (item.width || 0);
          }
        }
        
        // Método avanzado para obtener operadores de contenido
        try {
          const opList = await page.getOperatorList();
          // Análisis básico para detectar si hay contenido que no es texto
          const hasImages = opList.fnArray.some(op => op === pdfjsLib.OPS.paintImageXObject);
          
          if (hasImages && pageText.trim().length < 100) {
            console.log(`Página ${i}: Contiene imágenes pero poco texto extraíble.`);
            if (pageText.trim().length === 0) {
              pageText = `[Esta página contiene imágenes sin texto extraíble]`;
            }
          }
        } catch (opError) {
          console.warn(`No se pudieron obtener operadores para la página ${i}:`, opError);
        }
        
        // Mejora: Renderizar a canvas como respaldo para páginas sin texto
        if (pageText.trim().length < 50) {
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
              
              console.log(`Página ${i}: Renderizada en canvas como respaldo`);
              
              // Nota informativa en el texto
              if (pageText.trim().length === 0) {
                pageText = `[Página ${i}: Esta página parece contener principalmente imágenes o gráficos]`;
              }
            }
          } catch (canvasError) {
            console.warn(`Error al renderizar la página ${i} en canvas:`, canvasError);
          }
        }
        
        // Limpiar espacios en blanco excesivos
        pageText = pageText
          .replace(/\s+/g, ' ')  // Convertir múltiples espacios en uno
          .replace(/\n\s+/g, '\n')  // Eliminar espacios al principio de las líneas
          .replace(/\s+\n/g, '\n')  // Eliminar espacios al final de las líneas
          .replace(/\n{3,}/g, '\n\n'); // Limitar múltiples saltos de línea a máximo 2
        
        console.log(`Página ${i}: Extraídos aproximadamente ${pageText.length} caracteres`);
        totalTextExtracted += pageText.length;
        
        pageContents.push({
          text: pageText,
          pageNum: i
        });
      } catch (pageError) {
        console.error(`Error al procesar la página ${i}:`, pageError);
        // En lugar de fallar, agregamos una página con un mensaje de error
        pageContents.push({
          text: `[Error en la página ${i}: No se pudo extraer el contenido. Posible imagen o contenido escaneado.]`,
          pageNum: i
        });
      }
    }
    
    return {
      pageContents,
      totalTextExtracted,
      numPages
    };
  } catch (error) {
    console.error("Error al extraer texto del PDF:", error);
    throw error;
  }
};
