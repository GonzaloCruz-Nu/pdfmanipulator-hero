
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
    
    // Para niveles de baja y media compresión, usar un DPI ajustado extremadamente alto
    if (useHighQualityRendering) {
      // Usar un DPI extremadamente elevado para máxima calidad de texto e imágenes
      const dpr = Math.max(window.devicePixelRatio || 1, 20.0); // Aumentado a 20.0x DPR para máxima nitidez
      const scaledWidth = Math.floor(viewport.width * dpr);
      const scaledHeight = Math.floor(viewport.height * dpr);
      
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
    } else {
      // Incluso para alta compresión mejoramos la resolución base
      const dpr = Math.max(window.devicePixelRatio || 1, 4.0);
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }
    
    // Configurar calidad de renderizado
    if (useHighQualityRendering) {
      // Aplicar configuraciones para mejorar la calidad visual
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Si estamos usando DPI escalado, ajustar el contexto
      if (canvas.width > viewport.width) {
        const scale = canvas.width / viewport.width;
        ctx.scale(scale, scale);
      }
      
      // Ajustes adicionales para mejorar la nitidez del texto
      ctx.textBaseline = 'middle';
      ctx.font = 'normal 400 12px sans-serif';
    } else {
      // Incluso en modo de alta compresión, mantener buena calidad
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Ajustar el contexto para la mayor resolución
      const scale = canvas.width / viewport.width;
      ctx.scale(scale, scale);
    }
    
    // Fondo blanco para eliminar transparencia y mejorar compresión
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    
    // Configurar opciones de renderizado avanzadas para máxima calidad
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      // Optimizaciones para texto
      intent: textMode, // 'print' produce mejor calidad de texto
      renderInteractiveForms: true, // Renderizar formularios interactivos
      canvasFactory: undefined,
      textLayer: null,
      annotationStorage: undefined,
      annotationMode: 2, // ENABLE para preservar anotaciones
      imageLayer: undefined,
      printAnnotationStorage: undefined,
      optionalContentConfigPromise: undefined,
      renderingIntent: 'print', // Forzar siempre modo print para máxima calidad de texto
      enableScripting: false, // Desactivar scripting para enfocarse en renderizado
      antialiasing: true // Habilitar antialiasing para mejor calidad
    };
    
    // Renderizar página con máxima calidad
    await pdfPage.render(renderContext).promise;
    
    // Aplicar ligero aumento de contraste para mejorar la legibilidad del texto
    if (useHighQualityRendering) {
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Mejora sutil de contraste para el texto
        for (let i = 0; i < data.length; i += 4) {
          // Filtrar solo para píxeles cercanos al texto (predominantemente negros)
          if (data[i] < 50 && data[i + 1] < 50 && data[i + 2] < 50) {
            // Oscurecer aún más el texto para mayor nitidez
            data[i] = Math.max(0, data[i] - 10);
            data[i + 1] = Math.max(0, data[i + 1] - 10);
            data[i + 2] = Math.max(0, data[i + 2] - 10);
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        console.warn('No se pudo aplicar mejora de contraste, continuando con renderizado normal');
      }
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
      useSystemFonts: true,  // Usar fuentes del sistema para mejor calidad
      useWorkerFetch: true,  // Usar worker para fetching
      disableFontFace: false, // Permitir uso de fuentes embebidas
      isEvalSupported: true,  // Habilitar eval para mejorar rendimiento
      verbosity: 0 // Reducir verbosidad para mejor rendimiento
    });
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error al cargar documento PDF:', error);
    throw error;
  }
}
