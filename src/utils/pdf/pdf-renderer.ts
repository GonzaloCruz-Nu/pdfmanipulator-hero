
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
  useHighQualityRendering: boolean = false
): Promise<void> {
  try {
    // Obtener viewport con escala ajustada
    const viewport = pdfPage.getViewport({ scale: scaleFactor });
    
    // Configurar dimensiones del canvas
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Para niveles de baja y media compresión, usar un DPI más bajo pero controlado
    if (useHighQualityRendering) {
      // Usar un DPI moderado para equilibrar calidad y tamaño
      const dpr = 1.5; // Reducido de 2 a 1.5 para controlar tamaño
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
    if (useHighQualityRendering && ctx) {
      // Aplicar configuraciones para mejorar la calidad visual
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium'; // Cambiado de 'high' a 'medium' para mejor compresión
      
      // Si estamos usando DPI escalado, ajustar el contexto
      const dpr = 1.5; // Reducido de 2 a 1.5 para controlar tamaño
      ctx.scale(dpr, dpr);
    }
    
    // Fondo blanco para eliminar transparencia y mejorar compresión
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Configurar opciones de renderizado
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      // Optimizaciones para texto
      intent: useHighQualityRendering ? 'display' : 'display', // Cambiado de 'print' a 'display' para mejor compresión
      renderInteractiveForms: false, // Cambiado a false para mejorar compresión
      canvasFactory: undefined,
      textLayer: null,
      annotationStorage: undefined,
      annotationMode: undefined,
      imageLayer: undefined,
      printAnnotationStorage: undefined,
      optionalContentConfigPromise: undefined,
      renderingIntent: undefined
    };
    
    // Renderizar página
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
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileArrayBuffer) });
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error al cargar documento PDF:', error);
    throw error;
  }
}
