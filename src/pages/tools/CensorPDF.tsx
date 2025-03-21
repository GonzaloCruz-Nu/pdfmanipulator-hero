
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Download } from 'lucide-react';
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

const CensorPDF = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTool, setActiveTool] = useState<CensorToolType>('rectangle');
  const [censorColor, setCensorColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [hasSelection, setHasSelection] = useState(false);
  const [pageRenderedUrls, setPageRenderedUrls] = useState<string[]>([]);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const {
    currentPage,
    totalPages,
    pageUrl,
    isLoading,
    error,
    nextPage,
    prevPage,
    renderPage,
    pdfDocument
  } = usePdfRenderer(selectedFile);

  const {
    isProcessing,
    censoredFile,
    applyRedactions,
    downloadCensoredPDF,
    canvasRef: censorCanvasRef,
    setActivePage,
    cleanupCanvas
  } = useCensorPDF({ file: selectedFile });

  // Pass the fabricCanvas reference to the useCensorPDF hook
  useEffect(() => {
    censorCanvasRef.current = fabricCanvasRef.current;
  }, [fabricCanvasRef.current]);

  // Update active page in useCensorPDF when current page changes
  useEffect(() => {
    setActivePage(currentPage);
  }, [currentPage, setActivePage]);

  // Cleanup and initialize canvas when the component unmounts or the file changes
  useEffect(() => {
    return () => {
      cleanupCanvas();
    };
  }, [cleanupCanvas]);

  // Initialize Fabric canvas when the canvas reference is available
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("Inicializando canvas de fabric");
    
    // Clean up previous canvas if it exists
    if (fabricCanvasRef.current) {
      try {
        // Remove event listeners first to prevent memory leaks
        fabricCanvasRef.current.off();
        
        if (fabricCanvasRef.current.lowerCanvasEl && 
            fabricCanvasRef.current.lowerCanvasEl.parentNode) {
          fabricCanvasRef.current.dispose();
        }
        fabricCanvasRef.current = null;
      } catch (error) {
        console.error("Error al limpiar canvas previo:", error);
      }
    }

    try {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
      });

      fabricCanvasRef.current = fabricCanvas;

      // Handle selection changes
      const handleSelectionChange = () => {
        setHasSelection(!!fabricCanvas.getActiveObject());
      };

      fabricCanvas.on('selection:created', handleSelectionChange);
      fabricCanvas.on('selection:updated', handleSelectionChange);
      fabricCanvas.on('selection:cleared', handleSelectionChange);
      
      // Clean up when unmounting
      return () => {
        if (fabricCanvas) {
          try {
            fabricCanvas.off('selection:created', handleSelectionChange);
            fabricCanvas.off('selection:updated', handleSelectionChange);
            fabricCanvas.off('selection:cleared', handleSelectionChange);
            
            // Check if the canvas element is still in the DOM before disposing
            if (fabricCanvas.lowerCanvasEl && fabricCanvas.lowerCanvasEl.parentNode) {
              fabricCanvas.dispose();
            }
            
            fabricCanvasRef.current = null;
          } catch (error) {
            console.error("Error al desmontar canvas:", error);
          }
        }
      };
    } catch (error) {
      console.error("Error al inicializar canvas de fabric:", error);
      toast.error("Error al preparar el editor. Intente de nuevo.");
    }
  }, [canvasRef.current]);

  // Update canvas size on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (fabricCanvasRef.current && canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.clientWidth;
        const containerHeight = canvasContainerRef.current.clientHeight;
        
        fabricCanvasRef.current.setWidth(containerWidth);
        fabricCanvasRef.current.setHeight(containerHeight);
        fabricCanvasRef.current.renderAll();
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [fabricCanvasRef.current]);

  // Load PDF in the canvas when the page URL changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !pageUrl) return;
    
    console.log("Cargando imagen del PDF en el canvas, página:", currentPage);
    
    // Clear existing content but save the canvas object
    fabricCanvasRef.current.clear();
    setIsChangingPage(false);
    
    // Load PDF image as background
    fabric.Image.fromURL(pageUrl, (img) => {
      if (!canvasContainerRef.current || !fabricCanvasRef.current) {
        console.error("Referencias perdidas al cargar la imagen del PDF");
        return;
      }
      
      const containerWidth = canvasContainerRef.current.clientWidth;
      const containerHeight = canvasContainerRef.current.clientHeight;
      
      // Set canvas dimensions
      fabricCanvasRef.current.setDimensions({
        width: containerWidth,
        height: containerHeight
      });
      
      // Calculate scale to fit PDF in the canvas
      const scale = Math.min(
        (containerWidth * 0.85) / img.width!,
        (containerHeight * 0.85) / img.height!
      );
      
      // Apply scale
      img.scale(scale);
      
      // Center the image in the canvas
      const leftPos = (containerWidth - img.getScaledWidth()) / 2;
      const topPos = (containerHeight - img.getScaledHeight()) / 2;
      
      // Set as background image
      fabricCanvasRef.current.setBackgroundImage(img, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current), {
        originX: 'left',
        originY: 'top',
        left: leftPos,
        top: topPos
      });
      
      fabricCanvasRef.current.renderAll();
      console.log("Imagen del PDF cargada correctamente en el canvas");
    }, { crossOrigin: 'anonymous' });
  }, [pageUrl, currentPage]);

  // Load thumbnails of all pages when PDF is loaded
  useEffect(() => {
    const loadAllPageThumbnails = async () => {
      if (!pdfDocument || totalPages === 0) return;
      
      console.log("Cargando miniaturas de todas las páginas...");
      const pageUrls = [];
      
      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdfDocument.getPage(i);
          const viewport = page.getViewport({ scale: 0.2 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) continue;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          await page.render(renderContext).promise;
          
          pageUrls.push(canvas.toDataURL('image/jpeg', 0.7));
        } catch (error) {
          console.error(`Error rendering thumbnail for page ${i}:`, error);
        }
      }
      
      setPageRenderedUrls(pageUrls);
      console.log(`${pageUrls.length} miniaturas cargadas correctamente`);
    };
    
    loadAllPageThumbnails();
  }, [pdfDocument, totalPages]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      toast.success(`PDF cargado: ${files[0].name}`);
    }
  };

  const handlePageSelect = (pageNum: number) => {
    if (isChangingPage || isLoading) return;
    
    if (pageNum === currentPage) {
      // Don't reload the same page
      console.log(`Ya estás en la página ${pageNum}`);
      return;
    }
    
    if (pdfDocument && pageNum >= 1 && pageNum <= totalPages) {
      // Set loading state
      setIsChangingPage(true);
      
      console.log(`Cambiando a la página ${pageNum}`);
      
      // Clean up canvas properly before changing page
      try {
        // Only clear content, not dispose the canvas
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.renderAll();
        }
        
        // Render the new page
        renderPage(pdfDocument, pageNum);
        
        // Inform the user
        toast.success(`Página ${pageNum} cargada`);
      } catch (error) {
        console.error("Error al cambiar de página:", error);
        toast.error("Error al cambiar de página. Intente de nuevo.");
        setIsChangingPage(false);
      }
    }
  };

  const handleSelectionChange = () => {
    if (!fabricCanvasRef.current) return;
    setHasSelection(!!fabricCanvasRef.current.getActiveObject());
  };

  const handleClearAll = () => {
    if (!fabricCanvasRef.current) return;
    
    // Mantener solo la imagen de fondo (PDF)
    const bgImage = fabricCanvasRef.current.backgroundImage;
    fabricCanvasRef.current.clear();
    
    if (bgImage) {
      fabricCanvasRef.current.setBackgroundImage(bgImage, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
    }
    
    fabricCanvasRef.current.renderAll();
    toast.info('Todas las censuras han sido eliminadas');
  };

  const handleDeleteSelected = () => {
    if (!fabricCanvasRef.current) return;
    
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject);
      setHasSelection(false);
      toast.success('Censura seleccionada eliminada');
    }
  };

  const handleApplyCensors = () => {
    // Pass the canvas reference to the apply redactions function
    if (fabricCanvasRef.current) {
      applyRedactions();
    } else {
      toast.error('No se pudo aplicar las censuras');
    }
  };

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
            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setSelectedFile(null)}
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
                
                {censoredFile && (
                  <Button 
                    onClick={downloadCensoredPDF}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF censurado
                  </Button>
                )}
              </div>
            </div>
            
            {/* Info alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                Dibuja rectángulos sobre la información que deseas ocultar y luego haz clic en "Aplicar censuras".
              </AlertDescription>
            </Alert>
            
            {/* PDF editor */}
            <div className="h-[700px] rounded-xl overflow-hidden border shadow-md flex flex-col bg-white">
              <div className="p-3 border-b bg-gray-50">
                <h2 className="text-sm font-medium truncate max-w-lg mx-auto text-center">
                  {selectedFile.name}
                </h2>
              </div>
              
              {/* PDF editor toolbar */}
              <PdfCensorToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
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
              
              {/* Main content area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Thumbnails sidebar */}
                {showSidebar && (
                  <div className="w-[150px] border-r shrink-0 overflow-y-auto">
                    <PdfThumbnailList 
                      pages={pageRenderedUrls}
                      currentPage={currentPage}
                      onPageSelect={handlePageSelect}
                      isChangingPage={isChangingPage || isLoading}
                    />
                  </div>
                )}
                
                {/* PDF content with censoring tools */}
                <div className="flex-1 relative overflow-hidden">
                  {isLoading || isChangingPage ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {isChangingPage ? 'Cambiando página...' : 'Cargando PDF...'}
                      </p>
                    </div>
                  ) : error ? (
                    <div className="text-center p-4 text-red-500 h-full flex flex-col items-center justify-center">
                      <p>{error}</p>
                    </div>
                  ) : (
                    <div
                      ref={canvasContainerRef}
                      className="w-full h-full flex justify-center items-center bg-gray-100 relative"
                    >
                      <canvas ref={canvasRef} className="absolute inset-0" />
                      
                      <PdfCensorTools
                        canvas={fabricCanvasRef.current}
                        activeTool={activeTool}
                        color={censorColor}
                        size={size}
                        onToolChange={setActiveTool}
                      />
                      
                      <PdfNavigation
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onNextPage={nextPage}
                        onPrevPage={prevPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CensorPDF;
