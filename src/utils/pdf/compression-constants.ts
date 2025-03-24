
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
    imageQuality: 0.80, // Calidad buena con compresión moderada
    scaleFactor: 1.3, // Resolución adecuada para mantener legibilidad
    colorReduction: 0.98, // Mínima reducción de color
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.80, // Calidad JPEG con compresión moderada
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.80, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', // Modo de renderizado optimizado para texto
    resmushQuality: 75, // Calidad media para reSmush.it API
    maximumDimension: 1800 // Dimensión máxima para media compresión
  },
  high: { 
    imageQuality: 0.65, // Calidad reducida para mejor compresión
    scaleFactor: 0.7, // Escala significativamente reducida para máxima compresión
    colorReduction: 0.90, // Mayor reducción de color para ahorrar espacio
    useHighQualityFormat: false, // No priorizar calidad en alta compresión
    preserveTextQuality: false, // No preservar texto al máximo en alta compresión
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.65, // Calidad JPEG reducida para máxima compresión
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.65, // Calidad WebP si se usa
    textMode: 'display' as 'print' | 'display', // Modo estándar para mejor compresión
    resmushQuality: 55, // Calidad baja para reSmush.it API para máxima compresión
    maximumDimension: 1200 // Dimensión máxima para alta compresión
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
