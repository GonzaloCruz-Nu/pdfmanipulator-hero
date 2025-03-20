
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, FileDown, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import CompressionControls from '@/components/pdf/CompressionControls';
import CompressionResults from '@/components/pdf/CompressionResults';
import { useCompressPDF } from '@/hooks/useCompressPDF';

const CompressPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  const {
    compressPDF,
    isProcessing,
    progress,
    compressionInfo,
    compressionError,
    compressedFile,
    downloadCompressedFile
  } = useCompressPDF();

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
    } else {
      setFile(null);
    }
  };

  const handleCompressPDF = () => {
    compressPDF(file, compressionLevel);
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-8">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/10 p-3 rounded-full">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Comprimir PDF</h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Reduce el tamaño de tus archivos PDF sin perder calidad significativa.
            Ideal para enviar por correo electrónico o subir a plataformas con límites de tamaño.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl p-6 shadow-subtle h-full">
              <h2 className="text-xl font-bold mb-4">1. Selecciona un archivo PDF</h2>
              <FileUpload 
                onFilesSelected={handleFileSelected}
                multiple={false}
                accept=".pdf"
              />

              <CompressionControls 
                file={file}
                compressionLevel={compressionLevel}
                setCompressionLevel={setCompressionLevel}
                onCompress={handleCompressPDF}
                isProcessing={isProcessing}
                progress={progress}
              />

              <CompressionResults 
                compressionInfo={compressionInfo}
                compressionError={compressionError}
                compressedFile={compressedFile}
                onDownload={downloadCompressedFile}
                file={file}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-xl p-6 shadow-subtle h-full">
              <h2 className="text-xl font-bold mb-4">2. Vista previa</h2>
              
              {file ? (
                <PdfPreview 
                  file={compressedFile || file}
                  className={compressedFile ? "border-2 border-green-500" : ""}
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

              {compressedFile && (
                <div className="mt-4 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-600 font-medium">
                    Mostrando PDF comprimido
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CompressPDF;
