
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.92, // Calidad muy alta con compresión mínima
    scaleFactor: 1.8, // Resolución alta para buena nitidez
    colorReduction: 1.0, // Sin reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.92, // Calidad JPEG alta
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.92, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', // Modo de renderizado optimizado para texto
    resmushQuality: 90, // Calidad para reSmush.it API (sin compresión agresiva)
    maximumDimension: 2400 // Dimensión máxima para baja compresión
  },
  medium: { 
    imageQuality: 0.70, // Reducido para diferenciación clara de nivel bajo
    scaleFactor: 1.0, // Resolución media significativamente menor que nivel bajo
    colorReduction: 0.95, // Mayor reducción de color que nivel bajo
    useHighQualityFormat: true, // Mantener alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG
    jpegQuality: 0.68, // Reducido significativamente vs. nivel bajo
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.70, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', 
    resmushQuality: 70, // Reducido vs. nivel bajo
    maximumDimension: 1500 // Reducido significativamente vs. nivel bajo
  },
  high: { 
    imageQuality: 0.55, // Calidad significativamente reducida vs. nivel medio
    scaleFactor: 0.6, // Escala drásticamente reducida vs. nivel medio
    colorReduction: 0.85, // Mayor reducción de color
    useHighQualityFormat: false, // No priorizar calidad en alta compresión
    preserveTextQuality: false, // No preservar texto al máximo en alta compresión
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.50, // Calidad JPEG muy reducida para máxima compresión
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.55, // Calidad WebP si se usa
    textMode: 'display' as 'print' | 'display', // Modo estándar para mejor compresión
    resmushQuality: 45, // Calidad muy baja para reSmush.it API
    maximumDimension: 900 // Dimensión máxima drásticamente reducida
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
