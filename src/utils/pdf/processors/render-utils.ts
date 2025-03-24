
import * as pdfjsLib from 'pdfjs-dist';

/**
 * Renderiza una página de PDF en un canvas con configuraciones optimizadas
 * @param pdfPage La página PDF que se renderizará
 * @param canvas El elemento canvas donde se renderizará
 * @param scaleFactor Factor de escala para la renderización
 * @param useHighQualityRendering Si se debe usar configuración de alta calidad
 * @param textMode Modo de renderizado para texto ('print' o 'display')
 */
export async function renderPageToCanvasWithOptions(
  pdfPage: pdfjsLib.PDFPageProxy, 
  canvas: HTMLCanvasElement, 
  scaleFactor: number,
  useHighQualityRendering: boolean = false,
  textMode: 'print' | 'display' = 'display'
): Promise<void> {
  try {
    // Obtener viewport con escala ajustada
    const viewport = pdfPage.getViewport({ scale: scaleFactor });
    
    // Configurar el DPI según el nivel de calidad - VALORES AUMENTADOS PARA MEJOR CALIDAD
    let dpr = window.devicePixelRatio || 1;
    
    if (useHighQualityRendering) {
      // Alta calidad para niveles bajo y medio - AUMENTADO
      dpr = Math.max(dpr, textMode === 'print' ? 6.0 : 5.0); // Valores anteriores: 4.0 y 3.0
    } else {
      // Para nivel alto de compresión - TAMBIÉN AUMENTADO
      dpr = Math.max(dpr, 3.0); // Valor anterior: 2.0
    }
    
    // Ajustar dimensiones del canvas
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }
    
    // Aplicar escalado
    ctx.scale(dpr, dpr);
    
    // Configurar calidad de renderizado - SIEMPRE USAR ALTA CALIDAD
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high'; // Siempre usar high independientemente del nivel
    
    // Fondo blanco para eliminar transparencia y mejorar compresión
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    
    // Configurar opciones de renderizado con calidad mejorada
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      intent: 'print', // Siempre usar 'print' para mejor calidad de texto
      renderInteractiveForms: true, // Siempre true para mejor calidad
      canvasFactory: undefined,
      textLayer: null,
      annotationStorage: undefined,
      annotationMode: 2, // Siempre ENABLE para mejor calidad
      imageLayer: undefined,
      printAnnotationStorage: undefined,
      optionalContentConfigPromise: undefined,
      renderingIntent: 'print', // Siempre 'print' para mejor calidad
      enableScripting: false,
      antialiasing: true // Siempre habilitado para todos los niveles
    };
    
    // Renderizar página
    await pdfPage.render(renderContext).promise;
    
    // Aplicar mejora de contraste para texto para todos los modos
    try {
      const imageData = ctx.getImageData(0, 0, viewport.width, viewport.height);
      const data = imageData.data;
      
      // Aplicar mejora adaptativa de contraste para mejorar la legibilidad del texto
      for (let i = 0; i < data.length; i += 4) {
        // Detectar píxeles de texto (oscuros sobre fondo claro)
        if (data[i] < 150 && data[i + 1] < 150 && data[i + 2] < 150) {
          // Es posible texto - mejorar contraste pero mantener color
          const darknessFactor = (data[i] + data[i + 1] + data[i + 2]) / 3 < 50 ? 1.2 : 1.1;
          
          // Oscurecer texto para mejor legibilidad
          data[i] = Math.max(0, Math.min(255, Math.floor(data[i] / darknessFactor)));
          data[i + 1] = Math.max(0, Math.min(255, Math.floor(data[i + 1] / darknessFactor)));
          data[i + 2] = Math.max(0, Math.min(255, Math.floor(data[i + 2] / darknessFactor)));
        }
        
        // Mejorar nitidez de contornos de texto y bordes
        // Este código es muy costoso, solo aplicarlo si realmente se requiere
        // if (i % 16 === 0 && i > canvas.width * 4 && i < data.length - canvas.width * 4) {
        //   // Comparar con píxeles circundantes para detectar bordes
        //   // ... código de mejora de nitidez adaptativa
        // }
      }
      
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      console.warn('No se pudo aplicar mejora de contraste:', e);
    }
  } catch (error) {
    console.error('Error al renderizar página en canvas:', error);
    throw error;
  }
}

/**
 * Carga un documento PDF desde un ArrayBuffer usando PDF.js
 * @param fileArrayBuffer ArrayBuffer con los datos del PDF
 * @returns Documento PDF
 */
export async function loadPdfDocumentFromArray(fileArrayBuffer: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  try {
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(fileArrayBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.8.162/cmaps/',
      cMapPacked: true,
      useSystemFonts: true,
      useWorkerFetch: true,
      disableFontFace: false,
      isEvalSupported: true,
      verbosity: 1  // Aumentado para más información de diagnóstico
    });
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error al cargar documento PDF:', error);
    throw error;
  }
}
