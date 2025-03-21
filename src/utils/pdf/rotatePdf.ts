
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

/**
 * Rota las páginas de un PDF según los ángulos especificados y guarda el archivo
 * @param originalPdfFile Archivo PDF original
 * @param rotationAngles Objeto con los ángulos de rotación por número de página
 */
export const rotatePdfPage = async (
  originalPdfFile: File, 
  rotationAngles: { [key: number]: number }
): Promise<void> => {
  try {
    // Leer el archivo original como ArrayBuffer
    const originalPdfBytes = await originalPdfFile.arrayBuffer();
    
    // Cargar el PDF original
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    
    // Obtener todas las páginas
    const pages = pdfDoc.getPages();
    
    // Aplicar rotaciones a cada página
    Object.entries(rotationAngles).forEach(([pageNumStr, angle]) => {
      const pageIndex = parseInt(pageNumStr, 10) - 1; // Ajustar índice (la página 1 es el índice 0)
      
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        
        // Convertir ángulo a múltiplos de 90 (pdf-lib solo acepta 0, 90, 180, 270)
        const normalizedAngle = (Math.round(angle / 90) * 90) % 360;
        
        // Establecer la rotación
        page.setRotation({
          angle: normalizedAngle,
          type: 'degrees',
        });
        
        console.log(`Rotated page ${pageIndex + 1} by ${normalizedAngle} degrees`);
      }
    });
    
    // Serializar el PDF modificado
    const pdfBytes = await pdfDoc.save();
    
    // Crear un Blob con los bytes del PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Descargar el archivo
    const fileName = originalPdfFile.name.replace('.pdf', '_rotado.pdf');
    saveAs(blob, fileName);
    
    console.log('PDF rotado guardado correctamente');
    
  } catch (error) {
    console.error('Error al rotar PDF:', error);
    toast.error('Error al rotar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    throw error;
  }
};
