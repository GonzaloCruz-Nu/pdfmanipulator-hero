
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.98, // Mayor calidad JPEG para mejor legibilidad (aumentada más)
    scaleFactor: 0.995, // Reducción mínima para mantener calidad máxima (aumentada más)
    colorReduction: 1.0, // Sin reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.99, // Calidad JPEG máxima para nivel bajo
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.99, // Calidad WebP si se usa (aumentada)
    textMode: 'print' // Modo de renderizado optimizado para texto
  },
  medium: { 
    imageQuality: 0.95, // Mayor calidad JPEG para nivel medio (aumentada)
    scaleFactor: 0.98, // Reducción ligera preservando mejor legibilidad (aumentada)
    colorReduction: 0.99, // Reducción de color mínima (aumentada)
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.97, // Mayor calidad JPEG para nivel medio (aumentada)
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.97, // Calidad WebP si se usa (aumentada)
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
