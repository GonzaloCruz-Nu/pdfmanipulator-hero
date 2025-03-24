
import { compressPDFWithCanvas } from './canvas-processor';
import { compressPDFAdvanced } from './advanced-processor';
import { CompressionLevel } from '../compression-types';

/**
 * Comprime un PDF utilizando el método más adecuado según el nivel de compresión
 * @param file Archivo PDF a comprimir
 * @param compressionLevel Nivel de compresión deseado
 * @param fileIndex Índice del archivo (para procesamiento múltiple)
 * @param totalFiles Total de archivos (para procesamiento múltiple)
 * @param progressCallback Función de callback para reportar progreso
 * @returns Archivo PDF comprimido o null si falla
 */
export async function compressPDF(
  file: File,
  compressionLevel: CompressionLevel,
  fileIndex: number = 0,
  totalFiles: number = 1,
  progressCallback: (progress: number) => void = () => {}
): Promise<File | null> {
  // Para alta compresión, usar el método basado en canvas
  if (compressionLevel === "high") {
    return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
  } 
  // Para compresión media, intentar primero el método avanzado y si falla usar canvas
  else if (compressionLevel === "medium") {
    try {
      const result = await compressPDFAdvanced(file, compressionLevel, progressCallback);
      if (result && result.size < file.size) {
        return result;
      }
      console.info("Método avanzado no logró reducir el tamaño, intentando con canvas...");
      return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    } catch (error) {
      console.error("Error en método avanzado, usando canvas como fallback:", error);
      return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    }
  } 
  // Para baja compresión, usar el método avanzado que preserva mejor la calidad
  else {
    try {
      const result = await compressPDFAdvanced(file, compressionLevel, progressCallback);
      if (result && result.size < file.size) {
        return result;
      }
      console.info("Método avanzado no logró reducir el tamaño, intentando con canvas de alta calidad...");
      return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    } catch (error) {
      console.error("Error en método avanzado, usando canvas como fallback:", error);
      return compressPDFWithCanvas(file, compressionLevel, fileIndex, totalFiles, progressCallback);
    }
  }
}
