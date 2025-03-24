
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.998, // Aumentado de 0.995 a 0.998 para mejorar calidad
    scaleFactor: 1.2, // Aumentado de 1.0 a 1.2 para mejor nitidez
    colorReduction: 1.0, // Sin reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.998, // Calidad JPEG aumentada a 0.998
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.998, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 98 // Calidad para reSmush.it API aumentada a 98
  },
  medium: { 
    imageQuality: 0.98, // Aumentado drásticamente a 0.98 (casi sin compresión)
    scaleFactor: 1.5, // Aumentado significativamente a 1.5 para máxima nitidez
    colorReduction: 1.0, // Sin reducción de color
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.98, // Calidad JPEG muy alta
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.98, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 98 // Calidad casi máxima para reSmush.it API
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
