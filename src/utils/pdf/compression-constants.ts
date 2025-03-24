
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.95, // Calidad muy alta pero permitiendo algo de compresión
    scaleFactor: 2.5, // Resolución alta para buena nitidez
    colorReduction: 1.0, // Sin reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.95, // Calidad JPEG alta
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.95, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', // Modo de renderizado optimizado para texto
    resmushQuality: 90 // Calidad para reSmush.it API (sin compresión agresiva)
  },
  medium: { 
    imageQuality: 0.85, // Calidad buena con compresión moderada
    scaleFactor: 2.0, // Resolución adecuada para mantener legibilidad
    colorReduction: 0.98, // Mínima reducción de color
    useHighQualityFormat: true, // Usar formato alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.85, // Calidad JPEG con compresión moderada
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.85, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', // Modo de renderizado optimizado para texto
    resmushQuality: 80 // Calidad media para reSmush.it API
  },
  high: { 
    imageQuality: 0.70, // Calidad reducida para mejor compresión
    scaleFactor: 1.5, // Escala reducida para mejor compresión
    colorReduction: 0.95, // Mayor reducción de color para ahorrar espacio
    useHighQualityFormat: false, // No priorizar calidad en alta compresión
    preserveTextQuality: false, // No preservar texto al máximo en alta compresión
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.70, // Calidad JPEG reducida para máxima compresión
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.70, // Calidad WebP si se usa
    textMode: 'display' as 'print' | 'display', // Modo estándar para mejor compresión
    resmushQuality: 65 // Calidad baja para reSmush.it API para máxima compresión
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.0001; // 0.01% reducción mínima para nivel bajo
