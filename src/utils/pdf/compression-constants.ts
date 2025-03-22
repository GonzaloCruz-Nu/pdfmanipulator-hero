
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.95, 
    scaleFactor: 1.0, // Sin reducción de escala para máxima calidad
    colorReduction: 1.0, // Sin reducción de color
    useHighQualityFormat: true,   // Usar formato de alta calidad
    preserveTextQuality: true,    // Preservar calidad de texto
    useWebP: true,                // Usar WebP para mejor calidad/compresión
    webpQuality: 0.99             // Calidad máxima para WebP
  },
  medium: { 
    imageQuality: 0.90, 
    scaleFactor: 0.98, // Reducción mínima de escala para mantener legibilidad
    colorReduction: 0.98, // Reducción mínima de color
    useHighQualityFormat: true,  // Usar formato alta calidad
    preserveTextQuality: true,    // Preservar calidad de texto
    useWebP: true,                // Usar WebP para mejor compresión manteniendo calidad
    webpQuality: 0.95             // Alta calidad para WebP
  },
  high: { 
    imageQuality: 0.2, 
    scaleFactor: 0.5, 
    colorReduction: 0.6,
    useHighQualityFormat: false,  // Usar JPEG para máxima compresión
    preserveTextQuality: false,   // Permitir degradación de texto para máxima compresión
    useWebP: false,               // No usar WebP para nivel alto (usar JPEG por compatibilidad)
    webpQuality: 0.50             // Media calidad para WebP si se usa
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
