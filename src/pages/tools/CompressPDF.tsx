
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMultipleCompressPDF } from '@/hooks/useMultipleCompressPDF';
import { calculateTotalCompressionStats } from '@/services/pdfCompressionService';
import { isWasmSupported } from '@/utils/pdf/pdfRenderUtils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Layout from '@/components/Layout';
import CompressHeader from '@/components/pdf/CompressHeader';
import CompressUpload from '@/components/pdf/CompressUpload';
import CompressPreview from '@/components/pdf/CompressPreview';
import type { CompressionLevel } from '@/utils/pdf/compression-types';

const CompressPDF: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [wasmSupported, setWasmSupported] = useState<boolean | null>(null);
  
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
    totalFiles,
    isDownloadingZip
  } = useMultipleCompressPDF();
  
  useEffect(() => {
    // Check WebAssembly support on component mount
    setWasmSupported(isWasmSupported());
  }, []);
  
  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
    setSelectedFileIndex(0);
  };
  
  const handleCompressPDFs = async () => {
    if (files.length === 0) return;
    await compressMultiplePDFs(files, compressionLevel);
  };
  
  // Calculate compression statistics for all files
  const totalStats = compressedFiles.length > 0 ? 
    calculateTotalCompressionStats(files, compressedFiles) : 
    null;
  
  return (
    <>
      <Header />
      <Layout>
        <div className="container mx-auto py-8">
          <CompressHeader wasmSupported={wasmSupported} />
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
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
              isDownloadingZip={isDownloadingZip}
            />
            
            <CompressPreview 
              files={files}
              compressedFiles={compressedFiles}
              selectedFileIndex={selectedFileIndex}
              setSelectedFileIndex={setSelectedFileIndex}
            />
          </motion.div>
        </div>
      </Layout>
      <Footer />
    </>
  );
};

export default CompressPDF;
