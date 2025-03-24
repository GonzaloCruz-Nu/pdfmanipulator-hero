
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
    
    // Configurar el DPI según el nivel de calidad
    let dpr = window.devicePixelRatio || 1;
    
    if (useHighQualityRendering) {
      // Alta calidad para niveles bajo y medio
      dpr = Math.max(dpr, textMode === 'print' ? 4.0 : 3.0);
    } else {
      // Menor calidad para nivel alto de compresión
      dpr = Math.max(dpr, 2.0);
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
    
    // Configurar calidad de renderizado
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = useHighQualityRendering ? 'high' : 'medium';
    
    // Fondo blanco para eliminar transparencia y mejorar compresión
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    
    // Configurar opciones de renderizado
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      intent: textMode, // 'print' para mejor calidad, 'display' para mejor compresión
      renderInteractiveForms: useHighQualityRendering,
      canvasFactory: undefined,
      textLayer: null,
      annotationStorage: undefined,
      annotationMode: useHighQualityRendering ? 2 : 0, // ENABLE o DISABLE según nivel
      imageLayer: undefined,
      printAnnotationStorage: undefined,
      optionalContentConfigPromise: undefined,
      renderingIntent: textMode, // Usar el mismo modo que intent
      enableScripting: false,
      antialiasing: useHighQualityRendering
    };
    
    // Renderizar página
    await pdfPage.render(renderContext).promise;
    
    // Aplicar mejora de contraste para texto solo en modos de alta calidad
    if (useHighQualityRendering && textMode === 'print') {
      try {
        const imageData = ctx.getImageData(0, 0, viewport.width, viewport.height);
        const data = imageData.data;
        
        // Aplicar mejora básica de contraste para texto
        for (let i = 0; i < data.length; i += 4) {
          // Mejorar contraste solo para píxeles oscuros (posible texto)
          if (data[i] < 100 && data[i + 1] < 100 && data[i + 2] < 100) {
            data[i] = Math.max(0, data[i] - 15);
            data[i + 1] = Math.max(0, data[i + 1] - 15);
            data[i + 2] = Math.max(0, data[i + 2] - 15);
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        console.warn('No se pudo aplicar mejora de contraste');
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
      useSystemFonts: true,
      useWorkerFetch: true,
      disableFontFace: false,
      isEvalSupported: true,
      verbosity: 0
    });
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error al cargar documento PDF:', error);
    throw error;
  }
}
