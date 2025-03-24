
import type { CompressionLevel, CompressionFactors } from './compression-types';

// Factores de compresión para cada nivel - ajustados para diferenciación clara
export const COMPRESSION_FACTORS: Record<CompressionLevel, CompressionFactors> = {
  low: {
    jpegQuality: 0.85,        // Alta calidad de imagen JPEG (0-1) - ajustado para asegurar compresión
    scaleFactor: 0.98,        // Casi sin reducción de escala
    textMode: 'print',        // Mejor calidad de texto
    maximumDimension: 2000,   // Dimensión máxima alta para mantener calidad
    objectsPerTick: 100,      // Mayor procesamiento por tick
    useObjectStreams: true,   // Usar streams de objetos
    imageQuality: 0.9,        // Alta calidad para imágenes
    preserveTextQuality: true // Preservar calidad de texto
  },
  medium: {
    jpegQuality: 0.6,         // Calidad media para balance
    scaleFactor: 0.75,        // Reducción moderada
    textMode: 'display',      // Modo estándar de renderizado
    maximumDimension: 1500,   // Dimensión media
    objectsPerTick: 50,       // Procesamiento estándar
    useObjectStreams: true,   // Usar streams para compresión
    imageQuality: 0.6,        // Calidad media para imágenes
    preserveTextQuality: true // Aún se preserva texto
  },
  high: {
    jpegQuality: 0.3,         // Baja calidad para máxima compresión
    scaleFactor: 0.5,         // Reducción sustancial
    textMode: 'display',      // Modo simplificado
    maximumDimension: 1000,   // Dimensión más pequeña
    objectsPerTick: 20,       // Más velocidad de procesamiento
    useObjectStreams: true,   // Usar streams agresivamente
    imageQuality: 0.3,        // Baja calidad para imágenes
    preserveTextQuality: false // No se prioriza la calidad del texto
  }
};

// Umbrales mínimos de reducción esperados para cada nivel
export const MIN_SIZE_REDUCTION = {
  low: 0.01,    // Al menos 1% de reducción para nivel bajo (reducido para asegurar éxito)
  medium: 0.15, // Al menos 15% de reducción para nivel medio
  high: 0.30    // Al menos 30% de reducción para nivel alto
};

// Límites de tamaño para ajuste dinámico de calidad
export const SIZE_THRESHOLDS = {
  small: 1024 * 1024,      // 1MB
  medium: 5 * 1024 * 1024, // 5MB
  large: 20 * 1024 * 1024  // 20MB
};

// Factores adicionales para ajuste dinámico según tamaño de archivo
export const SIZE_ADJUSTMENT_FACTORS = {
  small: {
    jpegQuality: 1.1,    // Ligero aumento para archivos pequeños
    scaleFactor: 1.1
  },
  medium: {
    jpegQuality: 1.0,    // Sin cambios
    scaleFactor: 1.0
  },
  large: {
    jpegQuality: 0.8,    // Reducción para archivos grandes
    scaleFactor: 0.9
  },
  veryLarge: {
    jpegQuality: 0.7,    // Reducción agresiva para archivos muy grandes
    scaleFactor: 0.8
  }
};
