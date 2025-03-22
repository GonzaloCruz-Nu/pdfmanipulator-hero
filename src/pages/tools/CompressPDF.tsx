
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, FileDown, FileCheck, Archive, Cpu } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import CompressionControls from '@/components/pdf/CompressionControls';
import CompressionResults from '@/components/pdf/CompressionResults';
import { useMultipleCompressPDF } from '@/hooks/useMultipleCompressPDF';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateCompression } from '@/utils/pdf/compression-utils';

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

  const previewFile = selectedFileIndex < compressedFiles.length ? 
                      compressedFiles[selectedFileIndex] : 
                      (files.length > 0 ? files[selectedFileIndex] : null);

  const maxFileIndex = Math.max(files.length - 1, compressedFiles.length - 1);

  console.info(`Estado actual: ${files.length} archivos originales, ${compressedFiles.length} comprimidos, índice seleccionado: ${selectedFileIndex}`);

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
            <div className="bg-naranja/10 p-3 rounded-full">
              <Zap className="h-8 w-8 text-naranja" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Comprimir PDF</h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Reduce el tamaño de tus archivos PDF sin perder calidad significativa.
            Ideal para enviar por correo electrónico o subir a plataformas con límites de tamaño.
          </p>
          
          {wasmSupported && (
            <div className="flex items-center justify-center mt-2">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                <Cpu className="h-3 w-3 mr-1" />
                Optimización WebAssembly activa
              </span>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl p-6 shadow-subtle h-full">
              <h2 className="text-xl font-bold mb-4">1. Selecciona archivos PDF</h2>
              
              <FileUpload 
                onFilesSelected={handleFilesSelected}
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
                      onClick={() => setSelectedFileIndex(prev => Math.max(0, prev - 1))}
                      className={`text-sm px-2 py-1 rounded ${selectedFileIndex === 0 ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
                    >
                      Anterior
                    </button>
                    <span className="text-sm">
                      Archivo {selectedFileIndex + 1} de {Math.max(files.length, compressedFiles.length)}
                    </span>
                    <button 
                      disabled={selectedFileIndex >= maxFileIndex}
                      onClick={() => setSelectedFileIndex(prev => Math.min(maxFileIndex, prev + 1))}
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
        </div>
      </div>
    </Layout>
  );
};

export default CompressPDF;
