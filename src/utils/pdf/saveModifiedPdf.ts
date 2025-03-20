
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';

/**
 * Función que guarda una página de PDF modificada y permite su descarga
 */
export const saveModifiedPage = async (
  originalPdfFile: File,
  currentPage: number,
  modifiedPageDataUrl: string,
): Promise<void> => {
  try {
    // Leer el archivo original como ArrayBuffer
    const originalPdfBytes = await originalPdfFile.arrayBuffer();
    
    // Cargar el PDF original
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    
    // Obtener todas las páginas
    const pages = pdfDoc.getPages();
    
    // Verificar que la página existe
    if (currentPage < 1 || currentPage > pages.length) {
      throw new Error(`La página ${currentPage} no existe en el documento`);
    }
    
    // Convertir la página modificada de data URL a imagen
    const imgData = modifiedPageDataUrl.split(',')[1];
    const imgBuffer = Buffer.from(imgData, 'base64');
    
    // Cargar la imagen modificada en el documento
    const img = await pdfDoc.embedJpg(imgBuffer);
    
    // Obtener la página a modificar (restar 1 porque el array empieza en 0)
    const pageIndex = currentPage - 1;
    const page = pages[pageIndex];
    
    // Obtener dimensiones de la página
    const { width, height } = page.getSize();
    
    // Limpiar la página original (eliminar todo su contenido)
    // Esto no es posible directamente con pdf-lib, pero podemos sobrescribir con la imagen a página completa
    
    // Dibujar la imagen modificada en la página
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    
    // Serializar el PDF modificado
    const pdfBytes = await pdfDoc.save();
    
    // Crear un Blob con los bytes del PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Descargar el archivo
    const fileName = originalPdfFile.name.replace('.pdf', '_editado.pdf');
    saveAs(blob, fileName);
    
    toast.success('PDF modificado descargado correctamente');
  } catch (error) {
    console.error('Error al guardar el PDF modificado:', error);
    toast.error('Error al guardar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
  }
};
