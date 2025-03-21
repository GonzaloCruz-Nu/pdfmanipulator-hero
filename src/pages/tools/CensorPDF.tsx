
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
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
import PdfCensorToolbar, { CensorToolType, CensorStyleType } from '@/components/pdf/PdfCensorToolbar';
import PdfCensorTools from '@/components/pdf/PdfCensorTools';
import PdfNavigation from '@/components/pdf/PdfNavigation';

const CensorPDF = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTool, setActiveTool] = useState<CensorToolType>('rectangle');
  const [censorStyle, setCensorStyle] = useState<CensorStyleType>('black');
  
  // Canvas related states and refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // PDF renderer hook
  const {
    currentPage,
    totalPages,
    pageUrl,
    isLoading,
    error,
    nextPage,
    prevPage,
    renderThumbnail,
    gotoPage
  } = usePdfRenderer(selectedFile);

  // Censor PDF hook
  const {
    isProcessing,
    censoredFile,
    applyRedactions,
    downloadCensoredPDF,
    resetCensor,
    setCanvasReference,
    setActivePage
  } = useCensorPDF({ file: selectedFile });

  // Update active page when PDF page changes
  useEffect(() => {
    console.log("Current page changed to:", currentPage);
    setActivePage(currentPage);
  }, [currentPage, setActivePage]);

  // Initialize and manage the fabric.js canvas
  useEffect(() => {
    console.log("Page initialization or page/URL change detected");
    
    // Skip if canvas element doesn't exist, or we're loading, or there's no page URL
    if (!canvasRef.current || isLoading || !pageUrl) {
      return;
    }

    console.log("Initializing canvas with page:", currentPage, "URL:", pageUrl);
    
    // Set up new fabric canvas instance for this page
    const initCanvas = () => {
      // Clean up previous canvas if it exists
      if (fabricCanvas.current) {
        console.log("Cleaning up previous canvas");
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
      
      try {
        // Create new fabric.js canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
          selection: true,
          preserveObjectStacking: true
        });
        
        fabricCanvas.current = canvas;
        setCanvasReference(canvas);
        setCanvasInitialized(true);
        console.log("Fabric canvas initialized successfully");
        
        // Load the PDF page as background image
        fabric.Image.fromURL(pageUrl, (img) => {
          const containerWidth = containerRef.current?.clientWidth || 800;
          const containerHeight = containerRef.current?.clientHeight || 600;
          
          // Scale to fit in container while maintaining aspect ratio
          const scale = Math.min(
            containerWidth / img.width!,
            containerHeight / img.height!
          ) * 0.8; // Scale to 80% of container to ensure margins
          
          // Set scaled dimensions
          img.scale(scale);
          
          // Center the image
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            top: (containerHeight - img.height! * scale) / 2,
            left: (containerWidth - img.width! * scale) / 2
          });
          
          console.log("Background image set successfully");
        });
        
        // Update canvas size when window resizes
        const handleResize = () => {
          if (containerRef.current && canvas) {
            canvas.setWidth(containerRef.current.clientWidth);
            canvas.setHeight(containerRef.current.clientHeight);
            canvas.renderAll();
          }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial size
        
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (error) {
        console.error("Error initializing canvas:", error);
        toast.error("Error al inicializar el lienzo para censura");
      }
    };
    
    const cleanup = initCanvas();
    
    // Clean up function
    return () => {
      if (cleanup) cleanup();
      
      if (fabricCanvas.current) {
        try {
          fabricCanvas.current.dispose();
          fabricCanvas.current = null;
          setCanvasInitialized(false);
        } catch (error) {
          console.error("Error disposing canvas:", error);
        }
      }
    };
  }, [pageUrl, isLoading, currentPage, setCanvasReference]);

  // Handle file selection
  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      console.log("New file selected:", files[0].name);
      setSelectedFile(files[0]);
      
      // Reset canvas
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
      
      setCanvasInitialized(false);
      toast.success(`PDF cargado: ${files[0].name}`);
    }
  };

  // Handle page selection in thumbnail list
  const handlePageSelect = async (pageNum: number) => {
    if (pageNum === currentPage || isLoading) return;
    
    try {
      console.log(`Changing to page ${pageNum}`);
      
      // Reset canvas before page change
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
      
      setCanvasInitialized(false);
      await gotoPage(pageNum);
      
    } catch (error) {
      console.error("Error changing page:", error);
      toast.error("Error al cambiar de página");
    }
  };

  // Handle clear all censors
  const handleClearAll = () => {
    if (!fabricCanvas.current) {
      toast.error("No hay lienzo disponible");
      return;
    }
    
    try {
      const bgImage = fabricCanvas.current.backgroundImage;
      fabricCanvas.current.clear();
      
      if (bgImage) {
        fabricCanvas.current.setBackgroundImage(bgImage, fabricCanvas.current.renderAll.bind(fabricCanvas.current));
      }
      
      fabricCanvas.current.renderAll();
      toast.info('Todas las censuras han sido eliminadas');
    } catch (error) {
      console.error("Error clearing censors:", error);
      toast.error("Error al limpiar las censuras");
    }
  };

  // Handle apply censors
  const handleApplyCensors = () => {
    if (!fabricCanvas.current) {
      toast.error('No se pudo aplicar las censuras. No hay lienzo disponible.');
      return;
    }
    
    // Ensure canvas reference is up to date
    setCanvasReference(fabricCanvas.current);
    
    // Apply censors
    applyRedactions(censorStyle);
  };

  // Load thumbnails when file is selected
  const [pageRenderedUrls, setPageRenderedUrls] = useState<string[]>([]);
  useEffect(() => {
    const loadThumbnails = async () => {
      if (!selectedFile || totalPages === 0) return;
      
      const thumbnails = [];
      for (let i = 1; i <= totalPages; i++) {
        try {
          const thumbnail = await renderThumbnail(i);
          if (thumbnail) thumbnails.push(thumbnail);
        } catch (error) {
          console.error(`Error rendering thumbnail for page ${i}:`, error);
        }
      }
      
      setPageRenderedUrls(thumbnails);
    };
    
    loadThumbnails();
  }, [selectedFile, totalPages, renderThumbnail]);

  return (
    <Layout>
      <Header />
      
      <div className="py-6">
        <div className="mb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Censurar PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Oculta información sensible en tus documentos PDF con capas negras o pixeladas.
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
                  if (fabricCanvas.current) {
                    fabricCanvas.current.dispose();
                    fabricCanvas.current = null;
                  }
                  setSelectedFile(null);
                  setCanvasInitialized(false);
                }}
              >
                Cambiar archivo
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
              </Button>
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
                onToolChange={setActiveTool}
                censorStyle={censorStyle}
                onStyleChange={setCensorStyle}
                onClearAll={handleClearAll}
                onApplyCensors={handleApplyCensors}
                isProcessing={isProcessing}
              />
              
              <div className="flex-1 flex overflow-hidden">
                {showSidebar && (
                  <div className="w-[150px] border-r shrink-0 overflow-y-auto">
                    <PdfThumbnailList 
                      pages={pageRenderedUrls}
                      currentPage={currentPage}
                      onPageSelect={handlePageSelect}
                      isChangingPage={isLoading}
                    />
                  </div>
                )}
                
                <div className="flex-1 relative overflow-hidden" ref={containerRef}>
                  {isLoading ? (
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
                      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                      
                      {canvasInitialized && fabricCanvas.current && (
                        <PdfCensorTools
                          canvas={fabricCanvas.current}
                          activeTool={activeTool}
                          censorStyle={censorStyle}
                        />
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
            
            {censoredFile && (
              <div className="flex justify-center mt-4">
                <Button 
                  size="lg"
                  onClick={downloadCensoredPDF}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-5 w-5 mr-2" />
                  <span>Descargar PDF censurado</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CensorPDF;
