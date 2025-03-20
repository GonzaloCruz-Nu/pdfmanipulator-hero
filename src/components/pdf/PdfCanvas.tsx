
import React, { useEffect } from 'react';
import { fabric } from 'fabric';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';

interface PdfCanvasProps {
  pageUrl: string | null;
  onSelectionChange: (hasSelection: boolean) => void;
}

const PdfCanvas: React.FC<PdfCanvasProps> = ({ pageUrl, onSelectionChange }) => {
  const { canvas, canvasRef, containerRef } = useFabricCanvas({
    onSelectionChange,
  });

  // Display PDF when pageUrl changes
  useEffect(() => {
    if (!canvas || !pageUrl) return;
    
    // Clear existing content
    canvas.clear();
    
    console.log("Loading PDF page with URL:", pageUrl);
    
    // Load PDF image as background
    fabric.Image.fromURL(pageUrl, (img) => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      console.log("Container dimensions:", containerWidth, containerHeight);
      console.log("Image dimensions:", img.width, img.height);
      
      // Establecer dimensiones del canvas más grandes
      canvas.setDimensions({
        width: containerWidth,
        height: containerHeight
      });
      
      // Calcular escala para que el PDF ocupe más espacio
      // Aumentamos el factor de escala para que se vea más grande
      const scale = Math.min(
        (containerWidth * 0.85) / img.width!,
        (containerHeight * 0.85) / img.height!
      );
      
      // Apply scaling
      img.scale(scale);
      
      // Center the image in the canvas
      const leftPos = (containerWidth - img.getScaledWidth()) / 2;
      const topPos = (containerHeight - img.getScaledHeight()) / 2;
      
      // Set as background with positioning
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        originX: 'left',
        originY: 'top',
        left: leftPos,
        top: topPos
      });
      
      canvas.renderAll();
      console.log("PDF displayed with dimensions:", img.width, img.height, "at scale:", scale);
    }, { crossOrigin: 'anonymous' });
  }, [pageUrl, canvas]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex-1 flex justify-center items-center overflow-hidden relative bg-gray-100"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};

export default PdfCanvas;
