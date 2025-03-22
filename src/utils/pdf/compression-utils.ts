
// Utilidades de cálculo para la compresión de PDF

/**
 * Calcula el porcentaje de compresión y devuelve información detallada
 * @param originalSize Tamaño original en bytes
 * @param compressedSize Tamaño comprimido en bytes
 * @returns Objeto con información de compresión
 */
export const calculateCompression = (originalSize: number, compressedSize: number) => {
  // El porcentaje reducido es (tamaño original - tamaño comprimido) / tamaño original * 100
  const savedPercentage = Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10;
  return {
    originalSize,
    compressedSize,
    savedPercentage,
    savedBytes: originalSize - compressedSize,
    isCompressed: compressedSize < originalSize
  };
};

/**
 * Formatea un tamaño en bytes a una representación legible
 * @param bytes Tamaño en bytes
 * @param decimals Decimales a mostrar (por defecto 2)
 * @returns Cadena formateada con unidades
 */
export const formatFileSize = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
