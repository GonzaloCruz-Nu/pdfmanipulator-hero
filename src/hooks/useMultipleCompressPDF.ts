
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
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

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
            // Verificar que el resultado no sea mayor que el original x1.5
            // Es un control adicional a los que ya hay en processPdfFile
            if (compressedFile.size > file.size * 1.5) {
              console.error(`Resultado de compresión excesivamente grande detectado: ${(compressedFile.size/1024/1024).toFixed(2)}MB vs ${(file.size/1024/1024).toFixed(2)}MB. Usando original.`);
              
              // Usar una copia del original en su lugar
              const originalCopy = await createFallbackCopy(file);
              if (originalCopy) {
                compressedFilesArray.push(originalCopy);
                console.warn(`Se usó una copia del original para ${file.name} para evitar aumento excesivo de tamaño`);
              }
            } else {
              // Resultado normal, calcular estadísticas y agregarlo
              const compressionResult = calculateCompressionStats(fileSize, compressedFile.size);
              compressedFilesArray.push(compressedFile);
              console.info(`File ${i+1} processed successfully: ${compressionResult.savedPercentage.toFixed(1)}% saved`);
              
              // Si es el último archivo o hay un solo archivo, mostrar info
              if (i === files.length - 1 || files.length === 1) {
                setCompressionInfo(compressionResult);
                
                if (files.length === 1) {
                  toast.success(`PDF procesado correctamente. ${compressionResult.savedPercentage > 0 ? 
                    `Reducción: ${compressionResult.savedPercentage.toFixed(1)}%` : 
                    'Sin reducción de tamaño'}`);
                } else {
                  toast.success(`Todos los PDFs procesados correctamente.`);
                }
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
              setCompressionError('No se pudo procesar el PDF. Intenta con otro nivel de compresión.');
              toast.error('No se pudo procesar el PDF.');
            } else {
              toast.warning(`No se pudo procesar el archivo ${file.name}.`);
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
        setCompressionError('No se pudo procesar ningún archivo PDF. Intenta con otro nivel de compresión.');
      }
      
    } catch (error) {
      console.error('Error compressing PDFs:', error);
      setCompressionError('Error al procesar PDFs. Intenta con otros archivos o nivel de compresión.');
      toast.error('Error al comprimir PDFs.');
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
      toast.error('No hay archivos comprimidos para descargar');
      return;
    }
    
    try {
      setIsDownloadingZip(true);
      toast.loading('Preparando archivos para descarga...', { id: 'zip-download' });
      
      console.info(`Creating ZIP with ${compressedFiles.length} files`);
      const result = await createAndDownloadZip(compressedFiles);
      
      if (result) {
        toast.success('ZIP descargado correctamente', { id: 'zip-download' });
      } else {
        toast.error('Error al crear el ZIP', { id: 'zip-download' });
      }
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      toast.error('Error al descargar los archivos');
    } finally {
      setIsDownloadingZip(false);
    }
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
    totalFiles,
    isDownloadingZip
  };
};
