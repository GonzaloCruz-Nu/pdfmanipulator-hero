
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Download, ZoomIn, ZoomOut, Move } from 'lucide-react';
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
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  
  // References
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Hooks
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
    if (fabricCanvasRef.current) {
      censorCanvasRef.current = fabricCanvasRef.current;
    }
  }, [fabricCanvasRef.current]);

  // Update active page in useCensorPDF when current page changes
  useEffect(() => {
    setActivePage(currentPage);
  }, [currentPage, setActivePage]);

  // Cleanup canvas when component unmounts or file changes
  useEffect(() => {
    return () => {
      console.log("Component unmounting or file changing, cleaning up canvas");
      cleanupCanvas();
      
      // Additional local cleanup
      if (fabricCanvasRef.current) {
        try {
          console.log("Local canvas cleanup on unmount");
          
          // Remove all event listeners
          fabricCanvasRef.current.off();
          
          // Dispose if possible
          if (fabricCanvasRef.current.lowerCanvasEl) {
            try {
              fabricCanvasRef.current.dispose();
              console.log("Canvas disposed on unmount");
            } catch (error) {
              console.error("Error disposing canvas on unmount:", error);
            }
          }
          
          fabricCanvasRef.current = null;
          setCanvasInitialized(false);
          console.log("Canvas reference cleared on unmount");
        } catch (error) {
          console.error("Error during local canvas cleanup:", error);
          fabricCanvasRef.current = null;
        }
      }
    };
  }, [cleanupCanvas, selectedFile]);

  // Initialize Fabric canvas when the canvas reference is available
  useEffect(() => {
    if (!canvasRef.current || !pageUrl || canvasInitialized) {
      return;
    }

    try {
      console.log("Initializing Fabric canvas with page:", currentPage);
      
      // Clean up previous canvas if it exists
      if (fabricCanvasRef.current) {
        try {
          console.log("Cleaning up previous canvas before initialization");
          fabricCanvasRef.current.off();
          
          if (fabricCanvasRef.current.lowerCanvasEl) {
            try {
              fabricCanvasRef.current.dispose();
            } catch (error) {
              console.error("Error disposing previous canvas:", error);
            }
          }
          
          fabricCanvasRef.current = null;
        } catch (error) {
          console.error("Error cleaning up previous canvas:", error);
          fabricCanvasRef.current = null;
        }
      }

      // Create new canvas
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
      });

      fabricCanvasRef.current = fabricCanvas;
      setCanvasInitialized(true);

      // Handle selection changes
      fabricCanvas.on('selection:created', () => setHasSelection(true));
      fabricCanvas.on('selection:updated', () => setHasSelection(true));
      fabricCanvas.on('selection:cleared', () => setHasSelection(false));
      
      console.log("Fabric canvas initialized successfully");
    } catch (error) {
      console.error("Error initializing Fabric canvas:", error);
      toast.error("Error al preparar el editor. Intente de nuevo.");
      setCanvasInitialized(false);
    }
  }, [canvasRef.current, pageUrl, canvasInitialized, currentPage]);

  // Update canvas size on resize
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasContainerRef.current) return;
    
    const updateCanvasSize = () => {
      if (fabricCanvasRef.current && canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.clientWidth;
        const containerHeight = canvasContainerRef.current.clientHeight;
        
        fabricCanvasRef.current.setWidth(containerWidth);
        fabricCanvasRef.current.setHeight(containerHeight);
        fabricCanvasRef.current.renderAll();
      }
    };

    // Initial size update
    updateCanvasSize();
    
    // Add resize listener
    window.addEventListener('resize', updateCanvasSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [fabricCanvasRef.current, canvasContainerRef.current]);

  // Setup panning functionality
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const handlePanningMouseDown = (opt: fabric.IEvent) => {
      if (!isPanning) return;
      
      const evt = opt.e as MouseEvent;
      isDraggingRef.current = true;
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      
      // Disable selection during panning
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.selection = false;
        fabricCanvasRef.current.defaultCursor = 'grabbing';
      }
    };

    const handlePanningMouseMove = (opt: fabric.IEvent) => {
      if (!isDraggingRef.current || !isPanning || !fabricCanvasRef.current) return;
      
      const evt = opt.e as MouseEvent;
      const deltaX = evt.clientX - lastPosRef.current.x;
      const deltaY = evt.clientY - lastPosRef.current.y;
      
      // Move all objects including the background
      const objects = fabricCanvasRef.current.getObjects();
      objects.forEach(obj => {
        obj.left! += deltaX;
        obj.top! += deltaY;
        obj.setCoords();
      });
      
      // Move background if it exists
      if (fabricCanvasRef.current.backgroundImage) {
        const bg = fabricCanvasRef.current.backgroundImage;
        bg.left! += deltaX;
        bg.top! += deltaY;
      }
      
      fabricCanvasRef.current.renderAll();
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
    };

    const handlePanningMouseUp = () => {
      isDraggingRef.current = false;
      
      // Re-enable selection after panning
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.selection = true;
        fabricCanvasRef.current.defaultCursor = 'default';
      }
    };

    // Add event listeners for panning
    if (isPanning && fabricCanvasRef.current) {
      fabricCanvasRef.current.on('mouse:down', handlePanningMouseDown);
      fabricCanvasRef.current.on('mouse:move', handlePanningMouseMove);
      fabricCanvasRef.current.on('mouse:up', handlePanningMouseUp);
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.off('mouse:down', handlePanningMouseDown);
        fabricCanvasRef.current.off('mouse:move', handlePanningMouseMove);
        fabricCanvasRef.current.off('mouse:up', handlePanningMouseUp);
      }
    };
  }, [isPanning, fabricCanvasRef.current]);

  // Load PDF in the canvas when the page URL changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !pageUrl) return;
    
    console.log("Loading PDF image into canvas, page:", currentPage);
    setIsChangingPage(false);
    
    try {
      // Clear existing content without removing the canvas itself
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear();
      }
      
      // Load PDF image as background
      fabric.Image.fromURL(pageUrl, (img) => {
        if (!canvasContainerRef.current || !fabricCanvasRef.current) {
          console.error("References lost while loading PDF image");
          return;
        }
        
        const containerWidth = canvasContainerRef.current.clientWidth;
        const containerHeight = canvasContainerRef.current.clientHeight;
        
        // Set canvas dimensions
        fabricCanvasRef.current.setDimensions({
          width: containerWidth,
          height: containerHeight
        });
        
        // Calculate scale to fit PDF in the canvas, accounting for zoom level
        const scale = Math.min(
          (containerWidth * 0.85) / img.width!,
          (containerHeight * 0.85) / img.height!
        ) * zoomLevel;
        
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
        console.log("PDF image loaded successfully into canvas");
      }, { crossOrigin: 'anonymous' });
    } catch (error) {
      console.error("Error loading PDF image:", error);
      setIsChangingPage(false);
    }
  }, [pageUrl, currentPage, zoomLevel]);

  // Load thumbnails of all pages when PDF is loaded
  useEffect(() => {
    const loadAllPageThumbnails = async () => {
      if (!pdfDocument || totalPages === 0) return;
      
      console.log("Loading thumbnails for all pages...");
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
      console.log(`${pageUrls.length} thumbnails loaded successfully`);
    };
    
    loadAllPageThumbnails();
  }, [pdfDocument, totalPages]);

  // Handle file selection
  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      console.log("New file selected:", files[0].name);
      
      // Clean up before loading new file
      setCanvasInitialized(false);
      cleanupCanvas();
      
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.off();
          fabricCanvasRef.current.clear();
          if (fabricCanvasRef.current.lowerCanvasEl) {
            try {
              fabricCanvasRef.current.dispose();
            } catch (error) {
              console.error("Error disposing canvas on file change:", error);
            }
          }
          fabricCanvasRef.current = null;
        } catch (error) {
          console.error("Error cleaning up canvas on file change:", error);
          fabricCanvasRef.current = null;
        }
      }
      
      // Reset state
      setPageRenderedUrls([]);
      setSelectedFile(files[0]);
      toast.success(`PDF cargado: ${files[0].name}`);
    }
  };

  // Handle page selection
  const handlePageSelect = async (pageNum: number) => {
    if (isChangingPage || isLoading) {
      console.log("Page change in progress, ignoring request");
      return;
    }
    
    if (pageNum === currentPage) {
      console.log(`Already on page ${pageNum}`);
      return;
    }
    
    if (!pdfDocument || pageNum < 1 || pageNum > totalPages) {
      console.error(`Invalid page: ${pageNum}`);
      return;
    }
    
    try {
      // Set loading state first
      setIsChangingPage(true);
      setCanvasInitialized(false);
      toast.info(`Cambiando a la página ${pageNum}...`);
      
      console.log(`Changing to page ${pageNum}`);
      
      // Safely clean up canvas
      if (fabricCanvasRef.current) {
        try {
          // Remove all event listeners first
          fabricCanvasRef.current.off();
          
          // Clear objects
          fabricCanvasRef.current.clear();
          
          // Render to ensure clean state
          fabricCanvasRef.current.renderAll();
        } catch (error) {
          console.error("Error cleaning canvas before page change:", error);
        }
      }
      
      // Render the new page
      await renderPage(pdfDocument, pageNum);
      console.log(`Page ${pageNum} loaded successfully`);
    } catch (error) {
      console.error("Error changing page:", error);
      toast.error("Error al cambiar de página. Intente de nuevo.");
    } finally {
      setIsChangingPage(false);
    }
  };

  // Handle clear all objects
  const handleClearAll = () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      // Keep only the background image (PDF)
      const bgImage = fabricCanvasRef.current.backgroundImage;
      fabricCanvasRef.current.clear();
      
      if (bgImage) {
        fabricCanvasRef.current.setBackgroundImage(bgImage, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
      }
      
      fabricCanvasRef.current.renderAll();
      toast.info('Todas las censuras han sido eliminadas');
    } catch (error) {
      console.error("Error al limpiar todas las censuras:", error);
      toast.error("Error al limpiar las censuras. Intente de nuevo.");
    }
  };

  // Handle delete selected object
  const handleDeleteSelected = () => {
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
  };

  // Handle apply censors
  const handleApplyCensors = () => {
    if (fabricCanvasRef.current) {
      applyRedactions();
    } else {
      toast.error('No se pudo aplicar las censuras');
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3)); // Maximum zoom 300%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5)); // Minimum zoom 50%
  };

  // Toggle panning mode
  const togglePanMode = () => {
    setIsPanning(!isPanning);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.defaultCursor = !isPanning ? 'grab' : 'default';
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
                      
                      {canvasInitialized && fabricCanvasRef.current && (
                        <PdfCensorTools
                          canvas={fabricCanvasRef.current}
                          activeTool={activeTool}
                          color={censorColor}
                          size={size}
                          onToolChange={setActiveTool}
                        />
                      )}
                      
                      {/* Zoom and pan controls */}
                      <div className="absolute bottom-16 right-4 flex gap-2 z-10">
                        <Button 
                          variant={isPanning ? "default" : "secondary"} 
                          size="sm" 
                          onClick={togglePanMode} 
                          className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
                          title={isPanning ? "Desactivar modo movimiento" : "Activar modo movimiento"}
                        >
                          <Move className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={handleZoomIn} 
                          className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
                          title="Acercar"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={handleZoomOut} 
                          className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
                          title="Alejar"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {isPanning && (
                        <div className="absolute top-4 left-4 bg-primary/80 text-white px-3 py-1.5 rounded-md text-xs font-medium">
                          Modo movimiento: haz clic y arrastra para mover
                        </div>
                      )}
                      
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
