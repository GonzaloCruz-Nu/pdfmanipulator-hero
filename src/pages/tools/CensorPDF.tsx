import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Upload } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/FileUpload';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { useCensorPDF } from '@/hooks/useCensorPDF';
import PdfThumbnailList from '@/components/pdf/PdfThumbnailList';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fabric } from 'fabric';
import PdfCensorToolbar, { CensorToolType } from '@/components/pdf/PdfCensorToolbar';
import PdfCensorTools from '@/components/pdf/PdfCensorTools';
import PdfNavigation from '@/components/pdf/PdfNavigation';
import PdfCanvas from '@/components/pdf/PdfCanvas';

const CensorPDF = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTool, setActiveTool] = useState<CensorToolType>('rectangle');
  const [censorColor, setCensorColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [hasSelection, setHasSelection] = useState(false);
  const [pageRenderedUrls, setPageRenderedUrls] = useState<string[]>([]);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [currentlyChangingPage, setCurrentlyChangingPage] = useState(false);
  
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const pageChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailsLoadedRef = useRef(false);
  const currentPageRef = useRef(1);

  const {
    currentPage,
    totalPages,
    pageUrl,
    isLoading,
    error,
    nextPage,
    prevPage,
    renderThumbnail,
    pdfDocument,
    gotoPage
  } = usePdfRenderer(selectedFile);

  const {
    isProcessing,
    censoredFile,
    applyRedactions,
    downloadCensoredPDF,
    setCanvasReference,
    setActivePage,
    cleanupCanvas,
    hasValidCanvas
  } = useCensorPDF({ file: selectedFile });

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    console.log("Setting active page to:", currentPage);
    setActivePage(currentPage);
  }, [currentPage, setActivePage]);

  useEffect(() => {
    return () => {
      console.log("Component unmounting or file changing, cleaning up resources");
      
      if (pageChangeTimeoutRef.current) {
        clearTimeout(pageChangeTimeoutRef.current);
        pageChangeTimeoutRef.current = null;
      }
      
      cleanupCanvas();
      fabricCanvasRef.current = null;
      setCanvasInitialized(false);
      thumbnailsLoadedRef.current = false;
    };
  }, [cleanupCanvas, selectedFile]);

  const handleCanvasInitialized = useCallback((canvas: fabric.Canvas) => {
    console.log("Canvas initialized in CensorPDF component");
    
    fabricCanvasRef.current = canvas;
    
    setCanvasReference(canvas);
    setCanvasInitialized(true);
    
    setActiveTool('rectangle');
    console.log("Canvas reference set and initialization complete");
    
    setTimeout(() => {
      if (canvas) {
        console.log("Forcing canvas render after initialization");
        canvas.renderAll();
      }
    }, 200);
  }, [setCanvasReference]);

  useEffect(() => {
    const loadAllPageThumbnails = async () => {
      if (!pdfDocument || totalPages === 0 || thumbnailsLoadedRef.current) return;
      
      console.log("Loading thumbnails for all pages...");
      const pageUrls = [];
      
      for (let i = 1; i <= totalPages; i++) {
        try {
          const thumbnail = await renderThumbnail(i);
          if (thumbnail) {
            pageUrls.push(thumbnail);
          }
        } catch (error) {
          console.error(`Error rendering thumbnail for page ${i}:`, error);
        }
      }
      
      setPageRenderedUrls(pageUrls);
      thumbnailsLoadedRef.current = true;
      console.log(`${pageUrls.length} thumbnails loaded successfully`);
    };
    
    loadAllPageThumbnails();
  }, [pdfDocument, totalPages, renderThumbnail]);

  const handleFileSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      console.log("New file selected:", files[0].name);
      
      setCanvasInitialized(false);
      
      if (pageChangeTimeoutRef.current) {
        clearTimeout(pageChangeTimeoutRef.current);
        pageChangeTimeoutRef.current = null;
      }
      
      cleanupCanvas();
      fabricCanvasRef.current = null;
      
      setPageRenderedUrls([]);
      thumbnailsLoadedRef.current = false;
      
      setSelectedFile(files[0]);
      toast.success(`PDF cargado: ${files[0].name}`);
    }
  }, [cleanupCanvas]);

  const handlePageSelect = useCallback(async (pageNum: number) => {
    if (pageNum === currentPage) {
      console.log(`Already on page ${pageNum}`);
      return;
    }
    
    if (isLoading || currentlyChangingPage) {
      console.log("Page change in progress, ignoring request");
      return;
    }
    
    if (!pdfDocument || pageNum < 1 || pageNum > totalPages) {
      console.error(`Invalid page: ${pageNum}`);
      return;
    }
    
    try {
      console.log(`Starting page change to page ${pageNum}`);
      setCurrentlyChangingPage(true);
      toast.info(`Cambiando a la página ${pageNum}...`);
      
      cleanupCanvas();
      fabricCanvasRef.current = null;
      setCanvasInitialized(false);
      
      await gotoPage(pageNum);
      
      setActiveTool('rectangle');
      setHasSelection(false);
      
      setTimeout(() => {
        setCurrentlyChangingPage(false);
      }, 300);
      
    } catch (error) {
      console.error("Error changing page:", error);
      toast.error("Error al cambiar de página. Intente de nuevo.");
      setCurrentlyChangingPage(false);
    }
  }, [currentPage, isLoading, pdfDocument, totalPages, gotoPage, currentlyChangingPage, cleanupCanvas]);

  const handleClearAll = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const bgImage = fabricCanvasRef.current.backgroundImage;
      
      fabricCanvasRef.current.remove(...fabricCanvasRef.current.getObjects());
      
      if (bgImage) {
        fabricCanvasRef.current.setBackgroundImage(bgImage, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
      }
      
      fabricCanvasRef.current.renderAll();
      toast.info('Todas las censuras han sido eliminadas');
    } catch (error) {
      console.error("Error al limpiar todas las censuras:", error);
      toast.error("Error al limpiar las censuras. Intente de nuevo.");
    }
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject) {
        fabricCanvasRef.current.remove(activeObject);
        setHasSelection(false);
        toast.success('Censura seleccionada eliminada');
      }
    } catch (error) {
      console.error("Error al eliminar la censura seleccionada:", error);
      toast.error("Error al eliminar la censura. Intente de nuevo.");
    }
  }, []);

  const handleApplyCensors = useCallback(() => {
    console.log("Applying redactions, canvas ref:", fabricCanvasRef.current ? "Canvas available" : "Canvas null");
    
    if (fabricCanvasRef.current) {
      setCanvasReference(fabricCanvasRef.current);
      
      const objectCount = fabricCanvasRef.current.getObjects().length;
      
      if (objectCount === 0) {
        toast.warning('No hay áreas de censura para aplicar');
        return;
      }
      
      fabricCanvasRef.current.forEachObject(obj => {
        obj.visible = true;
      });
      
      fabricCanvasRef.current.renderAll();
      
      setTimeout(() => {
        applyRedactions();
      }, 300);
    } else {
      console.error("No canvas reference available");
      toast.error('No se pudo aplicar las censuras. No hay lienzo disponible.');
    }
  }, [applyRedactions, setCanvasReference]);

  return (
    <Layout>
      <Header />
      
      <div className="py-6">
        <div className="mb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Censurar PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Oculta información sensible en tus documentos PDF.
          </p>
        </div>

        {!selectedFile ? (
          <div className="border-2 border-dashed border-border rounded-xl h-[400px] flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Seleccionar PDF</h2>
                <p className="text-center text-muted-foreground">
                  Sube un archivo PDF para ocultar información sensible
                </p>
              </div>
              
              <FileUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
                accept=".pdf"
                maxFiles={1}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  cleanupCanvas();
                  fabricCanvasRef.current = null;
                  setCanvasInitialized(false);
                  setSelectedFile(null);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Cambiar archivo
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  {showSidebar ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
                </Button>
              </div>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                Dibuja rectángulos sobre la información que deseas ocultar y luego haz clic en "Aplicar censuras" en la barra superior.
              </AlertDescription>
            </Alert>
            
            <div className="h-[700px] rounded-xl overflow-hidden border shadow-md flex flex-col bg-white">
              <div className="p-3 border-b bg-gray-50">
                <h2 className="text-sm font-medium truncate max-w-lg mx-auto text-center">
                  {selectedFile.name}
                </h2>
              </div>
              
              <PdfCensorToolbar
                activeTool={activeTool}
                onToolChange={(tool) => {
                  console.log("Tool changed to:", tool);
                  setActiveTool(tool);
                  
                  if (tool === 'select' && fabricCanvasRef.current) {
                    fabricCanvasRef.current.forEachObject(obj => {
                      obj.selectable = true;
                      obj.evented = true;
                    });
                    fabricCanvasRef.current.renderAll();
                  }
                }}
                censorColor={censorColor}
                onColorChange={setCensorColor}
                size={size}
                onSizeChange={setSize}
                onClearAll={handleClearAll}
                onDeleteSelected={handleDeleteSelected}
                onApplyCensors={handleApplyCensors}
                hasSelection={hasSelection}
                isProcessing={isProcessing}
              />
              
              <div className="flex-1 flex overflow-hidden">
                {showSidebar && (
                  <div className="w-[150px] border-r shrink-0 overflow-y-auto">
                    <PdfThumbnailList 
                      pages={pageRenderedUrls}
                      currentPage={currentPage}
                      onPageSelect={handlePageSelect}
                      isChangingPage={isLoading || currentlyChangingPage}
                    />
                  </div>
                )}
                
                <div className="flex-1 relative overflow-hidden">
                  {isLoading || currentlyChangingPage ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cargando PDF...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="text-center p-4 text-red-500 h-full flex flex-col items-center justify-center">
                      <p>{error}</p>
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      {pageUrl && (
                        <>
                          <PdfCanvas 
                            key={`pdf-canvas-${currentPage}`}
                            pageUrl={pageUrl}
                            onSelectionChange={setHasSelection}
                            fabricRef={fabricCanvasRef}
                            onCanvasInitialized={handleCanvasInitialized}
                          />
                          
                          {canvasInitialized && fabricCanvasRef.current && (
                            <PdfCensorTools
                              key={`pdf-censor-tools-${currentPage}`}
                              canvas={fabricCanvasRef.current}
                              activeTool={activeTool}
                              color={censorColor}
                              size={size}
                              onToolChange={setActiveTool}
                            />
                          )}
                          
                          <PdfNavigation
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onNextPage={nextPage}
                            onPrevPage={prevPage}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              {censoredFile && (
                <Button 
                  size="lg"
                  onClick={downloadCensoredPDF}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <span className="mr-2">Descargar PDF censurado</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CensorPDF;
