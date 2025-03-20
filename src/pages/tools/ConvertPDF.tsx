
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileOutput, Download, FileText } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import PdfPreview from '@/components/PdfPreview';
import { useConvertPDF } from '@/hooks/useConvertPDF';
import { toast } from 'sonner';

const ConvertPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  
  const { 
    convertPDF, 
    isProcessing, 
    progress, 
    convertedFiles,
    downloadConvertedFiles
  } = useConvertPDF();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  const handleConvert = async () => {
    if (file) {
      try {
        await convertPDF(file, 'docx');
        toast.success('PDF convertido exitosamente a Word');
      } catch (error) {
        console.error('Error en conversión:', error);
        toast.error('Error al convertir el PDF a Word');
      }
    } else {
      toast.error('Por favor, selecciona un archivo PDF');
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-8">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="rounded-full bg-primary/10 p-3 inline-flex mb-4">
            <FileOutput className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Convertir PDF a Word</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Convierte tus documentos PDF a formato Word (DOCX) para poder editarlos fácilmente.
            Todo el procesamiento ocurre en tu navegador para mantener tus documentos privados.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
              <h2 className="text-xl font-semibold">Selecciona un PDF</h2>
              <FileUpload 
                onFilesSelected={handleFileSelected}
                multiple={false}
                accept=".pdf"
              />
              
              {file && (
                <div className="text-sm text-muted-foreground mt-2">
                  Archivo: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
              <h2 className="text-xl font-semibold">Convertir a Word (DOCX)</h2>
              
              <div className="rounded-md bg-primary/5 p-4 mb-4">
                <p className="text-sm font-medium">Acerca de la conversión</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta herramienta extrae todo el texto del PDF y lo formatea en un documento Word. 
                  Es ideal para cuando necesitas editar el contenido de un PDF.
                </p>
              </div>
              
              {isProcessing && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              <Button 
                onClick={handleConvert} 
                disabled={!file || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Convirtiendo PDF a Word...
                  </>
                ) : (
                  'Convertir a Word'
                )}
              </Button>
            </div>

            {convertedFiles.length > 0 && (
              <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
                <h2 className="text-xl font-semibold">Archivo convertido</h2>
                <ul className="space-y-2">
                  {convertedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between rounded-md bg-secondary/50 p-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={downloadConvertedFiles} 
                  variant="secondary"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" /> 
                  Descargar documento Word
                </Button>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-subtle p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Vista previa</h2>
            {file ? (
              <PdfPreview file={file} />
            ) : (
              <div className="flex items-center justify-center h-80 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground">
                  Selecciona un PDF para ver la vista previa
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ConvertPDF;
