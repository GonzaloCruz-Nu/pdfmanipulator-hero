
import { useState } from 'react';
import { toast } from 'sonner';
import { compressPDF, calculateCompressionStats, CompressionLevel } from '@/services/pdfCompressionService';
import { createAndDownloadZip } from '@/utils/pdf/zipUtils';

export interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

export const useMultipleCompressPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [compressedFiles, setCompressedFiles] = useState<File[]>([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  /**
   * Main function to compress multiple PDFs
   */
  const compressMultiplePDFs = async (files: File[], compressionLevel: CompressionLevel) => {
    if (!files.length) {
      toast.error('Por favor, selecciona al menos un archivo PDF');
      return;
    }

    try {
      // Reset state
      setIsProcessing(true);
      setCompressionError(null);
      setCompressedFiles([]);
      setCompressionInfo(null);
      setProgress(0);
      setTotalFiles(files.length);
      
      const compressedFilesArray: File[] = [];
      
      // Process each file sequentially
      for (let i = 0; i < files.length; i++) {
        setCurrentProcessingIndex(i);
        const file = files[i];
        
        console.info(`Processing file ${i+1}/${files.length}: ${file.name}`);
        
        // Get original size
        const fileSize = file.size;
        
        // Compress using canvas-based method
        const compressedFile = await compressPDF(
          file, 
          compressionLevel, 
          i, 
          files.length, 
          (progressValue) => setProgress(progressValue)
        );
        
        if (compressedFile) {
          const compressionResult = calculateCompressionStats(fileSize, compressedFile.size);
          
          // Accept files even if compression didn't reduce size
          compressedFilesArray.push(compressedFile);
          console.info(`File ${i+1} processed successfully: ${compressionResult.savedPercentage.toFixed(1)}% saved`);
          
          // If it's the last file or there's only one file, show compression info
          if (i === files.length - 1 || files.length === 1) {
            setCompressionInfo(compressionResult);
            
            if (files.length === 1) {
              toast.success(`PDF processed successfully. Savings: ${compressionResult.savedPercentage > 0 ? compressionResult.savedPercentage.toFixed(1) + '%' : 'no size reduction'}`);
            } else {
              toast.success(`All PDFs processed successfully.`);
            }
          }
        } else {
          console.error(`Error processing file ${i+1}: ${file.name}`);
          if (files.length === 1) {
            setCompressionError('Could not process the PDF. Try with another compression level.');
            toast.error('Could not process the PDF.');
          } else {
            toast.warning(`File ${file.name} could not be processed.`);
          }
        }
      }
      
      // Complete the process
      setCompressedFiles(compressedFilesArray);
      
      if (compressedFilesArray.length === 0) {
        setCompressionError('Could not process any PDF files. Try with another compression level.');
        toast.error('Error processing PDF files.');
      } else if (compressedFilesArray.length < files.length) {
        toast.warning(`Processed ${compressedFilesArray.length} of ${files.length} files.`);
      } else {
        toast.success(`Processed ${files.length} files correctly.`);
      }
      
    } catch (error) {
      console.error('Error compressing PDFs:', error);
      setCompressionError('Error processing PDFs. Try with other files or compression level.');
      toast.error('Error compressing PDFs.');
    } finally {
      // Ensure progress is completed
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  /**
   * Function to download a specific compressed file
   */
  const downloadCompressedFile = (index: number) => {
    if (index < 0 || index >= compressedFiles.length) {
      console.error(`Index out of range: ${index}, total files: ${compressedFiles.length}`);
      return;
    }
    
    console.info(`Downloading file at index ${index}`);
    const file = compressedFiles[index];
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF downloaded successfully');
  };

  /**
   * Function to download all compressed files as ZIP
   */
  const downloadAllAsZip = async () => {
    if (compressedFiles.length === 0) {
      toast.error('No compressed files to download');
      return;
    }
    
    await createAndDownloadZip(compressedFiles);
  };

  return {
    compressMultiplePDFs,
    isProcessing,
    progress,
    compressionInfo,
    compressionError,
    compressedFiles,
    downloadCompressedFile,
    downloadAllAsZip,
    currentProcessingIndex,
    totalFiles
  };
};
