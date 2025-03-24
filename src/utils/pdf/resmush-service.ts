
/**
 * Servicio para comprimir imágenes con reSmush.it API
 */

const RESMUSH_API_URL = 'https://api.resmush.it/ws.php';
const RESMUSH_PING_URL = 'https://api.resmush.it/ping';

// Opciones para la compresión de imágenes
export interface ResmushOptions {
  quality?: number;     // Calidad de compresión (0-100)
  exif?: boolean;       // Mantener metadatos EXIF
  timeout?: number;     // Tiempo máximo de espera en milisegundos
  retries?: number;     // Número de reintentos
}

// Resultado de la compresión
export interface ResmushResult {
  src_size: number;     // Tamaño original en bytes
  dest_size: number;    // Tamaño comprimido en bytes  
  percent: number;      // Porcentaje de reducción
  dest: string;         // URL de la imagen comprimida
}

/**
 * Verifica la disponibilidad del servicio reSmush.it
 * @param timeout Tiempo máximo de espera en ms
 * @returns Booleano indicando si el servicio está disponible
 */
export async function checkResmushAvailability(timeout: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(RESMUSH_PING_URL, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
        'Referer': window.location.origin || 'http://localhost:3000', // Añadir puerto por defecto
        'Cache-Control': 'no-cache, no-store' // Evitar cachés
      },
      signal: controller.signal,
      cache: 'no-store' // Desactivar cache de fetch
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.info('Conexión exitosa con la API de reSmush.it');
      return true;
    } else {
      console.warn(`Respuesta no satisfactoria de reSmush.it: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.warn('Error al verificar disponibilidad de reSmush.it:', error);
    return false;
  }
}

/**
 * Comprime una imagen usando la API de reSmush.it con opciones mejoradas
 * @param imageData ArrayBuffer o Blob con los datos de la imagen
 * @param options Opciones de compresión
 * @returns Promise con la URL de la imagen comprimida
 */
export async function compressImageWithResmush(
  imageData: ArrayBuffer | Blob, 
  options: ResmushOptions = {}
): Promise<string> {
  try {
    // Valores por defecto optimizados
    const quality = options.quality ?? 90;
    const exif = options.exif ?? false; // Por defecto eliminar metadatos para mejor compresión
    const timeout = options.timeout ?? 30000; // 30 segundos por defecto
    const retries = options.retries ?? 2; // 2 intentos adicionales por defecto
    
    // Verificar disponibilidad del servicio con timeout corto
    const serviceAvailable = await checkResmushAvailability(5000);
    if (!serviceAvailable) {
      console.warn('reSmush.it API no disponible, usando compresión local');
      // Fallback a compresión local
      const compressedBlob = await compressImageLocally(imageData, quality / 100);
      return URL.createObjectURL(compressedBlob);
    }
    
    // Convertir a Blob si es ArrayBuffer
    const imageBlob = imageData instanceof Blob 
      ? imageData 
      : new Blob([imageData], { type: 'image/jpeg' });
    
    // Limitar tamaño a un máximo de 5MB para mejor rendimiento con reSmush
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (imageBlob.size > MAX_SIZE) {
      console.warn(`Imagen demasiado grande (${Math.round(imageBlob.size/1024/1024)}MB), redimensionando antes de enviar a reSmush.it`);
      // Reducir tamaño manteniendo calidad para imágenes grandes
      const reducedBlob = await reduceImageSize(imageBlob, MAX_SIZE, 0.92);
      // Si no podemos reducir, usar la original
      const blobToSend = reducedBlob || imageBlob;
      
      // Si sigue siendo muy grande, usar compresión local
      if (blobToSend.size > MAX_SIZE) {
        console.warn('Imagen sigue siendo muy grande, usando compresión local');
        const compressedBlob = await compressImageLocally(blobToSend, quality / 100);
        return URL.createObjectURL(compressedBlob);
      }
    }
    
    // Crear FormData para la petición
    const formData = new FormData();
    formData.append('files', imageBlob, 'image.jpg');
    
    // Opciones adicionales con calidad personalizable
    formData.append('qlty', quality.toString());
    formData.append('exif', exif ? 'true' : 'false');
    
    console.info(`Enviando solicitud a reSmush.it API con calidad ${quality}%...`);
    
    // Implementar sistema de reintentos
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        console.info(`Reintentando petición a reSmush.it (intento ${attempt}/${retries})...`);
        // Esperar antes de reintentar con tiempo incremental
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      try {
        // Configurar el controlador de tiempo de espera
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Realizar la petición a reSmush.it con los headers requeridos
        const response = await fetch(RESMUSH_API_URL, {
          method: 'POST',
          body: formData,
          headers: {
            'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
            'Referer': window.location.origin || 'http://localhost:3000',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal,
          cache: 'no-store' // Desactivar cache
        });
        
        // Limpiar el timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error en la respuesta de reSmush.it (${response.status}):`, errorText);
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
        return await downloadCompressedImageAsDataURL(data.dest, timeout);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === retries) {
          // Si es el último intento, propagar el error
          throw lastError;
        }
      }
    }
    
    // Este punto no debería alcanzarse debido al manejo de errores anterior
    throw lastError || new Error('Error desconocido en compressImageWithResmush');
  } catch (error) {
    console.error('Error al comprimir imagen con reSmush.it:', error);
    
    // Fallback a compresión local en caso de error
    console.info('Usando compresión local como alternativa...');
    const compressedBlob = await compressImageLocally(imageData, (options.quality || 90) / 100);
    return URL.createObjectURL(compressedBlob);
  }
}

