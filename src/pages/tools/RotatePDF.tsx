
import React, { useState, useEffect } from 'react';
import { Undo2, RotateCw, RotateCcw, Save, ListChecks, XCircle, Check, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import FileUpload from '@/components/FileUpload';
import PdfPreview from '@/components/PdfPreview';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { rotatePdfPage } from '@/utils/pdf/rotatePdf';
import { toast } from 'sonner';

const RotatePDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rotationAngles, setRotationAngles] = useState<{ [key: number]: number }>({});
  const [processingRotation, setProcessingRotation] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [generatingThumbnails, setGeneratingThumbnails] = useState(false);
  const [isPageSelectionEnabled, setIsPageSelectionEnabled] = useState(false);
  
  const {
    currentPage,
    totalPages,
    pageUrl,
    pdfDocument,
    isLoading,
    error,
    renderPage,
    nextPage,
    prevPage,
    reloadCurrentPage,
    renderThumbnail
  } = usePdfRenderer(file);

  useEffect(() => {
    if (!pdfDocument || !file) return;
    
    const generateThumbnails = async () => {
      setGeneratingThumbnails(true);
      setIsPageSelectionEnabled(false);
      const thumbs: string[] = [];
      try {
        for (let i = 1; i <= totalPages; i++) {
          const thumb = await renderThumbnail(i);
          if (thumb) thumbs.push(thumb);
        }
        setThumbnails(thumbs);
      } catch (error) {
        console.error('Error generando miniaturas:', error);
        toast.error('Error al generar las miniaturas del PDF');
      } finally {
        setGeneratingThumbnails(false);
        setIsPageSelectionEnabled(true);
      }
    };
    
    generateThumbnails();
  }, [pdfDocument, totalPages, file, renderThumbnail]);

  const handleFileChange = (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      setFile(uploadedFiles[0]);
      setRotationAngles({});
      setSelectedPages([]);
      setThumbnails([]);
      setShowSelectionMode(false);
      setIsPageSelectionEnabled(false);
    }
  };

  const handleRotate = (direction: 'clockwise' | 'counterclockwise') => {
    if (!file || !pdfDocument) return;
    
    const pagesToRotate = selectedPages.length > 0 ? selectedPages : [currentPage];
    const newRotationAngles = { ...rotationAngles };
    
    pagesToRotate.forEach(page => {
      const currentAngle = rotationAngles[page] || 0;
      const newAngle = direction === 'clockwise' 
        ? (currentAngle + 90) % 360 
        : (currentAngle - 90 + 360) % 360;
      
      newRotationAngles[page] = newAngle;
    });
    
    setRotationAngles(newRotationAngles);
    
    if (selectedPages.length === 0 || selectedPages.includes(currentPage)) {
      reloadCurrentPage(newRotationAngles[currentPage] || 0);
    }
  };

  const handleResetRotation = () => {
    if (!file || !pdfDocument) return;
    
    const pagesToReset = selectedPages.length > 0 ? selectedPages : [currentPage];
    const newRotationAngles = { ...rotationAngles };
    
    pagesToReset.forEach(page => {
      delete newRotationAngles[page];
    });
    
    setRotationAngles(newRotationAngles);
    
    if (selectedPages.length === 0 || selectedPages.includes(currentPage)) {
      reloadCurrentPage(0);
    }
  };

  const handleSaveRotations = async () => {
    if (!file || !pdfDocument || Object.keys(rotationAngles).length === 0) return;
    
    try {
      setProcessingRotation(true);
      toast.info("Procesando rotaciones, espere un momento...");
      
      await rotatePdfPage(file, rotationAngles);
      
      toast.success('PDF rotado correctamente. Descarga completada.');
    } catch (error) {
      console.error('Error al rotar PDF:', error);
      toast.error('Error al rotar PDF. Inténtalo de nuevo.');
    } finally {
      setProcessingRotation(false);
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    if (!isPageSelectionEnabled) return;
    
    setSelectedPages(prev => {
      if (prev.includes(pageNumber)) {
        return prev.filter(p => p !== pageNumber);
      } else {
        return [...prev, pageNumber];
      }
    });
  };

  const selectAllPages = () => {
    if (!isPageSelectionEnabled) return;
    
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(allPages);
  };

  const clearPageSelection = () => {
    if (!isPageSelectionEnabled) return;
    
    setSelectedPages([]);
  };

  const toggleSelectionMode = () => {
    if (generatingThumbnails || thumbnails.length === 0) return;
    
    setShowSelectionMode(prev => !prev);
    if (showSelectionMode) {
      setSelectedPages([]);
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Rotar PDF</h1>
          <p className="text-muted-foreground">
            Rota páginas individuales o múltiples en cualquier documento PDF. 
            Los cambios se procesan localmente en tu navegador.
          </p>
        </div>

        {!file ? (
          <Card className="p-6 max-w-xl mx-auto">
            <FileUpload
              onFilesSelected={handleFileChange}
              maxFiles={1}
              maxSize={100}
              accept=".pdf"
              infoText="Arrastra un archivo PDF o haz clic para seleccionarlo"
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{file.name}</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setFile(null)}
                >
                  Cambiar archivo
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {showSelectionMode && (
                  <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg overflow-y-auto max-h-[600px] border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-sm">Selección de páginas</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={selectAllPages}
                          disabled={generatingThumbnails || !isPageSelectionEnabled}
                          title="Seleccionar todas"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearPageSelection}
                          disabled={generatingThumbnails || !isPageSelectionEnabled}
                          title="Limpiar selección"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {generatingThumbnails ? (
                      <div className="space-y-2">
                        {Array.from({ length: Math.min(10, totalPages) }).map((_, idx) => (
                          <div key={idx} className="flex items-center space-x-2 p-2 rounded animate-pulse">
                            <Skeleton className="h-4 w-4 rounded-sm" />
                            <div className="flex items-center space-x-2 flex-1">
                              <Skeleton className="w-12 h-16 rounded" />
                              <Skeleton className="h-4 w-16 rounded" />
                            </div>
                          </div>
                        ))}
                        <div className="text-center text-sm text-muted-foreground pt-2">
                          <Loader2 className="h-4 w-4 inline-block mr-1 animate-spin" />
                          Generando miniaturas...
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {thumbnails.map((thumb, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-center space-x-2 p-2 rounded ${!isPageSelectionEnabled ? 'opacity-60' : selectedPages.includes(idx + 1) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'}`}
                          >
                            <Checkbox 
                              id={`page-${idx + 1}`}
                              checked={selectedPages.includes(idx + 1)}
                              onCheckedChange={() => togglePageSelection(idx + 1)}
                              disabled={!isPageSelectionEnabled}
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <div className="w-12 h-16 relative border border-gray-200">
                                <img 
                                  src={thumb} 
                                  alt={`Página ${idx + 1}`} 
                                  className="absolute inset-0 w-full h-full object-contain"
                                />
                              </div>
                              <label 
                                htmlFor={`page-${idx + 1}`} 
                                className={`text-sm cursor-pointer flex-1 ${!isPageSelectionEnabled ? 'text-gray-400' : ''}`}
                              >
                                Página {idx + 1}
                                {rotationAngles[idx + 1] ? 
                                  <span className="text-xs text-blue-600 ml-1">
                                    ({rotationAngles[idx + 1]}°)
                                  </span> : null
                                }
                              </label>
                            </div>
                          </div>
                        ))}
                        
                        {!isPageSelectionEnabled && thumbnails.length > 0 && (
                          <div className="text-center text-sm text-muted-foreground pt-2">
                            <Loader2 className="h-4 w-4 inline-block mr-1 animate-spin" />
                            Cargando opciones de selección...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`relative ${showSelectionMode ? 'md:col-span-3' : 'md:col-span-4'}`}>
                  <PdfPreview file={file} className="h-[600px]" />
                  
                  <div className="absolute top-12 right-4 flex flex-col gap-2 z-20">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={() => handleRotate('counterclockwise')}
                      disabled={isLoading}
                      title="Rotar 90° a la izquierda"
                    >
                      <RotateCcw />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={() => handleRotate('clockwise')}
                      disabled={isLoading}
                      title="Rotar 90° a la derecha"
                    >
                      <RotateCw />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={handleResetRotation}
                      disabled={isLoading || (selectedPages.length === 0 && !(rotationAngles[currentPage] !== undefined))}
                      title="Restablecer rotación"
                    >
                      <Undo2 />
                    </Button>
                    <Button
                      variant="secondary" 
                      size="icon"
                      onClick={toggleSelectionMode}
                      disabled={isLoading || thumbnails.length === 0 || generatingThumbnails}
                      title={showSelectionMode ? "Ocultar selección de páginas" : "Mostrar selección de páginas"}
                      className={showSelectionMode ? "bg-blue-100" : ""}
                    >
                      {generatingThumbnails ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ListChecks />
                      )}
                    </Button>
                  </div>
                  
                  <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                    <div className="bg-white px-4 py-2 rounded-full shadow text-sm">
                      Página {currentPage} de {totalPages}
                      {selectedPages.length > 0 && (
                        <span className="ml-2 text-blue-600">
                          ({selectedPages.length} páginas seleccionadas)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div>
                  {Object.keys(rotationAngles).length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(rotationAngles).length} {Object.keys(rotationAngles).length === 1 ? 'página rotada' : 'páginas rotadas'}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleSaveRotations}
                  disabled={isLoading || processingRotation || Object.keys(rotationAngles).length === 0}
                >
                  {processingRotation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RotatePDF;
