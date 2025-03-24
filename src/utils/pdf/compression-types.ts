// Tipo para niveles de compresión
export type CompressionLevel = 'low' | 'medium' | 'high';

// Tipo para resultados de compresión
export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  isSuccessful: boolean;
}

// Información sobre el proceso de compresión para un archivo
export interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

// Estadísticas para la compresión de múltiples archivos
export interface TotalCompressionStats {
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavedPercentage: number;
  fileCount: number;
}
