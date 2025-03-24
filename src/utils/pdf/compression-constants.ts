
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.985, // Aumentado para preservar máxima calidad
    scaleFactor: 1.5, // Aumentado para mayor nitidez
    colorReduction: 1.0, // Sin reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.99, // Calidad JPEG muy alta
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.99, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 95 // Calidad para reSmush.it API ajustada a un valor más alto
  },
  medium: { 
    imageQuality: 0.95, // Aumentado significativamente
    scaleFactor: 1.3, // Factor de escala mayor para mejor legibilidad
    colorReduction: 1.0, // Sin reducción de color
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.92, // Calidad JPEG mejorada
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.92, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 85 // Calidad moderada alta para reSmush.it API
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
    resmushQuality: 60 // Calidad para reSmush.it API (0-100)
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
