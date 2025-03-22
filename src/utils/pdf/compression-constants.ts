
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.80, // Calidad JPEG para balance calidad/tamaño
    scaleFactor: 0.90, // Reducción para mantener buena calidad
    colorReduction: 0.95, // Ligera reducción de color
    useHighQualityFormat: false, // No usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Siempre usar JPEG para compresión
    jpegQuality: 0.85, // Alta calidad JPEG para nivel bajo
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.85 // Calidad WebP si se usa
  },
  medium: { 
    imageQuality: 0.65, // Calidad JPEG media
    scaleFactor: 0.75, // Reducción moderada
    colorReduction: 0.85, // Reducción de color media
    useHighQualityFormat: false, // No usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Siempre usar JPEG para mejor compresión
    jpegQuality: 0.70, // Calidad JPEG moderada
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.75 // Calidad WebP si se usa
  },
  high: { 
    imageQuality: 0.50, // Calidad JPEG más baja
    scaleFactor: 0.60, // Reducción significativa
    colorReduction: 0.75, // Reducción de color importante
    useHighQualityFormat: false, // No usar formato de alta calidad
    preserveTextQuality: false, // No preservar calidad de texto para máxima compresión
    useJpegFormat: true, // Siempre usar JPEG para mejor compresión
    jpegQuality: 0.55, // Calidad JPEG más baja para compresión alta
    useWebP: false, // No usar WebP por defecto (cambiado para evitar errores)
    webpQuality: 0.60 // Calidad WebP si se usa
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
