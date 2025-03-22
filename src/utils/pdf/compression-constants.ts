
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.85, // Mayor calidad JPEG para mejor legibilidad
    scaleFactor: 0.95, // Reducción mínima para mantener excelente calidad
    colorReduction: 0.98, // Casi sin reducción de color
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.90, // Alta calidad JPEG para nivel bajo
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.90, // Calidad WebP si se usa
    textMode: 'print' // Modo de renderizado optimizado para texto
  },
  medium: { 
    imageQuality: 0.75, // Mayor calidad JPEG para mejor legibilidad
    scaleFactor: 0.85, // Reducción moderada pero preservando legibilidad
    colorReduction: 0.90, // Reducción de color menor
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.80, // Mayor calidad JPEG para nivel medio
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.80, // Calidad WebP si se usa
    textMode: 'print' // Modo de renderizado optimizado para texto
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
    textMode: 'display' // Modo de renderizado para alta compresión
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
