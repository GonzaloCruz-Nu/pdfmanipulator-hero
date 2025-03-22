
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.95, 
    scaleFactor: 0.99, 
    colorReduction: 0.99,
    useHighQualityFormat: true,   // Usar PNG en vez de JPEG para mejor calidad
    preserveTextQuality: true     // Preservar calidad de texto
  },
  medium: { 
    imageQuality: 0.90, 
    scaleFactor: 0.97, 
    colorReduction: 0.95,
    useHighQualityFormat: true,   // Usar PNG para nivel medio también
    preserveTextQuality: true     // Preservar calidad de texto
  },
  high: { 
    imageQuality: 0.2, 
    scaleFactor: 0.5, 
    colorReduction: 0.6,
    useHighQualityFormat: false,  // Usar JPEG para máxima compresión
    preserveTextQuality: false    // Permitir degradación de texto para máxima compresión
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
