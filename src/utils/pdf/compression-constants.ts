
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.8, scaleFactor: 0.9, colorReduction: 0.95 },     // Compresión baja - mejor calidad, menor reducción
  medium: { imageQuality: 0.6, scaleFactor: 0.8, colorReduction: 0.85 },   // Compresión media mejorada - mejor calidad manteniendo buen balance
  high: { imageQuality: 0.2, scaleFactor: 0.5, colorReduction: 0.6 }      // Compresión alta - máxima reducción, menor calidad
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0005; // 0.05% reducción mínima
