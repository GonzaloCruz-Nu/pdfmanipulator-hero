
import { checkResmushAvailability, compressImageWithResmush } from '../resmush-service';

/**
 * Comprime una imagen de un canvas utilizando diferentes métodos según disponibilidad
 * @param canvas Canvas con la imagen a comprimir
 * @param compressionLevel Nivel de compresión
 * @param pageIndex Índice de la página para reportes
 * @param useResmush Si se debe intentar usar el servicio reSmush.it
 * @param resmushQuality Calidad para reSmush.it (0-100)
 * @param localQuality Calidad para compresión local (0-1)
 * @returns URL de la imagen comprimida (dataURL o blobURL)
 */
export async function compressCanvasImage(
  canvas: HTMLCanvasElement,
  pageIndex: number,
  useResmush: boolean = true,
  resmushQuality: number = 80,
  localQuality: number = 0.9
): Promise<string> {
  // Si se solicitó usar reSmush.it y está disponible, intentar primero
  if (useResmush) {
    try {
      // Convertir canvas a Blob con alta calidad para enviar a reSmush
      const canvasBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob([]));
        }, 'image/jpeg', 0.99); // Enviamos calidad alta para que reSmush tenga mejor material
      });
      
      // Usar la API para comprimir
      const compressedImageUrl = await compressImageWithResmush(
        canvasBlob,
        { 
          quality: resmushQuality, 
          timeout: 25000,
          retries: 1 // Un reintento adicional
        }
      );
      
      console.info(`Página ${pageIndex + 1} comprimida exitosamente con reSmush.it API`);
      return compressedImageUrl;
    } catch (error) {
      console.warn(`Error al usar reSmush.it API: ${error}. Usando compresión local.`);
      // Si falla, usamos compresión local como fallback
    }
  }
  
  // Compresión local
  const localCompressedUrl = canvas.toDataURL('image/jpeg', localQuality);
  console.info(`Usando compresión local para página ${pageIndex + 1} con calidad ${localQuality}`);
  return localCompressedUrl;
}

/**
 * Convierte una imagen comprimida (dataURL o URL) a ArrayBuffer
 * @param compressedImageUrl URL o dataURL de la imagen comprimida
 * @returns ArrayBuffer con los datos de la imagen
 */
export async function getArrayBufferFromImageUrl(compressedImageUrl: string): Promise<ArrayBuffer> {
  if (compressedImageUrl.startsWith('data:')) {
    // Es un data URL (compresión local o reSmush convertido a dataURL)
    const base64 = compressedImageUrl.split(',')[1];
    return Buffer.from(base64, 'base64');
  } else {
    // Es una URL de objeto (caso raro pero posible)
    try {
      const response = await fetch(compressedImageUrl);
      const blob = await response.blob();
      return await blob.arrayBuffer();
    } catch (error) {
      console.warn(`Error al procesar URL de objeto: ${error}`);
      throw error;
    }
  }
}

/**
 * Verifica la disponibilidad del servicio reSmush
 * @param timeout Tiempo de espera máximo en milisegundos
 * @returns true si reSmush está disponible, false en caso contrario
 */
export async function checkReSmushAvailability(timeout: number = 5000): Promise<boolean> {
  return await checkResmushAvailability(timeout);
}
