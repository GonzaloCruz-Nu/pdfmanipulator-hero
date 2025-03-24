
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
    // Generar JPEG inicial con la calidad especificada - MEJORADA
    const initialJpegUrl = canvas.toDataURL('image/jpeg', Math.min(1.0, fallbackQuality));
    
    // Verificar si la imagen es demasiado grande
    const canvasSize = canvas.width * canvas.height;
    console.info(`Procesando imagen de página ${pageIndex+1} (${canvas.width}x${canvas.height}, tamaño: ${Math.round(canvasSize/1000000)} MP)`);
    
    // Para imágenes muy grandes, usar calidad alta pero razonable
    if (canvasSize > 8000000) { // > 8 megapíxeles
      // Usar una calidad adaptativa basada en el tamaño pero manteniendo buena legibilidad
      const adjustedQuality = Math.max(0.85, fallbackQuality - 0.05);
      console.info(`Imagen muy grande detectada (${Math.round(canvasSize/1000000)} MP), ajustando calidad a ${adjustedQuality.toFixed(2)}`);
      return canvas.toDataURL('image/jpeg', adjustedQuality);
    }
    
    // Para imágenes con texto potencial (detectado por proporción y tamaño)
    // usar calidad extra alta
    if (canvasSize < 3000000 && (canvas.width / canvas.height > 1.2 || canvas.height / canvas.width > 1.2)) {
      const enhancedQuality = Math.min(0.95, fallbackQuality + 0.05);
      console.info(`Posible documento con texto detectado, aumentando calidad a ${enhancedQuality.toFixed(2)}`);
      return canvas.toDataURL('image/jpeg', enhancedQuality);
    }
    
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
    
    // Compresión local con calidad ajustada - MEJORADA
    console.info(`Usando compresión local para página ${pageIndex+1} (calidad: ${fallbackQuality})`);
    return canvas.toDataURL('image/jpeg', fallbackQuality);
  } catch (error) {
    console.error(`Error general comprimiendo imagen de página ${pageIndex+1}:`, error);
    // Último recurso: devolver una imagen con calidad alta como fallback
    return canvas.toDataURL('image/jpeg', 0.9); // Aumentado a 0.9 (era 0.7)
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
