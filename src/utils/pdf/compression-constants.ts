import type { CompressionLevel, CompressionFactors } from './compression-types';

// Factores de compresión para cada nivel - valores más agresivos para asegurar compresión real
export const COMPRESSION_FACTORS: Record<CompressionLevel, CompressionFactors> = {
  low: {
    jpegQuality: 0.75,      // Calidad de imagen JPEG (0-1)
    scaleFactor: 0.9,       // Factor de escala para dimensiones (0-1)
    textMode: 'display',    // Modo de renderizado de texto
    maximumDimension: 1500, // Dimensión máxima en píxeles
    objectsPerTick: 50,     // Objetos procesados por tick
    useObjectStreams: true  // Usar streams de objetos
  },
  medium: {
    jpegQuality: 0.5,       // Calidad media para balance
    scaleFactor: 0.7,       // Reducción moderada
    textMode: 'display',    // Modo de renderizado de texto
    maximumDimension: 1200, // Dimensión media
    objectsPerTick: 40,     // Procesamiento más rápido
    useObjectStreams: true  // Usar streams para compresión
  },
  high: {
    jpegQuality: 0.3,       // Baja calidad para máxima compresión
    scaleFactor: 0.5,       // Reducción sustancial
    textMode: 'display',    // Modo simplificado
    maximumDimension: 1000, // Dimensión más pequeña
    objectsPerTick: 30,     // Más rápido aún
    useObjectStreams: true  // Usar streams agresivamente
  }
};

// Umbrales mínimos de reducción esperados para cada nivel
export const MIN_SIZE_REDUCTION = {
  low: 0.03,    // Al menos 3% de reducción
  medium: 0.15, // Al menos 15% de reducción
  high: 0.30    // Al menos 30% de reducción
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
