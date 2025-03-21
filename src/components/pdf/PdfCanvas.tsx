
import React, { useState } from 'react';
import { usePdfCanvas } from '@/hooks/usePdfCanvas';
import PdfCanvasControls from './PdfCanvasControls';
import PdfPanningIndicator from './PdfPanningIndicator';

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
  
  const {
    canvasRef,
    containerRef,
    canvas,
    isPanning,
    setIsPanning
  } = usePdfCanvas({
    pageUrl,
    onSelectionChange,
    onCanvasInitialized,
    zoomLevel
  });

  // Set external reference if provided
  React.useEffect(() => {
    if (canvas && fabricRef) {
      fabricRef.current = canvas;
    }
    
    return () => {
      if (fabricRef) {
        fabricRef.current = null;
      }
    };
  }, [canvas, fabricRef]);

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
      <canvas ref={canvasRef} className="absolute inset-0" />
      
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
