
// Factores de compresión correctamente ordenados (baja→menor compresión, alta→mayor compresión)
export const COMPRESSION_FACTORS = {
  low: { 
    imageQuality: 0.95, // Aumentado significativamente para mejor calidad (era 0.80)
    scaleFactor: 1.2, // Aumentado para preservar más detalles (era 1.0)
    colorReduction: 0.95, // Mayor preservación de colores (era 0.85)
    useHighQualityFormat: true, // Mantener formato de alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG para compresión
    jpegQuality: 0.95, // Aumentado significativamente (era 0.75)
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.95, // Aumentado (era 0.9)
    textMode: 'print' as 'print' | 'display', // Modo optimizado para texto
    resmushQuality: 95, // Aumentado (era 80)
    maximumDimension: 2400 // Aumentado para preservar más detalles (era 1800)
  },
  medium: { 
    imageQuality: 0.75, // Reducido para más compresión (era 0.80)
    scaleFactor: 0.80, // Reducido para mejor compresión (era 0.85)
    colorReduction: 0.80, // Reducido para mejor compresión (era 0.85)
    useHighQualityFormat: true, // Mantener alta calidad
    preserveTextQuality: true, // Preservar calidad de texto
    useJpegFormat: true, // Usar JPEG
    jpegQuality: 0.75, // Reducido para más compresión (era 0.80)
    useWebP: false, // No usar WebP por defecto
    webpQuality: 0.75, // Reducido para más compresión (era 0.80)
    textMode: 'print' as 'print' | 'display', // Modo optimizado para texto
    resmushQuality: 75, // Reducido para más compresión (era 80)
    maximumDimension: 1400 // Reducido para mejor compresión (era 1600)
  },
  high: { 
    imageQuality: 0.60, // Duplicado para mejor legibilidad (era 0.30)
    scaleFactor: 0.70, // Aumentado para mejor legibilidad (era 0.45)
    colorReduction: 0.8, // Mayor preservación de colores (era 0.6)
    useHighQualityFormat: true, // Cambiado a true para mejorar calidad (era false)
    preserveTextQuality: true, // Cambiado a true para preservar texto (era false)
    useJpegFormat: true, // Mantener JPEG
    jpegQuality: 0.60, // Duplicado para mejor calidad (era 0.30)
    useWebP: false, // Mantener sin WebP
    webpQuality: 0.65, // Aumentado (era 0.35)
    textMode: 'print' as 'print' | 'display', // Cambiado a print para mejor calidad de texto (era display)
    resmushQuality: 65, // Duplicado (era 30)
    maximumDimension: 1200 // Aumentado significativamente (era 700)
  }
};

// Umbral mínimo de reducción de tamaño - Reducido para permitir mejor calidad con menos compresión
export const MIN_SIZE_REDUCTION = 0.001; // 0.1% reducción mínima (era 0.005)
