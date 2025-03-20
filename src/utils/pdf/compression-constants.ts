
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.7, scaleFactor: 0.8, colorReduction: 0.9 },     // Compresión baja
  medium: { imageQuality: 0.4, scaleFactor: 0.6, colorReduction: 0.7 },  // Compresión media
  high: { imageQuality: 0.1, scaleFactor: 0.4, colorReduction: 0.5 }     // Compresión alta
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0005; // 0.05% reducción mínima
