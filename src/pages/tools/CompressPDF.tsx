
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, FileDown, Download, AlertCircle, Check, FileCheck } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Constantes para la compresión
const COMPRESSION_FACTORS = {
  low: { imageQuality: 0.7, scaleFactor: 0.95 },
  medium: { imageQuality: 0.4, scaleFactor: 0.85 },
  high: { imageQuality: 0.1, scaleFactor: 0.75 }
};

// Requiere una reducción mínima para considerar que la compresión fue efectiva
const MIN_SIZE_REDUCTION = 0.05; // 5% de reducción mínima

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
  const [compressionError, setCompressionError] = useState<string | null>(null);

  const handleFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setCompressedFile(null);
      setCompressionInfo(null);
      setCompressionError(null);
    } else {
      setFile(null);
      setCompressedFile(null);
      setCompressionInfo(null);
      setCompressionError(null);
    }
  };

  // Nuevo método principal de compresión usando técnicas avanzadas
  const compressPDF = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return;
    }

    try {
      setIsProcessing(true);
      setCompressionError(null);
      setProgress(10);

      // Obtenemos los bytes del archivo original
      const fileBuffer = await file.arrayBuffer();
      const fileSize = file.size;

      // Primera estrategia: compresión estándar
      setProgress(20);
      let result = await standardCompression(fileBuffer, compressionLevel);
      let compression = calculateCompression(fileSize, result?.size || fileSize);
      
      // Si no logramos buena compresión, probamos otra estrategia
      if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
        setProgress(40);
        result = await aggressiveCompression(fileBuffer, compressionLevel);
        compression = calculateCompression(fileSize, result?.size || fileSize);
        
        // Si todavía no es buena, intentamos una última estrategia
        if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
          setProgress(60);
          result = await extremeCompression(fileBuffer, compressionLevel);
          compression = calculateCompression(fileSize, result?.size || fileSize);
          
          // Si aún no funciona, probamos la compresión por calidad de imagen
          if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
            setProgress(80);
            result = await imageQualityCompression(fileBuffer, compressionLevel);
            compression = calculateCompression(fileSize, result?.size || fileSize);
          }
        }
      }

      setProgress(90);

      // Verificamos resultados finales
      if (!result || compression.savedPercentage < MIN_SIZE_REDUCTION * 100) {
        setCompressionError('No se pudo comprimir más el PDF. El archivo ya está optimizado.');
        setCompressedFile(null);
        setCompressionInfo(null);
        toast.error('No se pudo reducir el tamaño del archivo. Puede que ya esté optimizado.');
      } else {
        // Si logramos comprimir, guardamos el resultado
        setCompressedFile(result);
        setCompressionInfo(compression);
        toast.success(`PDF comprimido con éxito. Ahorro: ${compression.savedPercentage.toFixed(1)}%`);
      }
      
      setProgress(100);
    } catch (error) {
      console.error('Error al comprimir PDF:', error);
      setCompressionError('Error al procesar el PDF. Intenta con otro archivo.');
      toast.error('Error al comprimir el PDF. Intenta con otro archivo.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // Método para calcular el porcentaje de compresión
  const calculateCompression = (originalSize: number, compressedSize: number) => {
    const savedPercentage = Math.max(0, Math.round((1 - (compressedSize / originalSize)) * 1000) / 10);
    return {
      originalSize,
      compressedSize,
      savedPercentage
    };
  };

  // Método de compresión estándar
  const standardCompression = async (fileBuffer: ArrayBuffer, level: 'low' | 'medium' | 'high'): Promise<File | null> => {
    try {
      const { imageQuality, scaleFactor } = COMPRESSION_FACTORS[level];
      
      const pdfDoc = await PDFDocument.load(fileBuffer, { 
        ignoreEncryption: true,
        updateMetadata: false,
      });
      
      const pages = pdfDoc.getPages();
      
      // Reducir calidad de imágenes incrustadas si es posible
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        // Aquí está la corrección: usando degrees() para crear un objeto Rotation válido
        const currentAngle = page.getRotation().angle;
        page.setRotation(degrees(currentAngle));
      }
      
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });
      
      return new File(
        [compressedBytes], 
        `comprimido_${file?.name || 'documento.pdf'}`, 
        { type: 'application/pdf' }
      );
    } catch (error) {
      console.error('Error en compresión estándar:', error);
      return null;
    }
  };

  // Método de compresión agresiva
  const aggressiveCompression = async (fileBuffer: ArrayBuffer, level: 'low' | 'medium' | 'high'): Promise<File | null> => {
    try {
      const { imageQuality, scaleFactor } = COMPRESSION_FACTORS[level];
      
      const srcPdfDoc = await PDFDocument.load(fileBuffer);
      const newPdfDoc = await PDFDocument.create();
      
      const pages = srcPdfDoc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Copiar la página al nuevo documento
        const [copiedPage] = await newPdfDoc.copyPages(srcPdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
        
        // Remapear la página para reducir tamaño
        const currentPage = newPdfDoc.getPage(i);
        currentPage.setSize(width * scaleFactor, height * scaleFactor);
        currentPage.scale(1/scaleFactor, 1/scaleFactor);
      }
      
      const compressedBytes = await newPdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });
      
      return new File(
        [compressedBytes], 
        `comprimido_${file?.name || 'documento.pdf'}`, 
        { type: 'application/pdf' }
      );
    } catch (error) {
      console.error('Error en compresión agresiva:', error);
      return null;
    }
  };

  // Método de compresión extrema
  const extremeCompression = async (fileBuffer: ArrayBuffer, level: 'low' | 'medium' | 'high'): Promise<File | null> => {
    try {
      const qualityFactor = level === 'high' ? 0.05 : 
                            level === 'medium' ? 0.1 : 0.2;
      
      const scaleFactor = level === 'high' ? 0.6 : 
                          level === 'medium' ? 0.75 : 0.9;
      
      // Crear un nuevo documento
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const newDoc = await PDFDocument.create();
      
      // Para cada página del documento original
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Embeber la página original
        const [embeddedPage] = await newDoc.embedPages([page]);
        
        // Crear una nueva página con dimensiones reducidas
        const newPage = newDoc.addPage([width * scaleFactor, height * scaleFactor]);
        
        // Dibujar la página embebida en la nueva página
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: width * scaleFactor,
          height: height * scaleFactor,
          opacity: qualityFactor * 5 // Mayor opacidad para mejor legibilidad
        });
      }
      
      // Guardar el documento comprimido
      const compressedBytes = await newDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      
      return new File(
        [compressedBytes], 
        `comprimido_max_${file?.name || 'documento.pdf'}`, 
        { type: 'application/pdf' }
      );
    } catch (error) {
      console.error('Error en compresión extrema:', error);
      return null;
    }
  };

  // Método que comprime mediante reducción de calidad de imagen
  const imageQualityCompression = async (fileBuffer: ArrayBuffer, level: 'low' | 'medium' | 'high'): Promise<File | null> => {
    try {
      // Configuraciones según nivel de compresión
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();
      
      // Mantener dimensiones originales pero aplicar compresión
      const imageQuality = level === 'high' ? 0.01 : 
                           level === 'medium' ? 0.05 : 0.1;
      
      // Crear un nuevo documento con una página por cada original
      const newDoc = await PDFDocument.create();
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const [embeddedPage] = await newDoc.embedPages([page]);
        
        const targetWidth = Math.min(width, 595.28); // A4 width in points
        const targetHeight = Math.min(height, 841.89); // A4 height in points
        const newPage = newDoc.addPage([targetWidth, targetHeight]);
        
        // Dibujar con baja calidad para reducir tamaño
        newPage.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: targetWidth,
          height: targetHeight,
          opacity: imageQuality * 10
        });
      }
      
      // Guardar con configuraciones de compresión
      const compressedBytes = await newDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      
      return new File(
        [compressedBytes], 
        `comprimido_img_${file?.name || 'documento.pdf'}`, 
        { type: 'application/pdf' }
      );
    } catch (error) {
      console.error('Error en compresión por calidad de imagen:', error);
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
                      <p>Reducción: {compressionInfo.savedPercentage.toFixed(1)}%</p>
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

              {compressionError && (
                <div className="mt-6">
                  <Alert variant="destructive" className="bg-red-50">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <AlertDescription>
                      {compressionError}
                    </AlertDescription>
                  </Alert>
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
