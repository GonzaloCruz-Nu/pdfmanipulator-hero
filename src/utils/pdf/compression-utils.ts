
// Método para calcular el porcentaje de compresión
export const calculateCompression = (originalSize: number, compressedSize: number) => {
  // El porcentaje reducido es (tamaño original - tamaño comprimido) / tamaño original * 100
  const savedPercentage = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10);
  return {
    originalSize,
    compressedSize,
    savedPercentage
  };
};
