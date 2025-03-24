
/**
 * Servicio para comprimir imágenes con reSmush.it API
 */

const RESMUSH_API_URL = 'https://api.resmush.it/ws.php';

/**
 * Comprime una imagen usando la API de reSmush.it
 * @param imageData ArrayBuffer o Blob con los datos de la imagen
 * @returns Promise con la URL de la imagen comprimida
 */
export async function compressImageWithResmush(imageData: ArrayBuffer | Blob): Promise<string> {
  try {
    // Convertir a Blob si es ArrayBuffer
    const imageBlob = imageData instanceof Blob 
      ? imageData 
      : new Blob([imageData], { type: 'image/jpeg' });
    
    // Crear FormData para la petición
    const formData = new FormData();
    formData.append('files', imageBlob, 'image.jpg');
    
    // Opciones adicionales
    formData.append('qlty', '90'); // Calidad 90% (por defecto es 92%)
    formData.append('exif', 'true'); // Mantener metadatos EXIF
    
    // Realizar la petición a reSmush.it
    const response = await fetch(RESMUSH_API_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.dest) {
      throw new Error('No se recibió la URL de la imagen comprimida');
    }
    
    // Descargar la imagen comprimida
    const compressedImageResponse = await fetch(data.dest);
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
    const response = await fetch(imageUrl);
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
