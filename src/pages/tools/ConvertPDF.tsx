
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileType, Download, FileText, Info, AlertTriangle, Scan } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import PdfPreview from '@/components/PdfPreview';
import { useConvertPDF } from '@/hooks/useConvertPDF';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

const ConvertPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [conversionStarted, setConversionStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { 
    convertPDF, 
    isProcessing, 
    progress, 
    convertedFiles,
    downloadConvertedFiles
  } = useConvertPDF();

  // Resetear el estado cuando se selecciona un nuevo archivo
  useEffect(() => {
    setConversionStarted(false);
    setErrorMessage(null);
  }, [file]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      console.log('Archivo seleccionado:', files[0].name, 'tamaño:', (files[0].size / 1024 / 1024).toFixed(2), 'MB');
    } else {
      setFile(null);
    }
  };

  const handleConvert = async () => {
    if (file) {
      try {
        setConversionStarted(true);
        setErrorMessage(null);
        console.log('Iniciando conversión para:', file.name);
        const result = await convertPDF(file, 'docx');
        
        if (result.success) {
          // Mostrar tamaño en KB para archivos pequeños
          const fileSize = result.files[0].size;
          const fileSizeFormatted = fileSize > 1024 * 1024 
            ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' 
            : (fileSize / 1024).toFixed(2) + ' KB';
            
          // Umbrales actualizados para avisos:
          // - Si el Word es menor a 20KB y el PDF es mayor a 200KB = advertencia fuerte
          // - Si el Word es menor a 50KB y el PDF es mayor a 500KB = advertencia leve
          if (fileSize < 20000 && file.size > 200000) {
            toast.warning(`El documento Word generado es muy pequeño (${fileSizeFormatted}). Es probable que el PDF contenga principalmente imágenes o texto no extraíble.`);
          } else if (fileSize < 50000 && file.size > 500000) {
            toast.warning(`El documento Word (${fileSizeFormatted}) es considerablemente más pequeño que el PDF original. Algunas imágenes o elementos complejos pueden no haberse convertido.`);
          } else {
            toast.success(`PDF convertido exitosamente a Word (${fileSizeFormatted})`);
          }
          console.log('Conversión completada con éxito, resultado:', result);
        } else {
          setErrorMessage(result.message);
          toast.error(result.message || 'Error al convertir el PDF');
          console.error('Error en la conversión:', result.message);
        }
      } catch (error) {
        console.error('Error en conversión:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al convertir');
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
            <FileType className="h-6 w-6 text-primary" />
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
                  Archivo: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
              <h2 className="text-xl font-semibold">Convertir a Word (DOCX)</h2>
              
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Esta herramienta extrae el texto del PDF y genera un documento Word editable. 
                  Los documentos escaneados o con imágenes pueden requerir OCR adicional.
                </AlertDescription>
              </Alert>
              
              {isProcessing && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso de conversión</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress < 20 ? "Cargando PDF..." : 
                     progress < 40 ? "Extrayendo texto..." : 
                     progress < 70 ? "Analizando contenido..." : 
                     progress < 85 ? "Generando documento Word..." : 
                     "Completando conversión..."}
                  </p>
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
                  {convertedFiles.map((convertedFile, index) => {
                    // Mostrar tamaño siempre en KB para archivos pequeños
                    const fileSize = convertedFile.size;
                    const fileSizeFormatted = fileSize > 1024 * 1024 
                      ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' 
                      : (fileSize / 1024).toFixed(2) + ' KB';
                    
                    // Mostrar tamaño como porcentaje del original
                    const sizePercentage = file ? ((convertedFile.size / file.size) * 100).toFixed(1) + '%' : '';
                    
                    return (
                      <li key={index} className="flex items-center justify-between rounded-md bg-secondary/50 p-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{convertedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({fileSizeFormatted})
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Button 
                  onClick={downloadConvertedFiles} 
                  variant="secondary"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" /> 
                  Descargar documento Word
                </Button>
                
                {/* Advertencia mejorada para archivos muy pequeños */}
                {convertedFiles[0]?.size < 20000 && file && file.size > 200000 && (
                  <Alert className="mt-2 bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-xs text-amber-800">
                      <p className="font-semibold">Documento Word muy pequeño detectado:</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>PDF original: {(file.size / (1024 * 1024)).toFixed(2)} MB</li>
                        <li>Word generado: {(convertedFiles[0].size / 1024).toFixed(2)} KB</li>
                        <li>Porcentaje del tamaño original: {((convertedFiles[0].size / file.size) * 100).toFixed(2)}%</li>
                      </ul>
                      <p className="mt-2">
                        El PDF podría contener principalmente imágenes, gráficos o texto no extraíble.
                      </p>
                      <div className="mt-2">
                        <Link to="/tools/ocr" className="text-primary flex items-center">
                          <Scan className="h-3 w-3 mr-1" /> Intenta nuestra herramienta OCR para documentos escaneados
                        </Link>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {conversionStarted && !isProcessing && convertedFiles.length === 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || 'No se pudo generar el documento Word. El archivo PDF podría estar protegido o contener solo imágenes.'}
                  <div className="mt-2">
                    <Link to="/tools/ocr" className="text-white/90 hover:text-white flex items-center">
                      <Scan className="h-3 w-3 mr-1" /> Intenta con la herramienta OCR para documentos escaneados
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
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
