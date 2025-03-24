
import { useCallback, useRef } from 'react';
import { fabric } from 'fabric';

interface UseCanvasInitializationProps {
  onSelectionChange?: (hasSelection: boolean) => void;
  onCanvasInitialized?: (canvas: fabric.Canvas) => void;
}

export const useCanvasInitialization = ({
  onSelectionChange,
  onCanvasInitialized
}: UseCanvasInitializationProps) => {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const isMountedRef = useRef(true);

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

  // Safer cleanup function
  const cleanup = useCallback((canvas: fabric.Canvas | null) => {
    if (!canvas) {
      console.log("No canvas to clean up");
      return;
    }
    
    try {
      // First remove all event listeners to prevent memory leaks
      canvas.off();
      
      // Clear objects from the canvas
      canvas.clear();
      
      console.log("Canvas state reset successfully");
    } catch (error) {
      console.error("Error during canvas cleanup:", error);
    }
  }, []);

  return {
    initializeCanvas,
    cleanup,
    canvasElementRef,
    isMountedRef
  };
};
