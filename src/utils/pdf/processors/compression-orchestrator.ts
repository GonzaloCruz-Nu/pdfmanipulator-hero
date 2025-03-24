
import { CompressionLevel } from '../compression-types';
import { compressPDFWithCanvas } from './canvas-processor';
import { compressPDFAdvanced } from './advanced-processor';

/**
 * Comprime un PDF utilizando el método más apropiado según el nivel de compresión
 * @param file Archivo PDF a comprimir
 * @param compressionLevel Nivel de compresión deseado
 * @param fileIndex Índice del archivo (para procesamiento múltiple)
 * @param totalFiles Total de archivos (para procesamiento múltiple)
 * @param progressCallback Función de callback para reportar progreso
 * @returns Archivo PDF comprimido o null si falla
 */
export async function compressPDF(
  file: File,
  compressionLevel: CompressionLevel = 'medium',
  fileIndex: number = 0,
  totalFiles: number = 1,
  progressCallback: (progress: number) => void = () => {}
): Promise<File | null> {
  console.info(`Orquestando compresión de PDF '${file.name}' (${Math.round(file.size/1024)}KB) con nivel ${compressionLevel}`);
  
  try {
    // Según el nivel de compresión, elegir el procesador apropiado
    if (compressionLevel === 'high') {
      // Para nivel alto usamos el procesador avanzado
      return await compressPDFAdvanced(file, compressionLevel, progressCallback);
    } else {
      // Para niveles bajo y medio usamos el procesador basado en canvas
      return await compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    }
  } catch (error) {
    console.error('Error en el orquestador de compresión:', error);
    return null;
  }
}
