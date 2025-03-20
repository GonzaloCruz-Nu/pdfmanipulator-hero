
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Merge, FilePlus2, Download, AlertCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';

const MergePDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setSelectedFile(selectedFiles[0] || null);
  };

  const handlePreviewFile = (file: File) => {
    setSelectedFile(file);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      toast.error('Se necesitan al menos 2 archivos PDF para unir');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      // Crear un nuevo documento PDF
      const mergedPdf = await PDFDocument.create();
      
      // Procesar cada archivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileArrayBuffer = await file.arrayBuffer();
        
        // Cargar el PDF
        const pdf = await PDFDocument.load(fileArrayBuffer);
        
        // Copiar todas las páginas al documento final
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => {
          mergedPdf.addPage(page);
        });
        
        // Actualizar progreso
        setProgress(Math.floor(((i + 1) / files.length) * 100));
      }
      
      // Guardar el documento final
      const mergedPdfBytes = await mergedPdf.save();
      
      // Crear un blob y descargar
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentos_unidos.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      toast.success('PDFs unidos con éxito');
    } catch (error) {
      console.error('Error al unir PDFs:', error);
      toast.error('Error al unir PDFs');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
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
              <Merge className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Unir PDFs</h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Combina múltiples documentos PDF en un solo archivo. Arrastra y suelta tus PDFs,
            organízalos y únelos con un solo clic.
          </p>
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
                maxFiles={20}
              />

              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-2">Reordenar archivos</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Haz clic en un archivo para previsualizarlo. Los archivos se unirán en el orden mostrado.
                  </p>
                  <div className="max-h-40 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li 
                          key={`${file.name}-${index}`}
                          className={`cursor-pointer p-2 rounded-md text-sm flex items-center ${selectedFile === file ? 'bg-primary/10' : 'bg-secondary/50 hover:bg-secondary'}`}
                          onClick={() => handlePreviewFile(file)}
                        >
                          <FilePlus2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={mergePDFs}
                  disabled={isProcessing || files.length < 2}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando {progress}%
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Unir PDFs
                    </>
                  )}
                </button>
              </div>

              {files.length === 0 && (
                <div className="mt-6 flex items-center p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    Selecciona al menos 2 archivos PDF para comenzar a unirlos.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-xl p-6 shadow-subtle h-full">
              <h2 className="text-xl font-bold mb-4">2. Vista previa</h2>
              
              {selectedFile ? (
                <PdfPreview 
                  file={selectedFile}
                  onClose={() => setSelectedFile(null)}
                  showEditor={false} // Explicitly set to false
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-secondary/50 rounded-xl">
                  <div className="text-center p-6">
                    <FilePlus2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Selecciona un PDF para ver la vista previa
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default MergePDF;
