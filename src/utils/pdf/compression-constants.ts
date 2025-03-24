
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.995, // Calidad casi perfecta para nivel bajo
    scaleFactor: 2.0, // Mayor resolución para máxima nitidez
    colorReduction: 1.0, // Sin reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.995, // Calidad JPEG prácticamente sin pérdida
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.995, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 98 // Calidad para reSmush.it API máxima
  },
  medium: { 
    imageQuality: 0.98, // Calidad muy alta para nivel medio
    scaleFactor: 1.8, // Resolución muy alta para buena nitidez
    colorReduction: 1.0, // Sin reducción de color
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.98, // Calidad JPEG muy alta
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.98, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado optimizado para texto
    resmushQuality: 92 // Calidad alta para reSmush.it API
  },
  high: { 
    imageQuality: 0.75, // Calidad moderada pero manteniendo legibilidad
    scaleFactor: 1.0, // Escala estándar para tamaño moderado
    colorReduction: 0.95, // Ligera reducción de color pero preservando legibilidad
    useHighQualityFormat: true, // Ahora también preservamos calidad en alta compresión
    preserveTextQuality: true, // Preservar texto en alta compresión
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.80, // Calidad JPEG moderada pero manteniendo legibilidad
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.80, // Calidad WebP si se usa
    textMode: 'print', // Modo de renderizado print para preservar texto
    resmushQuality: 80 // Calidad para reSmush.it API mejorada
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
