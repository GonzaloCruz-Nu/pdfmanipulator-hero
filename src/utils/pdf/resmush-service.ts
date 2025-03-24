
/**
 * Servicio para comprimir imágenes con reSmush.it API
 */

const RESMUSH_API_URL = 'https://api.resmush.it/ws.php';

// Opciones para la compresión de imágenes
export interface ResmushOptions {
  quality?: number;     // Calidad de compresión (0-100)
  exif?: boolean;       // Mantener metadatos EXIF
  timeout?: number;     // Tiempo máximo de espera en milisegundos
}

// Resultado de la compresión
export interface ResmushResult {
  src_size: number;     // Tamaño original en bytes
  dest_size: number;    // Tamaño comprimido en bytes  
  percent: number;      // Porcentaje de reducción
  dest: string;         // URL de la imagen comprimida
}

/**
 * Comprime una imagen usando la API de reSmush.it
 * @param imageData ArrayBuffer o Blob con los datos de la imagen
 * @param options Opciones de compresión
 * @returns Promise con la URL de la imagen comprimida
 */
export async function compressImageWithResmush(
  imageData: ArrayBuffer | Blob, 
  options: ResmushOptions = {}
): Promise<string> {
  try {
    // Valores por defecto
    const quality = options.quality ?? 90;
    const exif = options.exif ?? true;
    const timeout = options.timeout ?? 30000; // 30 segundos por defecto
    
    // Convertir a Blob si es ArrayBuffer
    const imageBlob = imageData instanceof Blob 
      ? imageData 
      : new Blob([imageData], { type: 'image/jpeg' });
    
    // Crear FormData para la petición
    const formData = new FormData();
    formData.append('files', imageBlob, 'image.jpg');
    
    // Opciones adicionales con calidad personalizable
    formData.append('qlty', quality.toString());
    formData.append('exif', exif ? 'true' : 'false');
    
    console.info(`Enviando solicitud a reSmush.it API con calidad ${quality}%...`);
    
    // Configurar el controlador de tiempo de espera
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Realizar la petición a reSmush.it con los headers requeridos
    const response = await fetch(RESMUSH_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
        'Referer': window.location.origin || 'http://localhost'
      },
      signal: controller.signal
    });
    
    // Limpiar el timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta de reSmush.it:', errorText);
      throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
    }
    
    const data: ResmushResult = await response.json();
    console.info('Respuesta de reSmush.it:', data);
    
    if (!data.dest) {
      throw new Error('No se recibió la URL de la imagen comprimida');
    }
    
    if ('error' in data) {
      throw new Error(`Error de reSmush.it: ${(data as any).error_long || (data as any).error}`);
    }
    
    // Verificar y mostrar estadísticas de compresión
    if (data.src_size && data.dest_size) {
      const originalSizeKB = Math.round(data.src_size / 1024);
      const compressedSizeKB = Math.round(data.dest_size / 1024);
      const percentReduction = data.percent || ((data.src_size - data.dest_size) / data.src_size * 100).toFixed(2);
      
      console.info(`reSmush.it (qlty=${quality}%): ${originalSizeKB}KB → ${compressedSizeKB}KB (${percentReduction}% reducción)`);
    }
    
    // Descargar la imagen comprimida con timeout
    const downloadController = new AbortController();
    const downloadTimeoutId = setTimeout(() => downloadController.abort(), timeout);
    
    try {
      const compressedImageResponse = await fetch(data.dest, {
        headers: {
          'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
          'Referer': window.location.origin || 'http://localhost'
        },
        signal: downloadController.signal
      });
      
      clearTimeout(downloadTimeoutId);
      
      if (!compressedImageResponse.ok) {
        throw new Error('Error al descargar la imagen comprimida');
      }
      
      // Convertir a URL de objeto para uso en PDF
      const compressedImageBlob = await compressedImageResponse.blob();
      return URL.createObjectURL(compressedImageBlob);
    } catch (error) {
      clearTimeout(downloadTimeoutId);
      throw error;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('La solicitud a reSmush.it ha excedido el tiempo de espera');
      throw new Error('Tiempo de espera excedido. El servidor de compresión no responde.');
    }
    console.error('Error al comprimir imagen con reSmush.it:', error);
    throw error;
  }
}

/**
 * Descarga una imagen comprimida desde una URL y la convierte a ByteArray
 */
export async function downloadCompressedImage(imageUrl: string, timeout: number = 30000): Promise<Uint8Array> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
        'Referer': window.location.origin || 'http://localhost'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error al descargar imagen: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Uint8Array(await blob.arrayBuffer());
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('La descarga de la imagen ha excedido el tiempo de espera');
      throw new Error('Tiempo de espera excedido al descargar la imagen comprimida.');
    }
    console.error('Error al descargar imagen comprimida:', error);
    throw error;
  }
}

/**
 * Comprime una imagen en el navegador sin hacer llamadas externas
 * (usado como fallback cuando reSmush falla)
 */
export async function compressImageLocally(
  imageData: ArrayBuffer | Blob, 
  quality: number = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Convertir a Blob si es ArrayBuffer
      const imageBlob = imageData instanceof Blob 
        ? imageData 
        : new Blob([imageData], { type: 'image/jpeg' });
      
      // Crear URL para la imagen
      const url = URL.createObjectURL(imageBlob);
      
      // Crear imagen y esperar a que cargue
      const img = new Image();
      img.onload = () => {
        // Liberar URL
        URL.revokeObjectURL(url);
        
        // Crear canvas del tamaño de la imagen
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Dibujar imagen en el canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D del canvas'));
          return;
        }
        
        // Fondo blanco para eliminar transparencia
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar la imagen
        ctx.drawImage(img, 0, 0);
        
        // Comprimir como JPEG con la calidad especificada
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen localmente'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar la imagen para compresión local'));
      };
      
      img.src = url;
    } catch (error) {
      console.error('Error en compresión local:', error);
      reject(error);
    }
  });
}
