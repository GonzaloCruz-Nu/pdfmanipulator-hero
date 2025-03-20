
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileOutput, ChevronDown, Download, FileText } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PdfPreview from '@/components/PdfPreview';
import { useConvertPDF } from '@/hooks/useConvertPDF';

const ConvertPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>('jpeg');
  
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
      await convertPDF(file, format);
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
          <h1 className="text-3xl font-bold mb-4">Convertir PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Convierte tus documentos PDF a otros formatos como imágenes (JPEG, PNG) o texto. 
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
            </div>

            <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
              <h2 className="text-xl font-semibold">Opciones de conversión</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato de salida</label>
                <Select
                  value={format}
                  onValueChange={setFormat}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpeg">Imagen JPEG</SelectItem>
                    <SelectItem value="png">Imagen PNG</SelectItem>
                    <SelectItem value="text">Texto plano</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecciona el formato al que deseas convertir tu PDF
                </p>
              </div>
              
              <Button 
                onClick={handleConvert} 
                disabled={!file || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Convirtiendo... {progress}%
                  </>
                ) : (
                  'Convertir PDF'
                )}
              </Button>
            </div>

            {convertedFiles.length > 0 && (
              <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
                <h2 className="text-xl font-semibold">Archivos convertidos</h2>
                <ul className="space-y-2">
                  {convertedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between rounded-md bg-secondary/50 p-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
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
                  Descargar archivos
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
