
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { useMultipleCompressPDF } from '@/hooks/useMultipleCompressPDF';
import CompressHeader from '@/components/pdf/CompressHeader';
import CompressUpload from '@/components/pdf/CompressUpload';
import CompressPreview from '@/components/pdf/CompressPreview';

const isWasmSupported = (): boolean => {
  try {
    return typeof WebAssembly === 'object' && 
           typeof WebAssembly.instantiate === 'function' &&
           typeof WebAssembly.compile === 'function';
  } catch (e) {
    console.error('Error checking WebAssembly support:', e);
    return false;
  }
};

const CompressPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [wasmSupported, setWasmSupported] = useState<boolean | null>(null);
  const [totalStats, setTotalStats] = useState<{
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavedPercentage: number;
    fileCount: number;
  } | null>(null);
  
  const {
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
  } = useMultipleCompressPDF();

  useEffect(() => {
    setWasmSupported(isWasmSupported());
  }, []);

  useEffect(() => {
    if (compressedFiles.length > 0 && selectedFileIndex >= compressedFiles.length) {
      setSelectedFileIndex(compressedFiles.length - 1);
    }
    
    // Calcular estadísticas agregadas cuando hay archivos comprimidos
    if (compressedFiles.length > 0 && files.length > 0) {
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;
      
      // Sumar tamaños originales
      for (let i = 0; i < Math.min(files.length, compressedFiles.length); i++) {
        totalOriginalSize += files[i].size;
        totalCompressedSize += compressedFiles[i].size;
      }
      
      // Calcular porcentaje de reducción global
      const totalSavedPercentage = Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 1000) / 10;
      
      setTotalStats({
        totalOriginalSize,
        totalCompressedSize,
        totalSavedPercentage,
        fileCount: compressedFiles.length
      });
      
      console.info(`Estadísticas totales calculadas: ${totalOriginalSize} bytes originales, ${totalCompressedSize} bytes comprimidos, ${totalSavedPercentage.toFixed(1)}% de ahorro`);
    } else {
      setTotalStats(null);
    }
  }, [compressedFiles, files, selectedFileIndex]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      console.info(`${selectedFiles.length} archivos seleccionados`);
      setFiles(selectedFiles);
      setSelectedFileIndex(0); // Reset to first file
    } else {
      setFiles([]);
    }
  };

  const handleCompressPDFs = () => {
    console.info(`Iniciando compresión de ${files.length} archivos con nivel ${compressionLevel}`);
    compressMultiplePDFs(files, compressionLevel);
  };

  console.info(`Estado actual: ${files.length} archivos originales, ${compressedFiles.length} comprimidos, índice seleccionado: ${selectedFileIndex}`);

  return (
    <Layout>
      <Header />
      
      <div className="py-8">
        <CompressHeader wasmSupported={wasmSupported} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CompressUpload 
            onFilesSelected={handleFilesSelected}
            files={files}
            compressionLevel={compressionLevel}
            setCompressionLevel={setCompressionLevel}
            handleCompressPDFs={handleCompressPDFs}
            isProcessing={isProcessing}
            progress={progress}
            currentProcessingIndex={currentProcessingIndex}
            totalFiles={totalFiles}
            compressionInfo={compressionInfo}
            compressionError={compressionError}
            compressedFiles={compressedFiles}
            downloadCompressedFile={downloadCompressedFile}
            downloadAllAsZip={downloadAllAsZip}
            selectedFileIndex={selectedFileIndex}
            totalStats={totalStats}
          />

          <CompressPreview 
            files={files}
            compressedFiles={compressedFiles}
            selectedFileIndex={selectedFileIndex}
            setSelectedFileIndex={setSelectedFileIndex}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CompressPDF;
