
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.85, // Calidad JPEG para balance calidad/tamaño
    scaleFactor: 0.95, // Apenas reducir tamaño para mantener calidad
    colorReduction: 1.0, // Sin reducción de color para máxima calidad
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Siempre usar JPEG para mejor compresión
    jpegQuality: 0.92, // Alta calidad JPEG para nivel bajo
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.9 // Calidad WebP si se usa
  },
  medium: { 
    imageQuality: 0.75, // Calidad JPEG media
    scaleFactor: 0.85, // Reducción moderada
    colorReduction: 0.95, // Ligera reducción de color
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Siempre usar JPEG para mejor compresión
    jpegQuality: 0.85, // Calidad JPEG moderada
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.8 // Calidad WebP si se usa
  },
  high: { 
    imageQuality: 0.6, // Calidad JPEG más baja
    scaleFactor: 0.7, // Reducción significativa
    colorReduction: 0.85, // Reducción de color notable
    useHighQualityFormat: false, // No usar formato de alta calidad
    preserveTextQuality: false, // No preservar calidad de texto para máxima compresión
    useJpegFormat: true, // Siempre usar JPEG para mejor compresión
    jpegQuality: 0.65, // Calidad JPEG más baja para compresión alta
    useWebP: true, // Usar WebP para nivel alto de compresión
    webpQuality: 0.7 // Calidad WebP baja para máxima compresión
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
