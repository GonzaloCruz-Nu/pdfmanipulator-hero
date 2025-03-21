
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePdfCanvas } from '@/hooks/usePdfCanvas';
import PdfCanvasControls from './PdfCanvasControls';
import PdfPanningIndicator from './PdfPanningIndicator';
import { fabric } from 'fabric';

interface PdfCanvasProps {
  pageUrl: string | null;
  onSelectionChange: (hasSelection: boolean) => void;
  fabricRef?: React.MutableRefObject<fabric.Canvas | null>;
  onCanvasInitialized?: (canvas: fabric.Canvas) => void;
}

const PdfCanvas: React.FC<PdfCanvasProps> = ({ 
  pageUrl, 
  onSelectionChange, 
  fabricRef,
  onCanvasInitialized 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const canvasInitializedRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const mountedRef = useRef(true);
  const lastPageUrlRef = useRef<string | null>(null);
  
  const {
    canvas,
    initializeCanvas,
    updateCanvasSize,
    displayPdfPage,
    cleanup
  } = usePdfCanvas({
    onSelectionChange,
    zoomLevel,
    isPanning
  });

  // Set mounted ref on component mount/unmount
  useEffect(() => {
    console.log("PdfCanvas component mounted");
    mountedRef.current = true;
    
    return () => {
      console.log("PdfCanvas component unmounting");
      mountedRef.current = false;
    };
  }, []);

  // Initialize canvas ONCE when component mounts
  useEffect(() => {
    if (!canvasElRef.current || !containerRef.current || canvasInitializedRef.current) return;
    
    console.log("Initializing canvas in PdfCanvas component");
    const fabricCanvas = initializeCanvas(canvasElRef.current);
    
    if (fabricCanvas && mountedRef.current) {
      if (onCanvasInitialized) {
        onCanvasInitialized(fabricCanvas);
      }
      
      // Set external reference if provided
      if (fabricRef) {
        fabricRef.current = fabricCanvas;
      }
      
      setIsCanvasReady(true);
      canvasInitializedRef.current = true;
    }
    
    // Cleanup function - use a local reference to ensure state closure consistency
    return () => {
      if (mountedRef.current === false) return; // Already unmounted
      
      console.log("Canvas initialization effect cleanup");
      
      // Do NOT call cleanup() here - this creates multiple cleanup calls
      // Just reset internal state
      canvasInitializedRef.current = false;
    };
  }, [initializeCanvas, onCanvasInitialized, fabricRef]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("PdfCanvas unmount effect triggered - cleaning up canvas");
      
      // First clear references
      if (fabricRef) {
        fabricRef.current = null;
      }
      
      // Then clean up the canvas
      if (canvasInitializedRef.current) {
        cleanup();
        canvasInitializedRef.current = false;
      }
    };
  }, [cleanup, fabricRef]);

  // Update canvas size on window resize or container size change
  useEffect(() => {
    if (!canvas || !containerRef.current || !isCanvasReady) return;
    
    const handleResize = () => {
      if (containerRef.current && mountedRef.current) {
        updateCanvasSize(containerRef.current);
      }
    };
    
    // Initial size update - with a small delay
    const initialSizeTimer = setTimeout(() => {
      if (mountedRef.current && containerRef.current) {
        updateCanvasSize(containerRef.current);
      }
    }, 100);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialSizeTimer);
    };
  }, [canvas, updateCanvasSize, isCanvasReady]);

  // Display PDF when pageUrl changes - with improved stability
  useEffect(() => {
    if (!canvas || !pageUrl || !containerRef.current || !isCanvasReady) return;
    
    // Skip if this page was already loaded
    if (lastPageUrlRef.current === pageUrl) {
      console.log("Skipping duplicate page render:", pageUrl);
      return;
    }
    
    lastPageUrlRef.current = pageUrl;
    console.log("Loading new PDF page:", pageUrl);
    
    // Use a stable reference to avoid flickering
    const currentContainer = containerRef.current;
    
    // Add a delay before displaying the page to prevent frequent reloads
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        // Force a clean canvas state before loading new content
        if (canvas.backgroundImage) {
          canvas.clear();
          canvas.renderAll();
        }
        
        displayPdfPage(pageUrl, currentContainer);
      }
    }, 300); // Increased timeout for better stability
    
    return () => {
      clearTimeout(timer);
    };
  }, [pageUrl, canvas, displayPdfPage, isCanvasReady]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3)); // Maximum zoom 300%
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5)); // Minimum zoom 50%
  }, []);

  const togglePanning = useCallback(() => {
    setIsPanning(prev => !prev);
  }, []);

  // Use local component CSS to ensure the container takes the full space
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex-1 flex justify-center items-center overflow-hidden relative bg-gray-100"
      style={{ minHeight: "400px" }} // Ensure minimum height
    >
      <canvas ref={canvasElRef} className="absolute inset-0" />
      
      <PdfCanvasControls
        isPanning={isPanning}
        togglePanning={togglePanning}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
      />
      
      <PdfPanningIndicator isPanning={isPanning} />
    </div>
  );
};

export default React.memo(PdfCanvas);
