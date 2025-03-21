
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

  // Ensure proper cleanup when component unmounts
  useEffect(() => {
    mountedRef.current = true;
    return () => {
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
    
    return () => {
      console.log("PdfCanvas component unmounting, cleaning up");
      
      // First clear references
      if (fabricRef) {
        fabricRef.current = null;
      }
      
      // Then clean up the canvas - only if still mounted
      if (canvasInitializedRef.current) {
        cleanup();
        if (mountedRef.current) {
          setIsCanvasReady(false);
          canvasInitializedRef.current = false;
        }
      }
    };
  }, [initializeCanvas, onCanvasInitialized, fabricRef, cleanup]);

  // Update canvas size on window resize or container size change
  useEffect(() => {
    if (!canvas || !containerRef.current || !isCanvasReady) return;
    
    const handleResize = () => {
      if (containerRef.current && mountedRef.current) {
        updateCanvasSize(containerRef.current);
      }
    };
    
    // Initial size update
    updateCanvasSize(containerRef.current);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvas, updateCanvasSize, isCanvasReady]);

  // Memoize the displayPdfPage to prevent render loops
  const memoizedDisplayPdfPage = useCallback(
    (url: string, container: HTMLDivElement) => {
      if (mountedRef.current) {
        displayPdfPage(url, container);
      }
    },
    [displayPdfPage]
  );

  // Display PDF when pageUrl changes - with improved stability
  useEffect(() => {
    if (!canvas || !pageUrl || !containerRef.current || !isCanvasReady) return;
    
    // Use a stable reference to avoid flickering
    const currentContainer = containerRef.current;
    
    // Add a larger timeout to prevent rapid re-renders and give more time for loading
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        memoizedDisplayPdfPage(pageUrl, currentContainer);
      }
    }, 250); // Increased timeout for better stability
    
    return () => {
      clearTimeout(timer);
    };
  }, [pageUrl, canvas, memoizedDisplayPdfPage, isCanvasReady]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3)); // Maximum zoom 300%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5)); // Minimum zoom 50%
  };

  const togglePanning = () => {
    setIsPanning(prev => !prev);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex-1 flex justify-center items-center overflow-hidden relative bg-gray-100"
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
