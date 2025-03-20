
// Factores de compresión mucho más agresivos para lograr compresión similar a ilovepdf
export const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.5, scaleFactor: 0.8, colorReduction: 0.85 },
  medium: { imageQuality: 0.3, scaleFactor: 0.6, colorReduction: 0.7 },
  high: { imageQuality: 0.1, scaleFactor: 0.4, colorReduction: 0.5 }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0005; // 0.05% reducción mínima
