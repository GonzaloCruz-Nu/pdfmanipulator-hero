
import { toast } from 'sonner';
import { compressPDF, calculateCompressionStats } from '@/services/pdfCompressionService';
import type { CompressionLevel, CompressionInfo } from '@/utils/pdf/compression-types';

/**
 * Processes a single PDF file for compression
 */
export const processPdfFile = async (
  file: File,
  compressionLevel: CompressionLevel,
  fileIndex: number, 
  totalFiles: number,
  progressCallback: (value: number) => void
): Promise<File | null> => {
  console.info(`Processing file ${fileIndex+1}/${totalFiles}: ${file.name}`);
  
  // Maximum 3 attempts per file
  let compressedFile = null;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (!compressedFile && attempts < maxAttempts) {
    attempts++;
    try {
      // Compress using canvas-based method
      compressedFile = await compressPDF(
        file, 
        compressionLevel, 
        fileIndex, 
        totalFiles, 
        progressCallback
      );
    } catch (attemptError) {
      console.warn(`Attempt ${attempts}/${maxAttempts} failed:`, attemptError);
      
      // If it's the last attempt, create a copy of the original
      if (attempts === maxAttempts) {
        console.warn("Using original file as last resort");
        try {
          const buffer = await file.arrayBuffer();
          compressedFile = new File(
            [buffer],
            `${file.name.replace('.pdf', '')}_copia.pdf`,
            { type: 'application/pdf' }
          );
        } catch (copyError) {
          console.error("Error creating copy:", copyError);
        }
      }
    }
  }
  
  return compressedFile;
};

/**
 * Creates a fallback copy of the original file
 */
export const createFallbackCopy = async (file: File): Promise<File | null> => {
  try {
    const buffer = await file.arrayBuffer();
    return new File(
      [buffer],
      `${file.name.replace('.pdf', '')}_copia.pdf`,
      { type: 'application/pdf' }
    );
  } catch (fallbackError) {
    console.error(`Could not create copy for ${file.name}:`, fallbackError);
    return null;
  }
};

/**
 * Shows appropriate toast message based on compression results
 */
export const showCompressionResultToast = (
  compressedFiles: File[],
  originalFiles: File[],
  processingErrors: number
): void => {
  if (compressedFiles.length === 0) {
    toast.error('Could not process any PDF files. Try with another compression level.');
    return;
  }
  
  if (compressedFiles.length < originalFiles.length) {
    if (processingErrors > 0) {
      toast.warning(`Processed ${compressedFiles.length} of ${originalFiles.length} files. Some files were processed as copies.`);
    } else {
      toast.warning(`Processed ${compressedFiles.length} of ${originalFiles.length} files.`);
    }
  } else {
    if (processingErrors > 0) {
      toast.success(`Processed ${originalFiles.length} files. Some files were processed as copies.`);
    } else {
      toast.success(`Processed ${originalFiles.length} files correctly.`);
    }
  }
};
