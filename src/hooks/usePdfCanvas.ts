
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
  
  // Performance optimizations with refs
  const currentImageRef = useRef<fabric.Image | null>(null);
  const lastDisplayedUrl = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);
  const isMountedRef = useRef(true);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const activePanningRef = useRef(isPanning);
  const zoomLevelRef = useRef(zoomLevel);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      
      // Clear any pending timeouts
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // Update refs when props change
  useEffect(() => {
    activePanningRef.current = isPanning;
  }, [isPanning]);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
    
    // Apply zoom level to background image when zoomLevel changes
    if (canvas && canvas.backgroundImage) {
      try {
        const containerWidth = canvas.width || 1;
        const containerHeight = canvas.height || 1;
        
        // Calculate scale for PDF based on zoom level
        const scale = Math.min(
          (containerWidth * 0.85) / Math.max(initialImgData.width, 1),
          (containerHeight * 0.85) / Math.max(initialImgData.height, 1)
        ) * zoomLevel;
        
        // Apply scaling to background image
        canvas.backgroundImage.scale(scale);
        
        // Center the image
        const leftPos = (containerWidth - (canvas.backgroundImage.getScaledWidth() || 0)) / 2;
        const topPos = (containerHeight - (canvas.backgroundImage.getScaledHeight() || 0)) / 2;
        
        canvas.backgroundImage.set({
          left: leftPos,
          top: topPos
        });
        
        // Redraw canvas with the new scale
        canvas.renderAll();
        
        console.log(`Applied zoom level: ${zoomLevel}, scale: ${scale}`);
      } catch (error) {
        console.error("Error applying zoom:", error);
      }
    }
  }, [zoomLevel, canvas, initialImgData.width, initialImgData.height]);

  // Initialize Fabric canvas with proper error handling and optimized settings
  const initializeCanvas = useCallback((canvasEl: HTMLCanvasElement): fabric.Canvas | null => {
    try {
      // Store canvas element reference for safer cleanup
      canvasElementRef.current = canvasEl;
      
      console.log("Creating new Fabric canvas instance");
      
      // Create new canvas with optimized settings
      const fabricCanvas = new fabric.Canvas(canvasEl, {
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: false, // Optimize rendering
        stateful: false,
        enableRetinaScaling: false,
        imageSmoothingEnabled: true
      });
      
      // Set additional performance optimizations
      fabricCanvas.skipOffscreen = true;
      fabricCanvas.stopContextMenu = true;
      
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
      
      if (onCanvasInitialized) {
        onCanvasInitialized(fabricCanvas);
      }
      
      return fabricCanvas;
    } catch (error) {
      console.error("Error initializing canvas:", error);
      return null;
    }
  }, [onSelectionChange, onCanvasInitialized]);

  // Setup panning functionality
  useEffect(() => {
    if (!canvas) return;
    
    const handleMouseDown = (opt: fabric.IEvent) => {
      if (!activePanningRef.current) return;
      
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
      if (!isDraggingRef.current || !activePanningRef.current || !canvas) return;
      
      if (!canvas.backgroundImage) return;
      
      const evt = opt.e as MouseEvent;
      const deltaX = evt.clientX - lastPosXRef.current;
      const deltaY = evt.clientY - lastPosYRef.current;
      
      // Performance optimization: batch updates and reduce renders
      canvas.discardActiveObject();
      
      // Move the background image
      if (canvas.backgroundImage) {
        canvas.backgroundImage.set({
          left: (canvas.backgroundImage.left || 0) + deltaX,
          top: (canvas.backgroundImage.top || 0) + deltaY
        });
      }
      
      // Also move all objects on the canvas - but batch the update
      canvas.forEachObject(function(obj) {
        obj.set({
          left: obj.left! + deltaX,
          top: obj.top! + deltaY,
          hasControls: false
        });
      });
      
      // Update the cursor position
      lastPosXRef.current = evt.clientX;
      lastPosYRef.current = evt.clientY;
      
      // Throttle renders for better performance
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      
      renderTimeoutRef.current = setTimeout(() => {
        canvas.requestRenderAll();
        renderTimeoutRef.current = null;
      }, 10);
    };

    const handleMouseUp = () => {
      if (!canvas) return;
      
      isDraggingRef.current = false;
      
      // Re-enable object selection after panning
      if (activePanningRef.current) {
        canvas.selection = true;
        canvas.forEachObject(function(obj) {
          obj.selectable = true;
          obj.hasControls = true;
          obj.setCoords();
        });
        
        // Ensure we render with the correct object positions
        canvas.requestRenderAll();
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
  }, [canvas]);

  // Update canvas size with improved error handling and debouncing
  const updateCanvasSize = useCallback((containerEl: HTMLDivElement) => {
    if (!canvas || !isMountedRef.current) return;
    
    try {
      // Debounce resize operations
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = setTimeout(() => {
        if (!canvas || !isMountedRef.current) return;
        
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
            ) * zoomLevelRef.current;
            
            canvas.backgroundImage.scale(scale);
            
            // Center the image
            const leftPos = (containerWidth - (canvas.backgroundImage.getScaledWidth() || 0)) / 2;
            const topPos = (containerHeight - (canvas.backgroundImage.getScaledHeight() || 0)) / 2;
            
            canvas.backgroundImage.set({
              left: leftPos,
              top: topPos
            });
          }
          
          canvas.requestRenderAll();
        }
        
        resizeTimeoutRef.current = null;
      }, 100); // Debounce for performance
      
    } catch (error) {
      console.error("Error updating canvas size:", error);
    }
  }, [canvas, initialImgData.width, initialImgData.height]);

  // Display PDF page with improved performance and caching
  const displayPdfPage = useCallback((pageUrl: string, containerEl: HTMLDivElement) => {
    if (!canvas || !isMountedRef.current) return;
    
    // Skip if we're already displaying this URL to avoid flicker
    if (lastDisplayedUrl.current === pageUrl) {
      console.log("Skipping rendering of already displayed page");
      return;
    }
    
    try {
      console.log("Loading PDF page with URL - new implementation");
      lastDisplayedUrl.current = pageUrl;
      
      // Clear any scheduled renders
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
      
      // Immediately clear canvas to avoid ghosting
      canvas.clear();
      
      // Use image caching pattern for better performance
      const img = new Image();
      
      img.onload = () => {
        if (!canvas || !isMountedRef.current) return;
        
        try {
          const fabricImage = new fabric.Image(img, {
            originX: 'left',
            originY: 'top',
            objectCaching: true
          });
          
          // Store reference to current image
          currentImageRef.current = fabricImage;
          
          const containerWidth = containerEl.clientWidth;
          const containerHeight = containerEl.clientHeight;
          
          // Store initial image data for zooming
          const imgWidth = fabricImage.width || 1;
          const imgHeight = fabricImage.height || 1;
          
          setInitialImgData({
            width: imgWidth,
            height: imgHeight
          });
          
          // Calculate scale for PDF to fill more space
          const scale = Math.min(
            (containerWidth * 0.85) / imgWidth,
            (containerHeight * 0.85) / imgHeight
          ) * zoomLevelRef.current;
          
          // Apply scaling
          fabricImage.scale(scale);
          
          // Center the image in the canvas
          const leftPos = (containerWidth - (fabricImage.getScaledWidth() || 0)) / 2;
          const topPos = (containerHeight - (fabricImage.getScaledHeight() || 0)) / 2;
          
          // Set as background with positioning
          canvas.setBackgroundImage(fabricImage, () => {
            if (canvas && isMountedRef.current) {
              canvas.requestRenderAll();
              console.log("PDF page rendered successfully");
            }
          }, {
            left: leftPos,
            top: topPos
          });
        } catch (error) {
          console.error("Error setting PDF as background:", error);
        }
      };
      
      img.onerror = (error) => {
        console.error("Error loading PDF image:", error);
      };
      
      // Set the source last to start loading
      img.src = pageUrl;
      
    } catch (error) {
      console.error("Error displaying PDF page:", error);
    }
  }, [canvas]);

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
      
      // DON'T try to dispose or modify the DOM - just reset state
      console.log("Canvas state reset successfully");
    } catch (error) {
      console.error("Error during canvas cleanup:", error);
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
