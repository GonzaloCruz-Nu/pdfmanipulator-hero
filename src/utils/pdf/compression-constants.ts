
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.85, // Reducido de 0.95 para mejorar compresión
    scaleFactor: 0.8, // Reducido de 0.9 para mejor compresión
    colorReduction: 0.9, // Ligera reducción para mejor compresión
    useHighQualityFormat: true,   // Usar formato de alta calidad
    preserveTextQuality: true,    // Preservar calidad de texto
    useWebP: false,               // No usar WebP para evitar problemas de compatibilidad
    webpQuality: 0.95             // No se usa, pero se mantiene como referencia
  },
  medium: { 
    imageQuality: 0.75, // Reducido de 0.85 para mejor compresión
    scaleFactor: 0.7, // Reducido de 0.8 para mejor compresión
    colorReduction: 0.85, // Reducido de 0.9 para mejor compresión
    useHighQualityFormat: true,   // Usar formato alta calidad
    preserveTextQuality: true,    // Preservar calidad de texto
    useWebP: false,               // No usar WebP para evitar problemas de compatibilidad 
    webpQuality: 0.85             // No se usa, pero se mantiene como referencia
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
