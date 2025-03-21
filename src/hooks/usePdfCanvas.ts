import { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface UsePdfCanvasProps {
  pageUrl: string | null;
  onSelectionChange?: (hasSelection: boolean) => void;
  onCanvasInitialized?: (canvas: fabric.Canvas) => void;
  zoomLevel: number;
}

export const usePdfCanvas = ({
  pageUrl,
  onSelectionChange,
  onCanvasInitialized,
  zoomLevel = 1
}: UsePdfCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
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
    fabricCanvas.on('selection:created', () => onSelectionChange && onSelectionChange(true));
    fabricCanvas.on('selection:updated', () => onSelectionChange && onSelectionChange(true));
    fabricCanvas.on('selection:cleared', () => onSelectionChange && onSelectionChange(false));
    
    return () => {
      console.log("Cleaning up Fabric canvas in usePdfCanvas");
      
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

  // Update canvas size on window resize
  useEffect(() => {
    if (!canvas || !containerRef.current) return;
    
    const updateCanvasSize = () => {
      if (!canvas || !containerRef.current) return;
      
      try {
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
      } catch (error) {
        console.error("Error updating canvas size:", error);
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [canvas, initialImgData, zoomLevel]);

  // Display PDF when pageUrl changes
  useEffect(() => {
    if (!canvas || !pageUrl) return;
    
    // Clear existing objects but keep the canvas
    canvas.clear();
    
    console.log("Loading PDF page with URL:", pageUrl);
    
    // Load PDF image as background
    fabric.Image.fromURL(pageUrl, (img) => {
      if (!containerRef.current || !canvas) return;
      
      try {
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
      } catch (error) {
        console.error("Error setting PDF as background:", error);
      }
    }, { crossOrigin: 'anonymous' });
  }, [pageUrl, canvas]);

  // Apply zoom when zoom level changes for existing background
  useEffect(() => {
    if (!canvas || !initialImgData.img || !canvas.backgroundImage) return;
    
    try {
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
    } catch (error) {
      console.error("Error applying zoom:", error);
    }
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

  return {
    canvasRef,
    containerRef,
    canvas,
    isPanning,
    setIsPanning,
    initialImgData
  };
};