/**
 * Descarga una imagen comprimida y la convierte a Data URL
 */
async function downloadCompressedImageAsDataURL(imageUrl: string, timeout: number = 30000): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    console.info(`Descargando imagen comprimida desde ${imageUrl}...`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
        'Referer': window.location.origin || 'http://localhost:3000',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error al descargar imagen: ${response.status}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
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
 * Descarga una imagen comprimida desde una URL y la convierte a ByteArray
 */
export async function downloadCompressedImage(imageUrl: string, timeout: number = 30000): Promise<Uint8Array> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 PDF Compressor Web App',
        'Referer': window.location.origin || 'http://localhost:3000',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal,
      cache: 'no-store'
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
 * Reduce el tamaño de una imagen manteniendo la mejor calidad posible
 * @param imageBlob Blob de la imagen a reducir
 * @param targetSize Tamaño objetivo en bytes
 * @param minQuality Calidad mínima aceptable (0-1)
 * @returns Blob de la imagen reducida o null si no se puede reducir
 */
async function reduceImageSize(
  imageBlob: Blob, 
  targetSize: number,
  minQuality: number = 0.7
): Promise<Blob | null> {
  // Crear URL para la imagen
  const url = URL.createObjectURL(imageBlob);
  
  try {
    // Cargar imagen
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    
    // Calcular dimensiones máximas manteniendo proporción
    const MAX_DIM = 3000; // Dimensión máxima para cualquier lado
    let width = img.width;
    let height = img.height;
    
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.floor(height * (MAX_DIM / width));
        width = MAX_DIM;
      } else {
        width = Math.floor(width * (MAX_DIM / height));
        height = MAX_DIM;
      }
    }
    
    // Crear canvas con nuevas dimensiones
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Dibujar imagen redimensionada
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar con alta calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    
    // Intentar diferentes calidades hasta encontrar una que cumpla con el tamaño objetivo
    let quality = 0.95;
    let blob: Blob | null = null;
    
    while (quality >= minQuality) {
      blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });
      
      if (blob && blob.size <= targetSize) {
        console.info(`Imagen redimensionada a ${width}x${height} con calidad ${quality.toFixed(2)}`);
        return blob;
      }
      
      // Reducir calidad para el siguiente intento
      quality -= 0.05;
    }
    
    // Si llegamos aquí, usar la última calidad
    return blob;
  } catch (error) {
    console.error('Error al reducir tamaño de imagen:', error);
    return null;
  } finally {
    // Liberar URL
    URL.revokeObjectURL(url);
  }
}

/**
 * Comprime una imagen en el navegador sin hacer llamadas externas
 * (usado como fallback cuando reSmush falla)
 */
export async function compressImageLocally(
  imageData: ArrayBuffer | Blob, 
  quality: number = 0.85
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
        
        // Dibujar imagen en el canvas con máxima calidad
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D del canvas'));
          return;
        }
        
        // Fondo blanco para eliminar transparencia
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Configurar para máxima calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
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
