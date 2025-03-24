
// Tipo para niveles de compresión
export type CompressionLevel = 'low' | 'medium' | 'high';

// Tipo para resultados de compresión
export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  isSuccessful: boolean;
}
