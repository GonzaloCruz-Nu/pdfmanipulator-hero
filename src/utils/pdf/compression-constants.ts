
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 1.0, // Máxima calidad posible 
    scaleFactor: 1.0, // Sin reducción de escala para máxima calidad
    colorReduction: 1.0, // Sin reducción de color
    useHighQualityFormat: true,   // Usar formato de alta calidad
    preserveTextQuality: true,    // Preservar calidad de texto
    useWebP: false,               // No usar WebP para evitar problemas de compatibilidad
    webpQuality: 1.0              // Calidad máxima aunque no se use
  },
  medium: { 
    imageQuality: 0.95, 
    scaleFactor: 0.95, // Reducción mínima de escala para mantener alta calidad
    colorReduction: 0.98, // Reducción mínima de color
    useHighQualityFormat: true,   // Usar formato alta calidad
    preserveTextQuality: true,    // Preservar calidad de texto
    useWebP: false,               // No usar WebP para evitar problemas de compatibilidad 
    webpQuality: 0.95             // Alta calidad aunque no se use
  },
  high: { 
    imageQuality: 0.2, 
    scaleFactor: 0.5, 
    colorReduction: 0.6,
    useHighQualityFormat: false,  // Usar JPEG para máxima compresión
    preserveTextQuality: false,   // Permitir degradación de texto para máxima compresión
    useWebP: false,               // No usar WebP para nivel alto
    webpQuality: 0.50             // No se usa, pero se mantiene como referencia
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
