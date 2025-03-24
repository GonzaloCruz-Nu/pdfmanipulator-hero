
import * as pdfjsLib from 'pdfjs-dist';

// Configurar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Renderiza una página de PDF en un canvas con configuraciones optimizadas
 * @param pdfPage La página PDF que se renderizará
 * @param canvas El elemento canvas donde se renderizará
 * @param scaleFactor Factor de escala para la renderización
 * @param useHighQualityRendering Si se debe usar configuración de alta calidad
 */
export async function renderPageToCanvas(
  pdfPage: pdfjsLib.PDFPageProxy, 
  canvas: HTMLCanvasElement, 
  scaleFactor: number,
  useHighQualityRendering: boolean = false,
  textMode: 'print' | 'display' = 'display'
): Promise<void> {
  try {
    // Obtener viewport con escala ajustada
    const viewport = pdfPage.getViewport({ scale: scaleFactor });
    
    // Configurar dimensiones del canvas
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Para niveles de baja y media compresión, usar un DPI ajustado
    if (useHighQualityRendering) {
      // Usar un DPI elevado para mejorar calidad de texto
      const dpr = Math.max(window.devicePixelRatio || 1, 4.0); // Aumentado a 4.0x DPR para calidad superior
      const scaledWidth = Math.floor(viewport.width * dpr);
      const scaledHeight = Math.floor(viewport.height * dpr);
      
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
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
    }
    
    // Fondo blanco para eliminar transparencia y mejorar compresión
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Configurar opciones de renderizado avanzadas
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
      renderingIntent: 'print' // Forzar siempre modo print para máxima calidad de texto
    };
    
    // Renderizar página con máxima calidad
    await pdfPage.render(renderContext).promise;
  } catch (error) {
    console.error('Error al renderizar página en canvas:', error);
    throw error;
  }
}

/**
 * Carga un documento PDF desde un ArrayBuffer usando PDF.js
 */
export async function loadPdfDocument(fileArrayBuffer: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  try {
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(fileArrayBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.8.162/cmaps/',
      cMapPacked: true,
      useSystemFonts: true,  // Usar fuentes del sistema para mejor calidad
      useWorkerFetch: true,  // Usar worker para fetching
      disableFontFace: false, // Permitir uso de fuentes embebidas
      isEvalSupported: true,  // Habilitar eval para mejorar rendimiento
    });
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error al cargar documento PDF:', error);
    throw error;
  }
}
