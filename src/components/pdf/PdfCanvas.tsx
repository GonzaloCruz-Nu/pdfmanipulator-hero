
import React, { useState, useEffect, useRef } from 'react';
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
  
  const {
    canvas,
    isPanning,
    setIsPanning,
    initializeCanvas,
    updateCanvasSize,
    displayPdfPage
  } = usePdfCanvas({
    onSelectionChange,
    zoomLevel
  });

  // Initialize canvas when component mounts
  useEffect(() => {
    if (!canvasElRef.current || !containerRef.current) return;
    
    console.log("Initializing canvas in PdfCanvas component");
    const fabricCanvas = initializeCanvas(canvasElRef.current);
    
    if (fabricCanvas && onCanvasInitialized) {
      onCanvasInitialized(fabricCanvas);
    }
    
    // Set external reference if provided
    if (fabricCanvas && fabricRef) {
      fabricRef.current = fabricCanvas;
    }
    
    return () => {
      console.log("PdfCanvas component unmounting, cleaning up");
      if (fabricRef) {
        fabricRef.current = null;
      }
    };
  }, [initializeCanvas, onCanvasInitialized, fabricRef]);

  // Update canvas size on window resize or container size change
  useEffect(() => {
    if (!canvas || !containerRef.current) return;
    
    updateCanvasSize(containerRef.current);
    
    const handleResize = () => {
      if (containerRef.current) {
        updateCanvasSize(containerRef.current);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvas, updateCanvasSize]);

  // Display PDF when pageUrl changes
  useEffect(() => {
    if (!canvas || !pageUrl || !containerRef.current) return;
    
    displayPdfPage(pageUrl, containerRef.current);
  }, [pageUrl, canvas, displayPdfPage]);

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

export default PdfCanvas;
