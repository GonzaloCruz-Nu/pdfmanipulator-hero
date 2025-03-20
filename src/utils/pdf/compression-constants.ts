
// Factores de compresión mucho más agresivos para lograr compresión similar a ilovepdf
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.2, scaleFactor: 0.7, colorReduction: 0.7 },
  medium: { imageQuality: 0.1, scaleFactor: 0.5, colorReduction: 0.5 },
  high: { imageQuality: 0.05, scaleFactor: 0.3, colorReduction: 0.3 }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0005; // 0.05% reducción mínima
