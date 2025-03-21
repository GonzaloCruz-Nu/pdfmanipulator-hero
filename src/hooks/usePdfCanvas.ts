import { useState, useCallback, useRef, useEffect } from 'react';
import { fabric } from 'fabric';

interface UsePdfCanvasProps {
  onSelectionChange?: (hasSelection: boolean) => void;
  onCanvasInitialized?: (canvas: fabric.Canvas) => void;
  zoomLevel: number;
}

export const usePdfCanvas = ({
  onSelectionChange,
  onCanvasInitialized,
  zoomLevel = 1
}: UsePdfCanvasProps) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [initialImgData, setInitialImgData] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0
  });

  // Initialize Fabric canvas with proper error handling
  const initializeCanvas = useCallback((canvasEl: HTMLCanvasElement): fabric.Canvas | null => {
    try {
      console.log("Creating new Fabric canvas instance");
      
      // Create new canvas
      const fabricCanvas = new fabric.Canvas(canvasEl, {
        selection: true,
      });
      
      setCanvas(fabricCanvas);
      
      // Handle selection changes
      const handleSelectionCreated = () => onSelectionChange && onSelectionChange(true);
      const handleSelectionUpdated = () => onSelectionChange && onSelectionChange(true);
      const handleSelectionCleared = () => onSelectionChange && onSelectionChange(false);
      
      fabricCanvas.on('selection:created', handleSelectionCreated);
      fabricCanvas.on('selection:updated', handleSelectionUpdated);
      fabricCanvas.on('selection:cleared', handleSelectionCleared);
      
      // Setup panning functionality
      let isDragging = false;
      let lastPosX = 0;
      let lastPosY = 0;

      const handleMouseDown = (opt: fabric.IEvent) => {
        if (!isPanning) return;
        
        isDragging = true;
        
        const evt = opt.e as MouseEvent;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        
        // Disable object selection while panning
        if (isPanning && fabricCanvas) {
          fabricCanvas.selection = false;
          fabricCanvas.discardActiveObject();
          fabricCanvas.forEachObject(function(obj) {
            obj.selectable = false;
          });
          fabricCanvas.renderAll();
        }
      };

      const handleMouseMove = (opt: fabric.IEvent) => {
        if (!isDragging || !isPanning || !fabricCanvas) return;
        
        if (!fabricCanvas.backgroundImage) return;
        
        const evt = opt.e as MouseEvent;
        const deltaX = evt.clientX - lastPosX;
        const deltaY = evt.clientY - lastPosY;
        
        // Move the background image
        fabricCanvas.backgroundImage.set({
          left: (fabricCanvas.backgroundImage.left || 0) + deltaX,
          top: (fabricCanvas.backgroundImage.top || 0) + deltaY
        });
        
        // Also move all objects on the canvas
        fabricCanvas.forEachObject(function(obj) {
          obj.set({
            left: obj.left! + deltaX,
            top: obj.top! + deltaY
          });
          obj.setCoords();
        });
        
        fabricCanvas.renderAll();
        
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      };

      const handleMouseUp = () => {
        isDragging = false;
        
        // Re-enable object selection after panning
        if (isPanning && fabricCanvas) {
          fabricCanvas.selection = true;
          fabricCanvas.forEachObject(function(obj) {
            obj.selectable = true;
          });
          fabricCanvas.renderAll();
        }
      };

      fabricCanvas.on('mouse:down', handleMouseDown);
      fabricCanvas.on('mouse:move', handleMouseMove);
      fabricCanvas.on('mouse:up', handleMouseUp);
      
      return fabricCanvas;
    } catch (error) {
      console.error("Error initializing canvas:", error);
      return null;
    }
  }, [isPanning, onSelectionChange]);

  // Update canvas size
  const updateCanvasSize = useCallback((containerEl: HTMLDivElement) => {
    if (!canvas) return;
    
    try {
      const containerWidth = containerEl.clientWidth;
      const containerHeight = containerEl.clientHeight;
      
      console.log("Container dimensions:", containerWidth, containerHeight);
      
      canvas.setWidth(containerWidth);
      canvas.setHeight(containerHeight);
      
      // If we have a background image, reposition it
      if (canvas.backgroundImage) {
        const scale = Math.min(
          (containerWidth * 0.85) / initialImgData.width,
          (containerHeight * 0.85) / initialImgData.height
        ) * zoomLevel;
        
        canvas.backgroundImage.scale(scale);
        
        // Center the image
        const leftPos = (containerWidth - (canvas.backgroundImage.getScaledWidth() || 0)) / 2;
        const topPos = (containerHeight - (canvas.backgroundImage.getScaledHeight() || 0)) / 2;
        
        canvas.backgroundImage.set({
          left: leftPos,
          top: topPos
        });
      }
      
      canvas.renderAll();
    } catch (error) {
      console.error("Error updating canvas size:", error);
    }
  }, [canvas, initialImgData, zoomLevel]);

  // Display PDF page
  const displayPdfPage = useCallback((pageUrl: string, containerEl: HTMLDivElement) => {
    if (!canvas) return;
    
    try {
      // First remove existing objects but keep the canvas
      canvas.remove(...canvas.getObjects());
      
      console.log("Loading PDF page with URL:", pageUrl);
      
      // Load PDF image as background
      fabric.Image.fromURL(pageUrl, (img) => {
        if (!canvas) return;
        
        try {
          const containerWidth = containerEl.clientWidth;
          const containerHeight = containerEl.clientHeight;
          
          console.log("Container dimensions:", containerWidth, containerHeight);
          console.log("Image dimensions:", img.width, img.height);
          
          // Store initial image data for zooming
          setInitialImgData({
            width: img.width as number,
            height: img.height as number
          });
          
          // Calculate scale for PDF to fill more space
          const scale = Math.min(
            (containerWidth * 0.85) / (img.width || 1),
            (containerHeight * 0.85) / (img.height || 1)
          ) * zoomLevel;
          
          // Apply scaling
          img.scale(scale);
          
          // Center the image in the canvas
          const leftPos = (containerWidth - (img.getScaledWidth() || 0)) / 2;
          const topPos = (containerHeight - (img.getScaledHeight() || 0)) / 2;
          
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
    } catch (error) {
      console.error("Error displaying PDF page:", error);
    }
  }, [canvas, zoomLevel]);

  // Cleanup function to be called when component unmounts
  const cleanup = useCallback(() => {
    console.log("Executing canvas cleanup in usePdfCanvas hook");
    
    if (!canvas) {
      console.log("No canvas to clean up");
      return;
    }
    
    try {
      // Remove all event listeners first
      canvas.off();
      
      // Then dispose the canvas
      canvas.dispose();
      console.log("Canvas disposed successfully");
    } catch (error) {
      console.error("Error during canvas cleanup:", error);
    } finally {
      // Always set the canvas to null
      setCanvas(null);
    }
  }, [canvas]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    canvas,
    isPanning,
    setIsPanning,
    initializeCanvas,
    updateCanvasSize,
    displayPdfPage,
    cleanup,
    initialImgData
  };
};
