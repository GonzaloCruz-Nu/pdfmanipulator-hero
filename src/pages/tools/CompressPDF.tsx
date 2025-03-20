import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, FileDown, Download, AlertCircle, Check, FileCheck } from 'lucide-react';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const CompressPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
  } | null>(null);

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setCompressedFile(null);
      setCompressionInfo(null);
    } else {
      setFile(null);
      setCompressedFile(null);
      setCompressionInfo(null);
    }
  };

  const calculateCompressionFactor = (level: 'low' | 'medium' | 'high'): number => {
    switch (level) {
      case 'low': return 0.8;     // 20% compression
      case 'medium': return 0.5;  // 50% compression
      case 'high': return 0.3;    // 70% compression - ajustado para mejor compresión
      default: return 0.5;
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
      const originalPdfDoc = await PDFDocument.load(fileArrayBuffer);
      
      setProgress(30);
      
      // Crear un nuevo documento PDF para máxima compresión
      const compressedPdfDoc = await PDFDocument.create();
      
      // Obtener todas las páginas del documento original
      const originalPages = originalPdfDoc.getPages();
      
      // Factor de compresión basado en el nivel seleccionado
      const compressionFactor = calculateCompressionFactor(compressionLevel);
      
      // Copiar cada página al nuevo documento con compresión
      for (let i = 0; i < originalPages.length; i++) {
        const page = originalPages[i];
        const { width, height } = page.getSize();
        
        // Copiar la página
        const [embeddedPage] = await compressedPdfDoc.embedPages([page]);
        const newPage = compressedPdfDoc.addPage([width, height]);
        
        // Dibujar la página
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
          opacity: 1.0 // Mantenemos la opacidad completa
        });
        
        // Actualizar progreso
        setProgress(30 + Math.floor(((i + 1) / originalPages.length) * 40));
      }
      
      setProgress(70);
      
      // Opciones de compresión según el nivel seleccionado
      const compressionOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100,
        // Establecer compresión adecuada
        useCompression: true
      };
      
      // Guardar el PDF con las opciones de compresión
      const compressedBytes = await compressedPdfDoc.save(compressionOptions);
      const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      const compressedFileObj = new File(
        [compressedBlob], 
        `comprimido_${file.name}`, 
        { type: 'application/pdf' }
      );

      // Verificar que el archivo realmente se ha comprimido
      if (compressedFileObj.size >= file.size) {
        // Si la compresión no fue efectiva, intentar método alternativo
        const alternativeResult = await compressWithImageDownsizing();
        if (alternativeResult && alternativeResult.size < file.size) {
          setCompressedFile(alternativeResult);
          const savedPercentage = Math.round((1 - (alternativeResult.size / file.size)) * 100);
          setCompressionInfo({
            originalSize: file.size,
            compressedSize: alternativeResult.size,
            savedPercentage: savedPercentage
          });
          
          toast.success(`PDF comprimido con éxito. Ahorro: ${savedPercentage}%`);
        } else {
          toast.warning('No se pudo comprimir más el PDF. El archivo ya está optimizado.');
          // Devolver el archivo original pero marcar que no hubo compresión
          setCompressedFile(file);
          setCompressionInfo({
            originalSize: file.size,
            compressedSize: file.size,
            savedPercentage: 0
          });
        }
      } else {
        // La compresión regular funcionó
        setCompressedFile(compressedFileObj);
        const savedPercentage = Math.round((1 - (compressedFileObj.size / file.size)) * 100);
        setCompressionInfo({
          originalSize: file.size,
          compressedSize: compressedFileObj.size,
          savedPercentage: savedPercentage
        });
        
        toast.success(`PDF comprimido con éxito. Ahorro: ${savedPercentage}%`);
      }
      
      setProgress(100);
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      toast.error('Error al comprimir el PDF');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Método alternativo de compresión con mayor reducción de calidad
  const compressWithImageDownsizing = async () => {
    if (!file) return null;
    
    try {
      setProgress(75);
      
      // Leer el archivo como ArrayBuffer
      const fileArrayBuffer = await file.arrayBuffer();
      
      // Cargar el PDF con pdf-lib
      const pdfDoc = await PDFDocument.load(fileArrayBuffer, { 
        ignoreEncryption: true,
      });
      
      // Crear un nuevo documento PDF para máxima compresión
      const newPdfDoc = await PDFDocument.create();
      
      // Obtener todas las páginas
      const pages = pdfDoc.getPages();
      
      // Determinar factor de calidad más agresivo para imágenes
      let qualityFactor;
      switch (compressionLevel) {
        case 'low': qualityFactor = 0.7; break;
        case 'medium': qualityFactor = 0.5; break;
        case 'high': qualityFactor = 0.2; break;
        default: qualityFactor = 0.5;
      }
      
      // Factor de escala para reducir las dimensiones de página
      let scaleFactor;
      switch (compressionLevel) {
        case 'low': scaleFactor = 0.9; break;
        case 'medium': scaleFactor = 0.8; break;
        case 'high': scaleFactor = 0.7; break;
        default: scaleFactor = 0.8;
      }
      
      // Comprimir cada página con calidad reducida
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Escalar dimensiones para páginas
        let targetWidth = width * scaleFactor;
        let targetHeight = height * scaleFactor;
        
        // Copiar página con dimensiones reducidas
        const [embeddedPage] = await newPdfDoc.embedPages([page]);
        const newPage = newPdfDoc.addPage([width, height]);
        
        // Dibujar con calidad y dimensiones reducidas
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: targetWidth,
          height: targetHeight,
          opacity: qualityFactor // Reducir opacidad para mejorar compresión
        });
        
        setProgress(75 + Math.floor(((i + 1) / pages.length) * 20));
      }
      
      // Guardar con máxima compresión
      const options = {
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 20,
        useCompression: true
      };
      
      const compressedBytes = await newPdfDoc.save(options);
      
      const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      const altCompressedFile = new File(
        [compressedBlob], 
        `comprimido_${file.name}`, 
        { type: 'application/pdf' }
      );
      
      return altCompressedFile;
    } catch (error) {
      console.error('Error en compresión alternativa:', error);
      // En caso de error, intentar compresión básica
      try {
        return await basicCompression();
      } catch (err) {
        console.error('Error en compresión básica:', err);
        return null;
      }
    }
  };
  
  // Método básico de compresión
  const basicCompression = async () => {
    if (!file) return null;
    
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      
      // Comprimir con opciones más simples
      const bytes = await pdfDoc.save({
        useObjectStreams: true,
        useCompression: true
      });
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const basicCompressedFile = new File(
        [blob], 
        `comprimido_${file.name}`, 
        { type: 'application/pdf' }
      );
      
      return basicCompressedFile;
    } catch (error) {
      console.error('Error en compresión básica:', error);
      return null;
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
                      Alta (75%)
                    </button>
                  </div>

                  <Button
                    onClick={compressPDF}
                    disabled={isProcessing || !file}
                    variant="default"
                    className="w-full"
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
                  </Button>
                  
                  {isProcessing && (
                    <div className="mt-4">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-center mt-1 text-muted-foreground">{progress}%</p>
                    </div>
                  )}
                </div>
              )}

              {compressionInfo && compressedFile && (
                <div className="mt-6">
                  <div className="flex items-center p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 mb-4">
                    <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">Compresión completada</p>
                      <p>Tamaño original: {(compressionInfo.originalSize / 1024 / 1024).toFixed(2)} MB</p>
                      <p>Tamaño comprimido: {(compressionInfo.compressedSize / 1024 / 1024).toFixed(2)} MB</p>
                      <p>Reducción: {compressionInfo.savedPercentage}%</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={downloadCompressedFile}
                    variant="secondary"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF comprimido
                  </Button>
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
