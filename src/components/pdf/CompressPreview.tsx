
import React from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileCheck } from 'lucide-react';
import PdfPreview from '@/components/PdfPreview';

interface CompressPreviewProps {
  files: File[];
  compressedFiles: File[];
  selectedFileIndex: number;
  setSelectedFileIndex: (index: number) => void;
}

const CompressPreview: React.FC<CompressPreviewProps> = ({
  files,
  compressedFiles,
  selectedFileIndex,
  setSelectedFileIndex
}) => {
  const previewFile = selectedFileIndex < compressedFiles.length ? 
                      compressedFiles[selectedFileIndex] : 
                      (files.length > 0 ? files[selectedFileIndex] : null);

  const maxFileIndex = Math.max(files.length - 1, compressedFiles.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="bg-white rounded-xl p-6 shadow-subtle h-full">
        <h2 className="text-xl font-bold mb-4">2. Vista previa</h2>
        
        {files.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <button 
                disabled={selectedFileIndex === 0}
                onClick={() => setSelectedFileIndex(Math.max(0, selectedFileIndex - 1))}
                className={`text-sm px-2 py-1 rounded ${selectedFileIndex === 0 ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                Anterior
              </button>
              <span className="text-sm">
                Archivo {selectedFileIndex + 1} de {Math.max(files.length, compressedFiles.length)}
              </span>
              <button 
                disabled={selectedFileIndex >= maxFileIndex}
                onClick={() => setSelectedFileIndex(Math.min(maxFileIndex, selectedFileIndex + 1))}
                className={`text-sm px-2 py-1 rounded ${selectedFileIndex >= maxFileIndex ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
        
        {previewFile ? (
          <PdfPreview 
            file={previewFile}
            className={selectedFileIndex < compressedFiles.length && compressedFiles[selectedFileIndex] ? "border-2 border-green-500" : ""}
            showEditor={false}
          />
        ) : (
          <div className="h-[400px] flex items-center justify-center bg-secondary/50 rounded-xl">
            <div className="text-center p-6">
              <FileDown className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Selecciona un PDF para ver la vista previa
              </p>
            </div>
          </div>
        )}

        {selectedFileIndex < compressedFiles.length && compressedFiles[selectedFileIndex] && (
          <div className="mt-4 flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-600 font-medium">
              Mostrando PDF comprimido
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CompressPreview;
