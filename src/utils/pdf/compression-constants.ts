
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.995, // Calidad JPEG casi máxima para nivel bajo
    scaleFactor: 1.0, // Sin reducción de escala para nivel bajo
    colorReduction: 1.0, // Sin reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.998, // Calidad JPEG máxima para nivel bajo
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.998, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 100 // Calidad máxima para reSmush.it API (0-100)
  },
  medium: { 
    imageQuality: 0.85, // Calidad JPEG para nivel medio (reducida respecto a antes)
    scaleFactor: 0.95, // Mayor reducción para nivel medio
    colorReduction: 0.95, // Mayor reducción de color
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.85, // Menor calidad JPEG para nivel medio (reducida)
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.85, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 100 // Calidad máxima para reSmush.it API (0-100)
  },
  high: { 
    imageQuality: 0.60, // Calidad JPEG más baja pero aún legible
    scaleFactor: 0.70, // Reducción significativa pero manteniendo legibilidad básica
    colorReduction: 0.80, // Reducción de color importante
    useHighQualityFormat: false, // No usar formato de alta calidad
    preserveTextQuality: true, // Ahora también preservamos texto en alta compresión
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.65, // Calidad JPEG más baja pero manteniendo legibilidad
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.65, // Calidad WebP si se usa
    textMode: 'display', // Modo de renderizado para alta compresión
    resmushQuality: 70 // Calidad para reSmush.it API (0-100, no usado por defecto)
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
