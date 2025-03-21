
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PageContent {
  text: string;
  pageNum: number;
  hasImages: boolean;
  textItems: TextItem[];
}

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
}

/**
 * Extraer contenido de texto de un archivo PDF con formato mejorado
 */
export const extractTextFromPDF = async (
  pdfData: Uint8Array, 
  onProgressUpdate: (progress: number) => void
): Promise<{ 
  pageContents: PageContent[], 
  totalTextExtracted: number, 
  numPages: number,
  documentTitle: string | null
}> => {
  try {
    // Inicializar progreso
    onProgressUpdate(10);
    
    console.log('Iniciando extracción de texto del PDF');
    
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
    let documentTitle = null;
    
    // Intentar obtener metadatos del documento
    try {
      const metadata = await pdf.getMetadata();
      if (metadata && metadata.info) {
        // Acceder a la propiedad Title de manera segura
        const info = metadata.info as Record<string, unknown>;
        if (info && 'Title' in info && typeof info['Title'] === 'string') {
          documentTitle = info['Title'];
        }
      }
      console.log('Metadatos extraídos:', documentTitle ? `Título: ${documentTitle}` : 'Sin título');
    } catch (metadataError) {
      console.warn("No se pudieron obtener los metadatos del PDF:", metadataError);
    }
    
    // Estructura para almacenar todo el contenido del PDF
    const pageContents: PageContent[] = [];
    let totalTextExtracted = 0;
    
    // Extraer texto de todas las páginas del PDF con mejor manejo
    for (let i = 1; i <= numPages; i++) {
      const progressPercent = 30 + Math.floor((i / numPages) * 60);
      onProgressUpdate(progressPercent);
      console.log(`Procesando página ${i} de ${numPages} (${progressPercent}%)`);
      
      try {
        const page = await pdf.getPage(i);
        
        // Modo de extracción de texto mejorado con opciones compatibles
        const textContent = await page.getTextContent({
          includeMarkedContent: true,
        });
        
        // Extraer texto página por página con mejor manejo de espacios y saltos de línea
        let pageText = '';
        let lastY = null;
        let lastX = null;
        let hasImages = false;
        const textItems: TextItem[] = [];
        
        if (textContent.items.length === 0) {
          console.log(`Página ${i}: Sin texto extraíble. Podría ser una imagen.`);
          pageText = `[Esta página parece contener solo imágenes o gráficos sin texto extraíble]`;
        } else {
          // Procesar los items de texto con mejor detección de formato
          for (const item of textContent.items) {
            // Verificar si el ítem tiene la propiedad 'str' (texto)
            if (!('str' in item) || typeof item.str !== 'string') continue;
            
            const text = item.str;
            
            // Acceder a las propiedades transform de manera más segura
            const transform = 'transform' in item ? item.transform : null;
            const x = transform && transform.length >= 5 ? transform[4] : 0;
            const y = transform && transform.length >= 6 ? transform[5] : 0;
            
            const width = 'width' in item ? (typeof item.width === 'number' ? item.width : 0) : 0;
            const height = 'height' in item ? (typeof item.height === 'number' ? item.height : 10) : 10;
            
            // Detectar propiedades de fuente
            let fontSize = 12; // Valor predeterminado
            let fontFamily = 'default';
            let isBold = false;
            let isItalic = false;
            
            if ('fontName' in item && typeof item.fontName === 'string') {
              const fontName = item.fontName || '';
              fontFamily = fontName.split('+').pop() || 'default';
              isBold = fontName.toLowerCase().includes('bold');
              isItalic = fontName.toLowerCase().includes('italic') || fontName.toLowerCase().includes('oblique');
            }
            
            if ('fontSize' in item) {
              fontSize = typeof item.fontSize === 'number' ? item.fontSize : 12;
            }
            
            // Guardar información del item de texto para la generación del DOCX
            textItems.push({
              text,
              x,
              y,
              width,
              height,
              fontSize,
              fontFamily,
              isBold,
              isItalic
            });
            
            // Detectar saltos de línea basados en la posición Y
            if (lastY !== null && Math.abs(y - lastY) > Math.max(3, fontSize * 0.3)) {
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
            lastX = x + width;
          }
        }
        
        // Detectar imágenes a través de operadores de contenido
        try {
          const opList = await page.getOperatorList();
          // Verificar si el objeto opList tiene la propiedad fnArray
          if (opList && 'fnArray' in opList && Array.isArray(opList.fnArray)) {
            // Verificar si existe OPS en pdfjsLib
            const OPS = 'OPS' in pdfjsLib ? pdfjsLib.OPS : null;
            
            if (OPS && 'paintImageXObject' in OPS) {
              hasImages = opList.fnArray.some(op => op === OPS.paintImageXObject);
            } else {
              // Si no podemos acceder directamente a OPS, asumimos que hay imágenes
              // si hay operadores de tipo pintar (típicamente tienen valores > 90)
              hasImages = opList.fnArray.some(op => op > 90);
            }
            
            if (hasImages && pageText.trim().length < 100) {
              console.log(`Página ${i}: Contiene imágenes pero poco texto extraíble.`);
              if (pageText.trim().length === 0) {
                pageText = `[Esta página contiene imágenes sin texto extraíble]`;
              }
            }
          }
        } catch (opError) {
          console.warn(`No se pudieron obtener operadores para la página ${i}:`, opError);
        }
        
        // Limpiar espacios en blanco excesivos
        pageText = pageText
          .replace(/\s+/g, ' ')  // Convertir múltiples espacios en uno
          .replace(/\n\s+/g, '\n')  // Eliminar espacios al principio de las líneas
          .replace(/\s+\n/g, '\n')  // Eliminar espacios al final de las líneas
          .replace(/\n{3,}/g, '\n\n'); // Limitar múltiples saltos de línea a máximo 2
        
        console.log(`Página ${i}: Extraídos aproximadamente ${pageText.length} caracteres. Contiene imágenes: ${hasImages}`);
        totalTextExtracted += pageText.length;
        
        pageContents.push({
          text: pageText,
          pageNum: i,
          hasImages,
          textItems
        });
      } catch (pageError) {
        console.error(`Error al procesar la página ${i}:`, pageError);
        // En lugar de fallar, agregamos una página con un mensaje de error
        pageContents.push({
          text: `[Error en la página ${i}: No se pudo extraer el contenido. Posible imagen o contenido escaneado.]`,
          pageNum: i,
          hasImages: true,
          textItems: []
        });
      }
    }
    
    console.log(`Extracción de texto finalizada. Total de páginas: ${numPages}, caracteres extraídos: ${totalTextExtracted}`);
    onProgressUpdate(100);
    
    return {
      pageContents,
      totalTextExtracted,
      numPages,
      documentTitle
    };
  } catch (error) {
    console.error("Error al extraer texto del PDF:", error);
    throw error;
  }
};

/**
 * Función auxiliar para detectar títulos y encabezados en el texto
 */
export const detectHeadings = (text: string): { isHeading: boolean; level: 1 | 2 | 3 | null } => {
  // Texto muy corto sin puntuación al final suele ser un título
  if (text.length < 100 && 
      !text.trim().endsWith('.') && 
      !text.trim().endsWith(',') &&
      !text.trim().endsWith(':') &&
      !text.trim().endsWith(';') &&
      text.trim().length > 0) {
    
    // Detectar el nivel de encabezado
    if (text.length < 30 && /^[A-Z0-9ÁÉÍÓÚÑ]/.test(text)) {
      return { isHeading: true, level: 1 }; // Encabezado principal
    } else if (text.length < 50) {
      return { isHeading: true, level: 2 }; // Subencabezado
    } else {
      return { isHeading: true, level: 3 }; // Encabezado menor
    }
  }
  
  return { isHeading: false, level: null }; // Texto normal
};
