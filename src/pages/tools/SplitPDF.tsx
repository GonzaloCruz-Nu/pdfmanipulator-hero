
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, FileText, Download, AlertCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';

const SplitPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitMethod, setSplitMethod] = useState<'range' | 'extract'>('range');
  const [pageRange, setPageRange] = useState('');

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      // Obtener el número de páginas del PDF
      getPageCount(files[0]);
    } else {
      setFile(null);
      setPageCount(0);
      setSelectedPages([]);
    }
  };

  const getPageCount = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const count = pdf.getPageCount();
      setPageCount(count);
    } catch (error) {
      console.error('Error al leer el PDF:', error);
      toast.error('Error al leer el archivo PDF');
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    if (selectedPages.includes(pageNumber)) {
      setSelectedPages(selectedPages.filter(p => p !== pageNumber));
    } else {
      setSelectedPages([...selectedPages, pageNumber].sort((a, b) => a - b));
    }
  };

  const validatePageRange = (input: string): boolean => {
    // Validar el formato de rango (1-3,5,7-9)
    const rangePattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
    if (!rangePattern.test(input)) return false;
    
    // Validar que los rangos sean válidos
    const ranges = input.split(',');
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        if (start > end || start < 1 || end > pageCount) return false;
      } else {
        const page = Number(range);
        if (page < 1 || page > pageCount) return false;
      }
    }
    
    return true;
  };

  const parsePageRange = (input: string): number[] => {
    const pages: number[] = [];
    const ranges = input.split(',');
    
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) pages.push(i);
        }
      } else {
        const page = Number(range);
        if (!pages.includes(page)) pages.push(page);
      }
    }
    
    return pages.sort((a, b) => a - b);
  };

  const splitPDF = async () => {
    if (!file) {
      toast.error('Selecciona primero un archivo PDF');
      return;
    }

    // Determinar qué páginas extraer
    let pagesToExtract: number[] = [];
    
    if (splitMethod === 'extract') {
      if (selectedPages.length === 0) {
        toast.error('Selecciona al menos una página para extraer');
        return;
      }
      pagesToExtract = selectedPages;
    } else {
      if (!pageRange || !validatePageRange(pageRange)) {
        toast.error('El rango de páginas no es válido');
        return;
      }
      pagesToExtract = parsePageRange(pageRange);
    }

    if (pagesToExtract.length === 0) {
      toast.error('No hay páginas para extraer');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Cargar el PDF original
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Crear un nuevo documento con las páginas seleccionadas
      const newPdfDoc = await PDFDocument.create();
      
      // Indexar desde 0 para pdf-lib (las páginas en UI se muestran desde 1)
      const pdfPages = pagesToExtract.map(p => p - 1);
      
      // Copiar las páginas seleccionadas
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfPages);
      
      // Añadir las páginas al nuevo documento
      copiedPages.forEach(page => {
        newPdfDoc.addPage(page);
      });
      
      // Guardar el nuevo documento
      const newPdfBytes = await newPdfDoc.save();
      
      // Descargar el archivo
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_extraido.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      toast.success('PDF dividido con éxito');
    } catch (error) {
      console.error('Error al dividir el PDF:', error);
      toast.error('Error al dividir el PDF');
    } finally {
      setIsProcessing(false);
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
              <Scissors className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Dividir PDF</h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Extrae páginas específicas de un PDF o divídelo por rangos para crear nuevos documentos.
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

              {file && pageCount > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-3">2. Selecciona el método de división</h3>
                  
                  {/* Reemplazamos los botones personalizados con el componente ToggleGroup de shadcn/ui */}
                  <ToggleGroup 
                    type="single" 
                    value={splitMethod}
                    onValueChange={(value) => {
                      if (value) setSplitMethod(value as 'range' | 'extract');
                    }}
                    className="flex space-x-4 mb-4"
                  >
                    <ToggleGroupItem 
                      value="range" 
                      className="bg-orange-100 text-foreground data-[state=on]:bg-primary data-[state=on]:text-white"
                    >
                      Por rango
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="extract" 
                      className="bg-orange-100 text-foreground data-[state=on]:bg-primary data-[state=on]:text-white"
                    >
                      Seleccionar páginas
                    </ToggleGroupItem>
                  </ToggleGroup>

                  {splitMethod === 'range' ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1" htmlFor="pageRange">
                        Rango de páginas (ej. 1-3,5,7-9)
                      </label>
                      <Input
                        id="pageRange"
                        type="text"
                        placeholder="1-3,5,7-9"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Páginas disponibles: 1-{pageCount}
                      </p>
                      
                      {pageRange && !validatePageRange(pageRange) && (
                        <p className="mt-1 text-xs text-red-500">
                          Formato inválido o rango fuera de límites
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Selecciona páginas para extraer
                      </label>
                      <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            className={`p-2 text-sm rounded-md ${
                              selectedPages.includes(pageNum) 
                                ? 'bg-primary text-white' 
                                : 'bg-orange-100 text-foreground hover:bg-orange-200'
                            }`}
                            onClick={() => togglePageSelection(pageNum)}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {selectedPages.length} páginas seleccionadas
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={splitPDF}
                  disabled={isProcessing || !file}
                  className="w-full"
                  variant="default"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Extraer páginas
                    </>
                  )}
                </Button>
              </div>

              {!file && (
                <div className="mt-6 flex items-center p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    Selecciona un archivo PDF para comenzar.
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
              <h2 className="text-xl font-bold mb-4">Vista previa</h2>
              
              {file ? (
                <PdfPreview file={file} />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-secondary/50 rounded-xl">
                  <div className="text-center p-6">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
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

export default SplitPDF;
