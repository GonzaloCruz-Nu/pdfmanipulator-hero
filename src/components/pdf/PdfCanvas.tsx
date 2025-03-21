import React, { useEffect, useState, useRef } from 'react';
import { fabric } from 'fabric';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
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

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Clean up existing canvas first
    if (canvas) {
      try {
        canvas.dispose();
      } catch (err) {
        console.error("Error disposing canvas:", err);
      }
    }
    
    console.log("Initializing new Fabric canvas");
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      selection: true,
    });
    
    setCanvas(fabricCanvas);
    
    // Call the onCanvasInitialized callback if provided
    if (onCanvasInitialized) {
      onCanvasInitialized(fabricCanvas);
    }
    
    // Handle selection changes
    fabricCanvas.on('selection:created', () => onSelectionChange(true));
    fabricCanvas.on('selection:updated', () => onSelectionChange(true));
    fabricCanvas.on('selection:cleared', () => onSelectionChange(false));
    
    return () => {
      console.log("Cleaning up Fabric canvas in PdfCanvas");
      
      // First remove all event listeners
      try {
        fabricCanvas.off();
      } catch (error) {
        console.error("Error removing canvas event listeners:", error);
      }
      
      // Then dispose of the canvas
      try {
        fabricCanvas.dispose();
      } catch (error) {
        console.error("Error disposing canvas:", error);
      }
      
      setCanvas(null);
    };
  }, [canvasRef.current]);

  // Pass canvas reference to parent component if needed
  useEffect(() => {
    if (canvas && fabricRef) {
      fabricRef.current = canvas;
    }
    
    return () => {
      if (fabricRef) {
        fabricRef.current = null;
      }
    };
  }, [canvas, fabricRef]);

  // Update canvas size on window resize
  useEffect(() => {
    if (!canvas || !containerRef.current) return;
    
    const updateCanvasSize = () => {
      if (!canvas || !containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      canvas.setWidth(containerWidth);
      canvas.setHeight(containerHeight);
      
      // If we have a background image, reposition it
      if (canvas.backgroundImage) {
        const img = canvas.backgroundImage;
        const scale = Math.min(
          (containerWidth * 0.85) / initialImgData.width,
          (containerHeight * 0.85) / initialImgData.height
        ) * zoomLevel;
        
        img.scale(scale);
        
        // Center the image
        const leftPos = (containerWidth - img.getScaledWidth()) / 2;
        const topPos = (containerHeight - img.getScaledHeight()) / 2;
        
        img.set({
          left: leftPos,
          top: topPos
        });
      }
      
      canvas.renderAll();
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [canvas, initialImgData]);

  // Display PDF when pageUrl changes
  useEffect(() => {
    if (!canvas || !pageUrl) return;
    
    // Clear existing objects but keep the canvas
    canvas.clear();
    
    console.log("Loading PDF page with URL:", pageUrl);
    
    // Load PDF image as background
    fabric.Image.fromURL(pageUrl, (img) => {
      if (!containerRef.current || !canvas) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      console.log("Container dimensions:", containerWidth, containerHeight);
      console.log("Image dimensions:", img.width, img.height);
      
      // Store initial image data for zooming
      setInitialImgData({
        img: img,
        width: img.width as number,
        height: img.height as number
      });
      
      // Calculate scale for PDF to fill more space
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
  }, [pageUrl, canvas]);

  // Apply zoom when zoom level changes for existing background
  useEffect(() => {
    if (!canvas || !initialImgData.img || !canvas.backgroundImage) return;
    
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Recalculate scale based on zoom level
    const scale = Math.min(
      (containerWidth * 0.85) / initialImgData.width,
      (containerHeight * 0.85) / initialImgData.height
    ) * zoomLevel;
    
    canvas.backgroundImage.scale(scale);
    
    // Recenter the image
    const leftPos = (containerWidth - canvas.backgroundImage.getScaledWidth()) / 2;
    const topPos = (containerHeight - canvas.backgroundImage.getScaledHeight()) / 2;
    
    canvas.backgroundImage.set({
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
      if (isPanning && canvas) {
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.forEachObject(function(obj) {
          obj.selectable = false;
        });
        canvas.renderAll();
      }
    };

    const handleMouseMove = (opt: fabric.IEvent) => {
      if (!isDragging || !isPanning || !canvas) return;
      
      if (!canvas.backgroundImage) return;
      
      const evt = opt.e as MouseEvent;
      const deltaX = evt.clientX - lastPosX;
      const deltaY = evt.clientY - lastPosY;
      
      // Move the background image
      canvas.backgroundImage.set({
        left: (canvas.backgroundImage.left || 0) + deltaX,
        top: (canvas.backgroundImage.top || 0) + deltaY
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
      if (isPanning && canvas) {
        canvas.selection = true;
        canvas.forEachObject(function(obj) {
          obj.selectable = true;
        });
        canvas.renderAll();
      }
    };

    // Use safe event handlers that check if canvas still exists
    const safeAddHandler = (eventName: string, handler: (e: fabric.IEvent) => void) => {
      try {
        canvas.on(eventName, handler);
      } catch (error) {
        console.error(`Error adding ${eventName} handler:`, error);
      }
    };

    const safeRemoveHandler = (eventName: string, handler: (e: fabric.IEvent) => void) => {
      try {
        if (canvas) {
          canvas.off(eventName, handler);
        }
      } catch (error) {
        console.error(`Error removing ${eventName} handler:`, error);
      }
    };

    safeAddHandler('mouse:down', handleMouseDown);
    safeAddHandler('mouse:move', handleMouseMove);
    safeAddHandler('mouse:up', handleMouseUp);

    return () => {
      safeRemoveHandler('mouse:down', handleMouseDown);
      safeRemoveHandler('mouse:move', handleMouseMove);
      safeRemoveHandler('mouse:up', handleMouseUp);
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
