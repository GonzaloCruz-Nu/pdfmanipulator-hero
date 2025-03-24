
import { CompressionLevel } from '../compression-types';
import { COMPRESSION_FACTORS } from '../compression-constants';

/**
 * Calcula el factor de escala dinámico basado en dimensiones máximas permitidas
 * @param width Ancho original
 * @param height Alto original
 * @param baseScaleFactor Factor de escala base desde la configuración
 * @param maximumDimension Dimensión máxima permitida
 * @returns Factor de escala ajustado
 */
export function calculateDynamicScaleFactor(
  width: number,
  height: number,
  baseScaleFactor: number,
  maximumDimension: number
): number {
  let dynamicScaleFactor = baseScaleFactor;
  const maxDimension = Math.max(width, height);
  
  if (maxDimension * baseScaleFactor > maximumDimension) {
    dynamicScaleFactor = maximumDimension / maxDimension;
    console.info(`Ajustando factor de escala a ${dynamicScaleFactor.toFixed(2)} para respetar dimensión máxima ${maximumDimension}`);
  }
  
  // Aseguramos que el canvas tenga dimensiones razonables
  if (width * dynamicScaleFactor < 10 || height * dynamicScaleFactor < 10) {
    console.warn('Dimensiones de canvas demasiado pequeñas, ajustando a mínimo');
    dynamicScaleFactor = Math.max(dynamicScaleFactor, 10 / Math.min(width, height));
  }
  
  return dynamicScaleFactor;
}

/**
 * Ajusta la calidad JPEG según nivel de compresión y tamaño
 * @param compressionLevel Nivel de compresión
 * @param baseQuality Calidad base de JPEG
 * @param maxDimension Dimensión máxima de la imagen
 * @returns Calidad JPEG ajustada
 */
export function adjustJpegQuality(
  compressionLevel: CompressionLevel,
  baseQuality: number,
  maxDimension: number
): number {
  let adjustedJpegQuality = baseQuality;
  
  if (compressionLevel === 'high') {
    // Para alta compresión, reducir más agresivamente según tamaño
    if (maxDimension > 1200) {
      adjustedJpegQuality = Math.max(0.30, baseQuality - 0.10);
    } else if (maxDimension > 800) {
      adjustedJpegQuality = Math.max(0.35, baseQuality - 0.05);
    }
  } else if (compressionLevel === 'medium') {
    // Para compresión media, reducir moderadamente según tamaño
    if (maxDimension > 1500) {
      adjustedJpegQuality = Math.max(0.45, baseQuality - 0.15);
    } else if (maxDimension > 1000) {
      adjustedJpegQuality = Math.max(0.50, baseQuality - 0.10);
    }
  } else if (compressionLevel === 'low') {
    // Para compresión baja, reducir ligeramente para asegurar alguna compresión
    if (maxDimension > 2000) {
      adjustedJpegQuality = Math.max(0.80, baseQuality - 0.10);
    } else {
      adjustedJpegQuality = Math.max(0.85, baseQuality - 0.05);
    }
  }
  
  return adjustedJpegQuality;
}

/**
 * Obtiene las opciones de guardado de PDF según el nivel de compresión
 * @param compressionLevel Nivel de compresión
 * @returns Opciones de guardado para PDF-lib
 */
export function getPdfSaveOptions(compressionLevel: CompressionLevel) {
  return {
    useObjectStreams: true,
    addDefaultPage: false,
    // Ajustar la cantidad de objetos por tick según nivel de compresión
    objectsPerTick: compressionLevel === 'high' ? 15 : 
                   compressionLevel === 'medium' ? 30 : 60
  };
}
