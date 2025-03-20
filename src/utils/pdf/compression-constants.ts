
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.92, scaleFactor: 0.98, colorReduction: 0.95 },     // Compresión baja - mejor calidad, menor reducción
  medium: { imageQuality: 0.85, scaleFactor: 0.95, colorReduction: 0.9 },   // Compresión media mejorada - calidad casi idéntica al original
  high: { imageQuality: 0.2, scaleFactor: 0.5, colorReduction: 0.6 }      // Compresión alta - máxima reducción, menor calidad
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0005; // 0.05% reducción mínima
