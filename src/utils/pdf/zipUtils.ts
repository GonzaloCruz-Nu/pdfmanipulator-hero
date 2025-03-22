
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

/**
 * Creates and downloads a ZIP file containing the provided PDF files
 */
export async function createAndDownloadZip(files: File[]): Promise<boolean> {
  if (files.length === 0) {
    toast.error('No files to compress');
    return false;
  }
  
  try {
    // Show initial progress toast
    toast.loading('Preparing files for compression...', { id: 'zip-creation' });
    
    const zip = new JSZip();
    
    // Add all compressed files to the ZIP
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.info(`Adding to ZIP (${i+1}/${files.length}): ${file.name} (${file.size} bytes)`);
      
      // Update the progress toast
      toast.loading(`Adding file ${i+1} of ${files.length}...`, { id: 'zip-creation' });
      
      // Convert the file to ArrayBuffer directly and safely
      try {
        const fileData = await file.arrayBuffer();
        zip.file(file.name, fileData);
        console.info(`File ${i+1} added successfully`);
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        toast.error(`Error processing file ${file.name}`);
        return false;
      }
    }
    
    // Update progress toast
    toast.loading('Generating ZIP file...', { id: 'zip-creation' });
    
    console.info('Generating final ZIP file...');
    
    // Generate the ZIP file with a promise and improved error handling
    try {
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6 // Medium compression level for ZIP
        }
      });
      
      console.info(`ZIP file generated successfully: ${zipBlob.size} bytes`);
      
      // Download the ZIP file using FileSaver
      saveAs(zipBlob, 'pdfs_comprimidos.zip');
      
      // Mark the process as completed
      toast.success('Files downloaded as ZIP', { id: 'zip-creation' });
      return true;
    } catch (zipError) {
      console.error('Error generating ZIP file:', zipError);
      toast.error('Error generating ZIP file', { id: 'zip-creation' });
      return false;
    }
  } catch (error) {
    console.error('General error creating ZIP:', error);
    toast.error('Error creating ZIP file');
    return false;
  }
}
