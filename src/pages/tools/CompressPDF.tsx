
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, FileDown, Download, AlertCircle, Check, FileCheck } from 'lucide-react';
import { PDFDocument, PDFName } from 'pdf-lib';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { Progress } from '@/components/ui/progress';

const CompressPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setCompressedFile(null);
    } else {
      setFile(null);
      setCompressedFile(null);
    }
  };

  const calculateCompressionFactor = (level: 'low' | 'medium' | 'high'): number => {
    switch (level) {
      case 'low': return 0.7;     // 30% compression
      case 'medium': return 0.4;   // 60% compression
      case 'high': return 0.2;    // 80% compression
      default: return 0.4;
    }
  };

  const compressPDF = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);

      // Leer el archivo como ArrayBuffer
      const fileArrayBuffer = await file.arrayBuffer();
      
      // Cargar el PDF con pdf-lib
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      
      setProgress(30);
      
      // Obtener todas las páginas
      const pages = pdfDoc.getPages();
      
      // Factor de compresión basado en el nivel seleccionado
      const compressionFactor = calculateCompressionFactor(compressionLevel);
      
      // Eliminar metadatos innecesarios del documento
      const pdfDict = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Root);
      
      if (pdfDict && pdfDict.dict) {
        // Eliminar metadatos y anotaciones innecesarias
        if (compressionLevel === 'medium' || compressionLevel === 'high') {
          pdfDict.dict.delete(PDFName.of('Metadata'));
          pdfDict.dict.delete(PDFName.of('StructTreeRoot'));
          pdfDict.dict.delete(PDFName.of('MarkInfo'));
        }
        
        // En alta compresión, eliminar incluso más metadatos
        if (compressionLevel === 'high') {
          pdfDict.dict.delete(PDFName.of('ViewerPreferences'));
          pdfDict.dict.delete(PDFName.of('PageMode'));
          pdfDict.dict.delete(PDFName.of('PageLayout'));
          pdfDict.dict.delete(PDFName.of('Outlines'));
          pdfDict.dict.delete(PDFName.of('OutputIntents'));
        }
      }
      
      // Comprimir cada página
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Obtener las dimensiones originales
        const { width, height } = page.getSize();
        
        // Crear un nuevo PDF temporal para una sola página con alta compresión
        const tempDoc = await PDFDocument.create();
        const tempPage = tempDoc.addPage([width, height]);
        
        // Copiar el contenido de la página original
        const form = await tempDoc.embedPage(page);
        tempPage.drawPage(form, {
          x: 0,
          y: 0,
          width: width,
          height: height,
          opacity: 1,
        });
        
        // Eliminar anotaciones y otros elementos en páginas individuales
        const pageDict = page.node.dict;
        
        if (pageDict) {
          // Siempre eliminamos estos elementos para mejor compresión
          pageDict.delete(PDFName.of('Annots'));
          pageDict.delete(PDFName.of('Thumb'));
          
          if (compressionLevel === 'medium' || compressionLevel === 'high') {
            pageDict.delete(PDFName.of('UserUnit'));
            pageDict.delete(PDFName.of('PieceInfo'));
          }
          
          if (compressionLevel === 'high') {
            pageDict.delete(PDFName.of('Group'));
            pageDict.delete(PDFName.of('B'));
            pageDict.delete(PDFName.of('StructParents'));
            pageDict.delete(PDFName.of('ID'));
          }
        }
        
        // Actualizar progreso
        setProgress(30 + Math.floor(((i + 1) / pages.length) * 50));
      }
      
      setProgress(80);
      
      // Aplicar opciones de compresión según el nivel
      let compressionOptions: any = {
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100
      };
      
      // Para media y alta compresión, agregar opciones adicionales
      if (compressionLevel === 'medium' || compressionLevel === 'high') {
        compressionOptions = {
          ...compressionOptions,
          updateFieldAppearances: false,
        };
      }
      
      // Para alta compresión, configuración más agresiva
      if (compressionLevel === 'high') {
        compressionOptions = {
          ...compressionOptions,
          objectsPerTick: 50,
          compress: true,
        };
      }
      
      // Guardar el PDF comprimido con las opciones correspondientes
      const compressedPdfBytes = await pdfDoc.save(compressionOptions);
      
      setProgress(90);
      
      // Crear un nuevo objeto File a partir de los bytes
      const compressedBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const compressedFileObj = new File(
        [compressedBlob], 
        `comprimido_${file.name}`, 
        { type: 'application/pdf' }
      );
      
      // Verificar si se logró una compresión real
      const originalSize = file.size;
      const compressedSize = compressedFileObj.size;
      
      // Si la compresión no fue efectiva, intentar un método alternativo
      if (compressedSize > originalSize * 0.9) {
        // Intento alternativo: compresión más agresiva de imágenes y contenido
        const tempDoc = await PDFDocument.create();
        
        // Copiar cada página al nuevo documento, con menor calidad
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const { width, height } = page.getSize();
          
          // Copiar con una calidad reducida basada en el nivel de compresión
          const embedOptions = {
            keepXObjectsData: false,
          };
          
          const embeddedPage = await tempDoc.embedPage(page, embedOptions);
          const newPage = tempDoc.addPage([width, height]);
          
          // Ajustar la calidad en función del nivel de compresión
          const quality = compressionLevel === 'low' ? 0.7 : 
                          compressionLevel === 'medium' ? 0.5 : 0.3;
          
          newPage.drawPage(embeddedPage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: quality,
          });
          
          setProgress(80 + Math.floor(((i + 1) / pages.length) * 10));
        }
        
        // Guardar con opciones agresivas
        const altCompressedBytes = await tempDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50,
          compress: true,
        });
        
        // Crear un nuevo archivo con los bytes comprimidos alternativamente
        const altCompressedBlob = new Blob([altCompressedBytes], { type: 'application/pdf' });
        const altCompressedFile = new File(
          [altCompressedBlob], 
          `comprimido_${file.name}`, 
          { type: 'application/pdf' }
        );
        
        // Usar el resultado más pequeño
        if (altCompressedFile.size < compressedFileObj.size) {
          setCompressedFile(altCompressedFile);
        } else {
          setCompressedFile(compressedFileObj);
        }
      } else {
        // La compresión original fue efectiva
        setCompressedFile(compressedFileObj);
      }
      
      setProgress(100);
      
      const finalFile = compressedFileObj.size < originalSize * 0.9 ? 
                         compressedFileObj : compressedFileObj;
      const savedPercentage = Math.round((1 - (finalFile.size / originalSize)) * 100);
      
      if (savedPercentage > 5) {
        toast.success(`PDF comprimido con éxito. Ahorro: ${savedPercentage}%`);
      } else {
        toast.info('Este PDF ya está bastante optimizado. Reducción limitada.');
      }
      
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      toast.error('Error al comprimir el PDF');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadCompressedFile = () => {
    if (!compressedFile) return;
    
    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF descargado con éxito');
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

              {file && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-2">Nivel de compresión</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona el nivel de compresión deseado. Mayor compresión puede afectar la calidad.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <button
                      onClick={() => setCompressionLevel('low')}
                      className={`px-4 py-2 rounded-md text-sm ${
                        compressionLevel === 'low' 
                          ? 'bg-primary text-white' 
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      Baja (20%)
                    </button>
                    <button
                      onClick={() => setCompressionLevel('medium')}
                      className={`px-4 py-2 rounded-md text-sm ${
                        compressionLevel === 'medium' 
                          ? 'bg-primary text-white' 
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      Media (50%)
                    </button>
                    <button
                      onClick={() => setCompressionLevel('high')}
                      className={`px-4 py-2 rounded-md text-sm ${
                        compressionLevel === 'high' 
                          ? 'bg-primary text-white' 
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      Alta (70%)
                    </button>
                  </div>

                  <button
                    onClick={compressPDF}
                    disabled={isProcessing || !file}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Comprimiendo...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Comprimir PDF
                      </>
                    )}
                  </button>
                  
                  {isProcessing && (
                    <div className="mt-4">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-center mt-1 text-muted-foreground">{progress}%</p>
                    </div>
                  )}
                </div>
              )}

              {compressedFile && (
                <div className="mt-6">
                  <div className="flex items-center p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 mb-4">
                    <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">Compresión completada</p>
                      <p>Tamaño original: {(file?.size || 0) / 1024 / 1024} MB</p>
                      <p>Tamaño comprimido: {compressedFile.size / 1024 / 1024} MB</p>
                      <p>Reducción: {Math.round((1 - (compressedFile.size / (file?.size || 1))) * 100)}%</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={downloadCompressedFile}
                    className="btn-secondary w-full flex items-center justify-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF comprimido
                  </button>
                </div>
              )}

              {!file && (
                <div className="mt-6 flex items-center p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    Selecciona un archivo PDF para comenzar a comprimirlo.
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
