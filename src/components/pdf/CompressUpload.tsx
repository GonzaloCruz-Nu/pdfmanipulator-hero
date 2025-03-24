
import React from 'react';
import { motion } from 'framer-motion';
import { Info, Archive } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import CompressionControls from '@/components/pdf/CompressionControls';
import CompressionResults from '@/components/pdf/CompressionResults';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CompressUploadProps {
  onFilesSelected: (files: File[]) => void;
  files: File[];
  compressionLevel: 'low' | 'medium' | 'high';
  setCompressionLevel: (level: 'low' | 'medium' | 'high') => void;
  handleCompressPDFs: () => void;
  isProcessing: boolean;
  progress: number;
  currentProcessingIndex: number;
  totalFiles: number;
  compressionInfo: any;
  compressionError: string | null;
  compressedFiles: File[];
  downloadCompressedFile: (index: number) => void;
  downloadAllAsZip: () => void;
  selectedFileIndex: number;
  totalStats: {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavedPercentage: number;
    fileCount: number;
  } | null;
}

const CompressUpload: React.FC<CompressUploadProps> = ({
  onFilesSelected,
  files,
  compressionLevel,
  setCompressionLevel,
  handleCompressPDFs,
  isProcessing,
  progress,
  currentProcessingIndex,
  totalFiles,
  compressionInfo,
  compressionError,
  compressedFiles,
  downloadCompressedFile,
  downloadAllAsZip,
  selectedFileIndex,
  totalStats
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="bg-white rounded-xl p-6 shadow-subtle h-full">
        <h2 className="text-xl font-bold mb-4">1. Selecciona archivos PDF</h2>
        
        <FileUpload 
          onFilesSelected={onFilesSelected}
          multiple={true}
          accept=".pdf"
          maxFiles={10}
          infoText="Arrastra PDFs aquí o haz clic para buscar"
        />

        {files.length > 1 && (
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Has seleccionado {files.length} archivos. Todos serán comprimidos con el mismo nivel.
            </AlertDescription>
          </Alert>
        )}

        {files.length > 0 && compressedFiles.length > 1 && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={downloadAllAsZip}
              className="bg-naranja text-white hover:bg-naranja/90 flex items-center justify-center py-2 px-4 w-full"
            >
              <Archive className="h-5 w-5 mr-2" />
              Descargar todos como ZIP ({compressedFiles.length} archivos)
            </Button>
          </div>
        )}

        <CompressionControls 
          file={files.length > 0 ? files[0] : null}
          compressionLevel={compressionLevel}
          setCompressionLevel={setCompressionLevel}
          onCompress={handleCompressPDFs}
          isProcessing={isProcessing}
          progress={progress}
          currentFile={currentProcessingIndex + 1}
          totalFiles={totalFiles}
        />

        <CompressionResults 
          compressionInfo={compressionInfo}
          compressionError={compressionError}
          compressedFile={compressedFiles[selectedFileIndex] || null}
          onDownload={() => downloadCompressedFile(selectedFileIndex)}
          file={files.length > 0 ? files[selectedFileIndex] : null}
          multipleFiles={files.length > 1}
          totalStats={totalStats}
        />
      </div>
    </motion.div>
  );
};

export default CompressUpload;
