
import { useState } from 'react';
import { toast } from 'sonner';
import { calculateCompressionStats } from '@/services/pdfCompressionService';
import { createAndDownloadZip } from '@/utils/pdf/zipUtils';
import { 
  processPdfFile, 
  createFallbackCopy, 
  showCompressionResultToast 
} from '@/services/multipleCompressionService';
import { downloadFile } from '@/utils/pdf/download-utils';
import type { CompressionLevel, CompressionInfo } from '@/utils/pdf/compression-types';

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
      let processingErrors = 0;
      
      // Process each file sequentially
      for (let i = 0; i < files.length; i++) {
        setCurrentProcessingIndex(i);
        const file = files[i];
        
        // Get original size
        const fileSize = file.size;
        
        try {
          // Process the file
          const compressedFile = await processPdfFile(
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
            processingErrors++;
            console.error(`Error processing file ${i+1}: ${file.name}`);
            
            // Try to create an exact copy as a last resort
            const fallbackFile = await createFallbackCopy(file);
            if (fallbackFile) {
              compressedFilesArray.push(fallbackFile);
              console.warn(`Created uncompressed copy for ${file.name}`);
            }
            
            if (files.length === 1) {
              setCompressionError('Could not process the PDF. Try with another compression level.');
              toast.error('Could not process the PDF.');
            } else {
              toast.warning(`File ${file.name} could not be processed.`);
            }
          }
        } catch (fileError) {
          processingErrors++;
          console.error(`Error processing file ${file.name}:`, fileError);
          
          // Try to create a copy as a last resort
          const fallbackFile = await createFallbackCopy(file);
          if (fallbackFile) {
            compressedFilesArray.push(fallbackFile);
            console.warn(`Created uncompressed copy for ${file.name}`);
          }
        }
      }
      
      // Complete the process
      setCompressedFiles(compressedFilesArray);
      
      // Show appropriate toast message
      showCompressionResultToast(compressedFilesArray, files, processingErrors);
      
      if (compressedFilesArray.length === 0) {
        setCompressionError('Could not process any PDF files. Try with another compression level.');
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
    downloadFile(compressedFiles[index]);
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
