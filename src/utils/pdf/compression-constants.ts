
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.80, // Reducido de 0.92 para asegurar compresión visible
    scaleFactor: 1.0, // Reducido de 1.3 para asegurar diferencia
    colorReduction: 0.85, // Mayor reducción para asegurar compresión
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.75, // Reducido de 0.9 para asegurar compresión
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.9, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', // Modo de renderizado optimizado para texto
    resmushQuality: 80, // Reducido de 92 para asegurar compresión
    maximumDimension: 1800 // Reducido de 2200 para asegurar compresión
  },
  medium: { 
    imageQuality: 0.55, // Reducido de 0.65 para asegurar más compresión
    scaleFactor: 0.75, // Reducido de 0.85 para asegurar menor calidad
    colorReduction: 0.75, // Mayor reducción para compresión visible
    useHighQualityFormat: true, // Mantener alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG
    jpegQuality: 0.50, // Reducido de 0.6 para asegurar compresión visible
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.65, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', 
    resmushQuality: 55, // Reducido de 65 para asegurar compresión
    maximumDimension: 1000 // Reducido de 1200 para asegurar compresión
  },
  high: { 
    imageQuality: 0.30, // Ligeramente reducido de 0.35
    scaleFactor: 0.45, // Reducido de 0.5 para asegurar compresión fuerte
    colorReduction: 0.6, // Mayor reducción de color
    useHighQualityFormat: false, // No priorizar calidad en alta compresión
    preserveTextQuality: false, // No preservar texto al máximo en alta compresión
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.30, // Reducido ligeramente para más compresión
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.35, // Calidad WebP si se usa
    textMode: 'display' as 'print' | 'display', // Modo estándar para mejor compresión
    resmushQuality: 30, // Reducido de 35 para más compresión
    maximumDimension: 700 // Reducido de 800 para más compresión
  }
};

// Umbral mínimo de reducción de tamaño - Aumentado para garantizar reducción visible
export const MIN_SIZE_REDUCTION = 0.005; // 0.5% reducción mínima para nivel bajo
