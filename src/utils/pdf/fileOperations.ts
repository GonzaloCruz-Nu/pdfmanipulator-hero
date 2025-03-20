
import { toast } from 'sonner';

/**
 * Create a Word file from a DOCX blob
 */
export const createWordFile = (blob: Blob, originalFileName: string): File => {
  // Create Word file with descriptive name
  const docxFile = new File(
    [blob],
    `${originalFileName.replace('.pdf', '')}_convertido.docx`,
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  );
  
  console.log('Word file created:', docxFile.name, 'size:', 
    docxFile.size > 1024 * 1024 
      ? (docxFile.size / 1024 / 1024).toFixed(2) + ' MB' 
      : (docxFile.size / 1024).toFixed(2) + ' KB'
  );
  
  return docxFile;
};

/**
 * Download a file to the user's device
 */
export const downloadFile = (file: File): void => {
  try {
    // Additional verification before download
    if (file.size === 0) {
      throw new Error('The file to download is empty');
    }
    
    // Download the file directly
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Word document downloaded successfully');
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Error downloading file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};
