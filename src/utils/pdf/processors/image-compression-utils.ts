
import { downloadCompressedImage, compressImageWithResmush, checkResmushAvailability } from '../resmush-service';

/**
 * Comprime una imagen de canvas utilizando reSmush.it o compresión local
 * @param canvas Canvas que contiene la imagen a comprimir
 * @param pageIndex Índice de la página
 * @param useResmush Si se debe usar reSmush.it para la compresión
 * @param resmushQuality Calidad para reSmush.it (1-100)
 * @param fallbackQuality Calidad para compresión local si reSmush falla
 * @returns URL de la imagen comprimida
 */
export async function compressCanvasImage(
  canvas: HTMLCanvasElement,
  pageIndex: number,
  useResmush: boolean = false, 
  resmushQuality: number = 85,
  fallbackQuality: number = 0.85
): Promise<string> {
  try {
    // Generar JPEG inicial con la calidad especificada
    const initialJpegUrl = canvas.toDataURL('image/jpeg', Math.min(1.0, fallbackQuality));
    
    console.info(`Procesando imagen de página ${pageIndex+1} (${canvas.width}x${canvas.height})`);
    
    if (useResmush) {
      try {
        console.info(`Intentando comprimir imagen con reSmush.it (calidad: ${resmushQuality})`);
        
        // Convertir data URL a blob para enviar a reSmush
        const fetchResponse = await fetch(initialJpegUrl);
        const blob = await fetchResponse.blob();
        
        // Enviar a reSmush para compresión optimizada
        const compressedImageUrl = await compressImageWithResmush(blob, {
          quality: resmushQuality,
          exif: false,
          timeout: 15000,
          retries: 1
        });
        
        console.info(`Compresión con reSmush.it exitosa para página ${pageIndex+1}`);
        return compressedImageUrl;
      } catch (error) {
        console.warn(`Error al usar reSmush.it para página ${pageIndex+1}: ${error}. Usando compresión local.`);
      }
    }
    
    // Compresión local con calidad ajustada
    console.info(`Usando compresión local para página ${pageIndex+1} (calidad: ${fallbackQuality})`);
    return canvas.toDataURL('image/jpeg', fallbackQuality);
  } catch (error) {
    console.error(`Error general comprimiendo imagen de página ${pageIndex+1}:`, error);
    // Último recurso: devolver una imagen con calidad media
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}

/**
 * Convierte una URL de imagen a ArrayBuffer
 * @param imageUrl URL de la imagen
 * @returns ArrayBuffer con los datos de la imagen
 */
export async function getArrayBufferFromImageUrl(imageUrl: string): Promise<ArrayBuffer> {
  try {
    // Verificar si es una URL de objeto o una data URL
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      return await response.arrayBuffer();
    } else {
      // Si es una URL regular, descargar y convertir
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
          'Referer': window.location.origin || 'http://localhost'
        }
      });
      return await response.arrayBuffer();
    }
  } catch (error) {
    console.error('Error al convertir URL de imagen a ArrayBuffer:', error);
    throw error;
  }
}

/**
 * Verifica la disponibilidad del servicio reSmush.it con timeout
 * @param timeout Tiempo máximo de espera en ms
 * @returns Booleano indicando si el servicio está disponible
 */
export async function checkReSmushAvailability(timeout: number = 5000): Promise<boolean> {
  try {
    return await checkResmushAvailability(timeout);
  } catch (error) {
    console.warn('Error al verificar disponibilidad de reSmush.it:', error);
    return false;
  }
}
