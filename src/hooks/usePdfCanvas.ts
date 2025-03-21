
import { useState, useCallback, useRef, useEffect } from 'react';
import { fabric } from 'fabric';

interface UsePdfCanvasProps {
  onSelectionChange?: (hasSelection: boolean) => void;
  onCanvasInitialized?: (canvas: fabric.Canvas) => void;
  zoomLevel: number;
  isPanning?: boolean;
}

export const usePdfCanvas = ({
  onSelectionChange,
  onCanvasInitialized,
  zoomLevel = 1,
  isPanning = false
}: UsePdfCanvasProps) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [initialImgData, setInitialImgData] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0
  });
  const currentImageRef = useRef<fabric.Image | null>(null);
  const lastDisplayedUrl = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);
  const isMountedRef = useRef(true);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize Fabric canvas with proper error handling
  const initializeCanvas = useCallback((canvasEl: HTMLCanvasElement): fabric.Canvas | null => {
    try {
      // Store canvas element reference for safer cleanup
      canvasElementRef.current = canvasEl;
      
      console.log("Creating new Fabric canvas instance");
      
      // Create new canvas with optimized settings
      const fabricCanvas = new fabric.Canvas(canvasEl, {
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        stateful: false,
        enableRetinaScaling: false,
        imageSmoothingEnabled: true
      });
      
      if (isMountedRef.current) {
        setCanvas(fabricCanvas);
      }
      
      // Handle selection changes
      const handleSelectionCreated = () => onSelectionChange && onSelectionChange(true);
      const handleSelectionUpdated = () => onSelectionChange && onSelectionChange(true);
      const handleSelectionCleared = () => onSelectionChange && onSelectionChange(false);
      
      fabricCanvas.on('selection:created', handleSelectionCreated);
      fabricCanvas.on('selection:updated', handleSelectionUpdated);
      fabricCanvas.on('selection:cleared', handleSelectionCleared);
      
      return fabricCanvas;
    } catch (error) {
      console.error("Error initializing canvas:", error);
      return null;
    }
  }, [onSelectionChange]);

  // Setup panning functionality
  useEffect(() => {
    if (!canvas) return;
    
    const handleMouseDown = (opt: fabric.IEvent) => {
      if (!isPanning) return;
      
      isDraggingRef.current = true;
      
      const evt = opt.e as MouseEvent;
      lastPosXRef.current = evt.clientX;
      lastPosYRef.current = evt.clientY;
      
      // Disable object selection while panning
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.forEachObject(function(obj) {
        obj.selectable = false;
      });
      canvas.renderAll();
    };

    const handleMouseMove = (opt: fabric.IEvent) => {
      if (!isDraggingRef.current || !isPanning || !canvas) return;
      
      if (!canvas.backgroundImage) return;
      
      const evt = opt.e as MouseEvent;
      const deltaX = evt.clientX - lastPosXRef.current;
      const deltaY = evt.clientY - lastPosYRef.current;
      
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
      
      lastPosXRef.current = evt.clientX;
      lastPosYRef.current = evt.clientY;
    };

    const handleMouseUp = () => {
      if (!canvas) return;
      
      isDraggingRef.current = false;
      
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
      if (canvas) {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      }
    };
  }, [canvas, isPanning]);

  // Update canvas size with improved error handling
  const updateCanvasSize = useCallback((containerEl: HTMLDivElement) => {
    if (!canvas || !isMountedRef.current) return;
    
    try {
      const containerWidth = containerEl.clientWidth;
      const containerHeight = containerEl.clientHeight;
      
      // Only resize if dimensions actually changed
      if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
        canvas.setWidth(containerWidth);
        canvas.setHeight(containerHeight);
        
        // If we have a background image, reposition it
        if (canvas.backgroundImage) {
          const scale = Math.min(
            (containerWidth * 0.85) / Math.max(initialImgData.width, 1),
            (containerHeight * 0.85) / Math.max(initialImgData.height, 1)
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
      }
    } catch (error) {
      console.error("Error updating canvas size:", error);
    }
  }, [canvas, initialImgData, zoomLevel]);

  // Display PDF page with improved caching and loading
  const displayPdfPage = useCallback((pageUrl: string, containerEl: HTMLDivElement) => {
    if (!canvas || !isMountedRef.current) return;
    
    // Skip if we're already displaying this URL (avoid flickering)
    if (lastDisplayedUrl.current === pageUrl) {
      console.log("Skipping rendering of already displayed page:", pageUrl);
      return;
    }
    
    try {
      console.log("Loading PDF page with URL:", pageUrl);
      lastDisplayedUrl.current = pageUrl;
      
      // Load PDF image as background with improved options
      fabric.Image.fromURL(pageUrl, (img) => {
        if (!canvas || !isMountedRef.current) return;
        
        try {
          // Clear any existing objects except background
          canvas.getObjects().forEach(obj => {
            canvas.remove(obj);
          });
          
          // Store reference to current image
          currentImageRef.current = img;
          
          const containerWidth = containerEl.clientWidth;
          const containerHeight = containerEl.clientHeight;
          
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
        } catch (error) {
          console.error("Error setting PDF as background:", error);
        }
      }, { 
        crossOrigin: 'anonymous',
        enableRetinaScaling: false,
        objectCaching: true
      });
    } catch (error) {
      console.error("Error displaying PDF page:", error);
    }
  }, [canvas, zoomLevel]);

  // Safer cleanup function
  const cleanup = useCallback(() => {
    console.log("Executing canvas cleanup in usePdfCanvas hook");
    
    if (!canvas) {
      console.log("No canvas to clean up");
      return;
    }
    
    try {
      // First remove all event listeners to prevent memory leaks
      canvas.off();
      
      // Clear objects from the canvas
      canvas.clear();
      
      // Safer canvas disposal approach
      try {
        // Just null the canvas itself rather than trying to dispose
        // This avoids the DOM node removal errors
        setCanvas(null);
        console.log("Canvas nulled successfully");
      } catch (error) {
        console.error("Error during canvas cleanup:", error);
      }
    } finally {
      // Always reset state variables
      if (isMountedRef.current) {
        setCanvas(null);
      }
      currentImageRef.current = null;
      lastDisplayedUrl.current = null;
      canvasElementRef.current = null;
    }
  }, [canvas]);

  return {
    canvas,
    isPanning,
    initializeCanvas,
    updateCanvasSize,
    displayPdfPage,
    cleanup,
    initialImgData
  };
};
