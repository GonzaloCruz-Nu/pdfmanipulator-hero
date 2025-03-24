
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.92, // Calidad alta pero con ligera compresión
    scaleFactor: 1.3, // Mayor resolución para mejor calidad
    colorReduction: 0.95, // Ligera reducción de color para nivel bajo
    useHighQualityFormat: true, // Usar formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.9, // Calidad JPEG alta pero con compresión visible
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.9, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', // Modo de renderizado optimizado para texto
    resmushQuality: 92, // Calidad para reSmush.it API (compresión ligera)
    maximumDimension: 2200 // Dimensión máxima para baja compresión
  },
  medium: { 
    imageQuality: 0.65, // Reducción significativa respecto al nivel bajo
    scaleFactor: 0.85, // Reducción notable de escala - mayor diferencia respecto al nivel bajo
    colorReduction: 0.85, // Mayor reducción de color que nivel bajo
    useHighQualityFormat: true, // Mantener alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG
    jpegQuality: 0.6, // Calidad JPEG media-baja para compresión real
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.65, // Calidad WebP si se usa
    textMode: 'print' as 'print' | 'display', 
    resmushQuality: 65, // Calidad media para reSmush.it API
    maximumDimension: 1200 // Dimensión máxima reducida significativamente
  },
  high: { 
    imageQuality: 0.35, // Calidad muy reducida vs. nivel medio
    scaleFactor: 0.5, // Escala muy reducida vs. nivel medio
    colorReduction: 0.7, // Mayor reducción de color
    useHighQualityFormat: false, // No priorizar calidad en alta compresión
    preserveTextQuality: false, // No preservar texto al máximo en alta compresión
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.35, // Calidad JPEG muy reducida para máxima compresión
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.35, // Calidad WebP si se usa
    textMode: 'display' as 'print' | 'display', // Modo estándar para mejor compresión
    resmushQuality: 35, // Calidad muy baja para reSmush.it API
    maximumDimension: 800 // Dimensión máxima drásticamente reducida
  }
};

// Umbral mínimo de reducción de tamaño
export const MIN_SIZE_REDUCTION = 0.001; // 0.1% reducción mínima para nivel bajo
