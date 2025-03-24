
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.999, // Calidad prácticamente perfecta para nivel bajo
    scaleFactor: 3.0, // Resolución extremadamente alta para máxima nitidez
    colorReduction: 1.0, // Sin reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.999, // Calidad JPEG sin pérdida visible
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.999, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 100 // Calidad para reSmush.it API máxima (sin compresión)
  },
  medium: { 
    imageQuality: 0.995, // Calidad extremadamente alta para nivel medio
    scaleFactor: 2.5, // Resolución muy alta para excelente nitidez
    colorReduction: 1.0, // Sin reducción de color
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.995, // Calidad JPEG extremadamente alta
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.995, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 98 // Calidad máxima para reSmush.it API
  },
  high: { 
    imageQuality: 0.90, // Calidad alta pero con compresión efectiva
    scaleFactor: 1.5, // Escala mejorada para mantener legibilidad
    colorReduction: 0.98, // Mínima reducción de color pero preservando legibilidad
    useHighQualityFormat: true, // Preservamos calidad en alta compresión
    preserveTextQuality: true, // Preservar texto en alta compresión
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.90, // Calidad JPEG alta pero con compresión efectiva
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.90, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado print para preservar texto
    resmushQuality: 90 // Calidad alta para reSmush.it API
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
