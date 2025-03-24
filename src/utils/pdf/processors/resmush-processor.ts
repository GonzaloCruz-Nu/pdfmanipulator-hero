
/**
 * Implementa la compresión de imágenes usando el servicio resmush.it
 */

/**
 * Comprime una imagen usando la API de resmush.it
 * @param imageUrl URL de la imagen a comprimir
 * @param quality Calidad de compresión (0-100)
 * @returns ArrayBuffer con la imagen comprimida
 */
export async function compressImageWithResmush(
  imageData: ArrayBuffer,
  quality: number = 80
): Promise<ArrayBuffer | null> {
  try {
    // Crear un blob y una URL temporal para la imagen
    const blob = new Blob([imageData], { type: 'image/jpeg' });
    const imageUrl = URL.createObjectURL(blob);
    
    // Configurar la URL de la API de resmush.it
    const resmushUrl = `https://api.resmush.it/ws.php?img=${encodeURIComponent(imageUrl)}&qlty=${quality}`;
    
    // Configurar los headers para la petición
    const headers = new Headers({
      'User-Agent': 'PDFOptimizer/1.0',
      'Referer': window.location.origin
    });
    
    // Hacer la petición a resmush.it
    const response = await fetch(resmushUrl, { 
      method: 'GET',
      headers: headers,
      mode: 'cors',
      cache: 'no-cache'
    });
    
    // Liberar la URL temporal
    URL.revokeObjectURL(imageUrl);
    
    // Verificar respuesta
    if (!response.ok) {
      console.error(`Error en respuesta de resmush.it: ${response.status} ${response.statusText}`);
      return null;
    }
    
    // Obtener los datos de la respuesta
    const responseData = await response.json();
    
    // Verificar que la respuesta contenga la URL de la imagen optimizada
    if (!responseData.dest) {
      console.error('La respuesta de resmush.it no contiene la URL de la imagen optimizada', responseData);
      return null;
    }
    
    // Descargar la imagen optimizada
    const optimizedImageResponse = await fetch(responseData.dest);
    if (!optimizedImageResponse.ok) {
      console.error(`Error al descargar imagen optimizada: ${optimizedImageResponse.status}`);
      return null;
    }
    
    // Obtener los datos de la imagen optimizada
    const optimizedImageBuffer = await optimizedImageResponse.arrayBuffer();
    
    console.info(`Imagen comprimida con resmush.it: ${responseData.src_size} -> ${responseData.dest_size} bytes (${Math.round(responseData.percent)}% reducción)`);
    
    return optimizedImageBuffer;
  } catch (error) {
    console.error('Error al comprimir imagen con resmush.it:', error);
    return null;
  }
}

/**
 * Funcionalidad para comprimir múltiples imágenes con resmush.it
 * @param imagesData Array de objetos con datos de imágenes
 * @param quality Calidad de compresión (0-100)
 * @returns Array de objetos con las imágenes comprimidas
 */
export async function compressMultipleImagesWithResmush(
  imagesData: ArrayBuffer[],
  qualities: number[]
): Promise<(ArrayBuffer | null)[]> {
  const results: (ArrayBuffer | null)[] = [];
  
  // Comprimir cada imagen secuencialmente (para evitar sobrecargar la API)
  for (let i = 0; i < imagesData.length; i++) {
    const quality = qualities[i] || 80; // Default 80 if not specified
    try {
      const result = await compressImageWithResmush(imagesData[i], quality);
      results.push(result);
    } catch (error) {
      console.error(`Error comprimiendo imagen ${i}:`, error);
      results.push(null);
    }
  }
  
  return results;
}

/**
 * Determina la calidad adecuada para cada nivel de compresión
 * @param compressionLevel Nivel de compresión
 * @returns Calidad para resmush.it (0-100)
 */
export function getQualityForCompressionLevel(compressionLevel: 'low' | 'medium' | 'high'): number {
  switch (compressionLevel) {
    case 'low':
      return 95;
    case 'medium':
      return 70;
    case 'high':
      return 40;
    default:
      return 80;
  }
}
