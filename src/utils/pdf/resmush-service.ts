
/**
 * Servicio para comprimir imágenes con reSmush.it API
 */

const RESMUSH_API_URL = 'https://api.resmush.it/ws.php';

/**
 * Comprime una imagen usando la API de reSmush.it
 * @param imageData ArrayBuffer o Blob con los datos de la imagen
 * @param quality Calidad de compresión (0-100, por defecto 90)
 * @returns Promise con la URL de la imagen comprimida
 */
export async function compressImageWithResmush(
  imageData: ArrayBuffer | Blob, 
  quality: number = 90
): Promise<string> {
  try {
    // Convertir a Blob si es ArrayBuffer
    const imageBlob = imageData instanceof Blob 
      ? imageData 
      : new Blob([imageData], { type: 'image/jpeg' });
    
    // Crear FormData para la petición
    const formData = new FormData();
    formData.append('files', imageBlob, 'image.jpg');
    
    // Opciones adicionales con calidad personalizable
    formData.append('qlty', quality.toString()); // Calidad personalizable
    formData.append('exif', 'true'); // Mantener metadatos EXIF
    
    console.log(`Enviando solicitud a reSmush.it API con calidad ${quality}...`);
    
    // Realizar la petición a reSmush.it con los headers requeridos
    const response = await fetch(RESMUSH_API_URL, {
      method: 'POST',
      body: formData,
      // No podemos usar headers: en fetch con FormData porque el navegador
      // debe establecer automáticamente el Content-Type con el boundary
      // Pero podemos añadir los headers necesarios
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta de reSmush.it:', errorText);
      throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Respuesta de reSmush.it:', data);
    
    if (!data.dest) {
      throw new Error('No se recibió la URL de la imagen comprimida');
    }
    
    // Descargar la imagen comprimida
    const compressedImageResponse = await fetch(data.dest, {
      headers: {
        'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
        'Referer': window.location.origin || 'http://localhost'
      }
    });
    
    if (!compressedImageResponse.ok) {
      throw new Error('Error al descargar la imagen comprimida');
    }
    
    // Convertir a base64 para uso en PDF
    const compressedImageBlob = await compressedImageResponse.blob();
    return URL.createObjectURL(compressedImageBlob);
  } catch (error) {
    console.error('Error al comprimir imagen con reSmush.it:', error);
    throw error;
  }
}

/**
 * Descarga una imagen comprimida desde una URL y la convierte a ByteArray
 */
export async function downloadCompressedImage(imageUrl: string): Promise<Uint8Array> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
        'Referer': window.location.origin || 'http://localhost'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al descargar imagen: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Uint8Array(await blob.arrayBuffer());
  } catch (error) {
    console.error('Error al descargar imagen comprimida:', error);
    throw error;
  }
}
