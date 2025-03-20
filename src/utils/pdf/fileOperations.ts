
import { toast } from 'sonner';

/**
 * Crear un archivo Word a partir de un blob DOCX
 */
export const createWordFile = (blob: Blob, originalFileName: string): File => {
  // Crear archivo Word con nombre descriptivo
  const docxFile = new File(
    [blob],
    `${originalFileName.replace('.pdf', '')}_convertido.docx`,
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  );
  
  console.log('Archivo Word creado:', docxFile.name, 'tamaño:', 
    docxFile.size > 1024 * 1024 
      ? (docxFile.size / 1024 / 1024).toFixed(2) + ' MB' 
      : (docxFile.size / 1024).toFixed(2) + ' KB'
  );
  
  return docxFile;
};

/**
 * Descargar un archivo al dispositivo del usuario
 */
export const downloadFile = (file: File): void => {
  try {
    // Verificación adicional antes de la descarga
    if (file.size === 0) {
      throw new Error('El archivo a descargar está vacío');
    }
    
    // Descargar el archivo directamente
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Documento Word descargado correctamente');
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    toast.error('Error al descargar archivo: ' + (error instanceof Error ? error.message : 'Error desconocido'));
  }
};

/**
 * Verifica si un archivo PDF contiene contenido extraíble
 * Esta función ayuda a determinar si un PDF tiene texto real o es solo imágenes
 */
export const verificarContenidoExtraible = (fileSize: number, textExtracted: number): {
  extraible: boolean;
  mensaje: string | null;
} => {
  // Si el archivo es grande pero se extrajo muy poco texto, probablemente sean imágenes
  if (fileSize > 500000 && textExtracted < 500) {
    return {
      extraible: false,
      mensaje: 'El PDF parece contener principalmente imágenes o gráficos. La conversión podría no incluir todo el contenido.'
    };
  }
  
  // Si no se extrajo casi nada de texto
  if (textExtracted < 100) {
    return {
      extraible: false,
      mensaje: 'No se detectó suficiente texto en el PDF. Podría ser un documento escaneado o con contenido protegido.'
    };
  }
  
  // Si la cantidad de texto es muy baja en relación al tamaño del PDF
  const textoVsTamañoRatio = textExtracted / fileSize;
  if (fileSize > 1000000 && textoVsTamañoRatio < 0.001) {
    return {
      extraible: false,
      mensaje: 'La proporción de texto extraíble es muy baja. El PDF podría contener principalmente imágenes.'
    };
  }
  
  return {
    extraible: true,
    mensaje: null
  };
};
