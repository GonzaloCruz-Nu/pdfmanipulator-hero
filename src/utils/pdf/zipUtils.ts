
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

/**
 * Creates and downloads a ZIP file containing the provided PDF files
 */
export async function createAndDownloadZip(files: File[]): Promise<boolean> {
  if (files.length === 0) {
    toast.error('No hay archivos para comprimir');
    return false;
  }
  
  try {
    // Show initial progress toast
    toast.loading('Preparando archivos para compresión...', { id: 'zip-creation' });
    
    const zip = new JSZip();
    
    // Add all compressed files to the ZIP
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.info(`Adding to ZIP (${i+1}/${files.length}): ${file.name} (${file.size} bytes)`);
      
      // Update the progress toast
      toast.loading(`Agregando archivo ${i+1} de ${files.length}...`, { id: 'zip-creation' });
      
      // Convert the file to ArrayBuffer directly and safely
      try {
        const fileData = await file.arrayBuffer();
        zip.file(file.name, fileData);
        console.info(`File ${i+1} added successfully`);
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        toast.error(`Error al procesar el archivo ${file.name}`);
        // Continue with other files even if one fails
      }
    }
    
    // Update progress toast
    toast.loading('Generando archivo ZIP...', { id: 'zip-creation' });
    
    console.info('Generating final ZIP file...');
    
    // Generate the ZIP file with a promise and improved error handling
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6 // Medium compression level for ZIP
      }
    });
    
    console.info(`ZIP file generated successfully: ${zipBlob.size} bytes`);
    
    // Download the ZIP file using FileSaver
    const zipName = files.length > 1 ? 'pdfs_comprimidos.zip' : files[0].name.replace('.pdf', '_comprimido.zip');
    saveAs(zipBlob, zipName);
    
    // Mark the process as completed
    toast.success('Archivos descargados como ZIP', { id: 'zip-creation' });
    return true;
  } catch (error) {
    console.error('Error al crear ZIP:', error);
    toast.error('Error al crear el archivo ZIP', { id: 'zip-creation' });
    return false;
  }
}
