
import React, { useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfCanvasProps {
  pageUrl: string | null;
  onSelectionChange: (hasSelection: boolean) => void;
  fabricRef?: React.MutableRefObject<fabric.Canvas | null>;
}

const PdfCanvas: React.FC<PdfCanvasProps> = ({ pageUrl, onSelectionChange, fabricRef }) => {
  const { canvas, canvasRef, containerRef } = useFabricCanvas({
    onSelectionChange,
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [initialImgData, setInitialImgData] = useState<{
    img: fabric.Image | null;
    width: number;
    height: number;
  }>({
    img: null,
    width: 0,
    height: 0
  });

  // Pass canvas reference to parent component if needed
  useEffect(() => {
    if (canvas && fabricRef) {
      fabricRef.current = canvas;
    }
  }, [canvas, fabricRef]);

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
      
      // Store initial image data for zooming
      setInitialImgData({
        img: img,
        width: img.width as number,
        height: img.height as number
      });
      
      // Calcular escala para que el PDF ocupe más espacio
      // Aumentamos el factor de escala para que se vea más grande
      const scale = Math.min(
        (containerWidth * 0.85) / img.width!,
        (containerHeight * 0.85) / img.height!
      ) * zoomLevel;
      
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
  }, [pageUrl, canvas, zoomLevel]);

  // Apply zoom when zoom level changes for existing background
  useEffect(() => {
    if (!canvas || !initialImgData.img) return;
    
    const background = canvas.backgroundImage;
    if (!background) return;
    
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Recalculate scale based on zoom level
    const scale = Math.min(
      (containerWidth * 0.85) / initialImgData.width,
      (containerHeight * 0.85) / initialImgData.height
    ) * zoomLevel;
    
    background.scale(scale);
    
    // Recenter the image
    const leftPos = (containerWidth - background.getScaledWidth()) / 2;
    const topPos = (containerHeight - background.getScaledHeight()) / 2;
    
    background.set({
      left: leftPos,
      top: topPos
    });
    
    canvas.renderAll();
    console.log("Applied zoom level:", zoomLevel, "new scale:", scale);
  }, [zoomLevel, canvas, initialImgData]);

  // Setup panning functionality
  useEffect(() => {
    if (!canvas) return;

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    // Only enable panning mode when isPanning is true
    const handleMouseDown = (opt: fabric.IEvent) => {
      if (!isPanning) return;
      
      isDragging = true;
      
      const evt = opt.e as MouseEvent;
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
      
      // Disable object selection while panning
      if (isPanning) {
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.forEachObject(function(obj) {
          obj.selectable = false;
        });
        canvas.renderAll();
      }
    };

    const handleMouseMove = (opt: fabric.IEvent) => {
      if (!isDragging || !isPanning || !canvas.backgroundImage) return;
      
      const evt = opt.e as MouseEvent;
      const deltaX = evt.clientX - lastPosX;
      const deltaY = evt.clientY - lastPosY;
      
      // Move the background image
      const bg = canvas.backgroundImage;
      bg.set({
        left: (bg.left || 0) + deltaX,
        top: (bg.top || 0) + deltaY
      });
      
      // Also move all objects on the canvas
      canvas.forEachObject(function(obj) {
        obj.set({
          left: obj.left! + deltaX,
          top: obj.top! + deltaY
        });
        obj.setCoords();
      });
      
      canvas.renderAll();
      
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
      
      // Re-enable object selection after panning
      if (isPanning) {
        canvas.selection = true;
        canvas.forEachObject(function(obj) {
          obj.selectable = true;
        });
        canvas.renderAll();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, isPanning]);

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
      
      {/* Zoom and pan controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
        <Button 
          variant={isPanning ? "default" : "secondary"} 
          size="sm" 
          onClick={togglePanning} 
          className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
          title={isPanning ? "Modo movimiento activado" : "Mover PDF"}
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
      
      {/* Indicator for pan mode */}
      {isPanning && (
        <div className="absolute top-4 left-4 bg-primary/80 text-white px-3 py-1.5 rounded-md text-xs font-medium">
          Modo movimiento: Click y arrastra para mover
        </div>
      )}
    </div>
  );
};

export default PdfCanvas;
