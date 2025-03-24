
import { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { useCanvasInitialization } from './useCanvasInitialization';
import { usePdfDisplay } from './usePdfDisplay';
import { useCanvasSize } from './useCanvasSize';
import { usePanning } from './usePanning';
import { useZoom } from './useZoom';

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
  const isMountedRef = useRef(true);

  // Initialize sub-hooks
  const {
    initializeCanvas,
    cleanup: cleanupCanvas,
    canvasElementRef
  } = useCanvasInitialization({
    onSelectionChange,
    onCanvasInitialized
  });

  const {
    initialImgData,
    displayPdfPage: displayPage,
    currentImageRef,
    lastDisplayedUrl
  } = usePdfDisplay({
    zoomLevel
  });
  
  const {
    updateCanvasSize: updateSize,
    resizeTimeoutRef
  } = useCanvasSize({
    initialImgData,
    zoomLevel
  });

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      
      // Clear any pending timeouts
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [resizeTimeoutRef]);

  // Apply panning functionality
  usePanning({
    canvas,
    isPanning
  });

  // Apply zoom effects
  useZoom({
    canvas,
    zoomLevel,
    initialImgData
  });

  // Wrapper functions to provide consistent API
  const displayPdfPage = useCallback((pageUrl: string, containerEl: HTMLDivElement) => {
    displayPage(canvas, pageUrl, containerEl);
  }, [canvas, displayPage]);

  const updateCanvasSize = useCallback((containerEl: HTMLDivElement) => {
    updateSize(canvas, containerEl);
  }, [canvas, updateSize]);

  // Cleanup function that coordinates all sub-cleanups
  const cleanup = useCallback(() => {
    console.log("Executing canvas cleanup in usePdfCanvas hook");
    
    cleanupCanvas(canvas);
    
    if (isMountedRef.current) {
      setCanvas(null);
    }
    
    currentImageRef.current = null;
    lastDisplayedUrl.current = null;
    canvasElementRef.current = null;
  }, [canvas, cleanupCanvas]);

  return {
    canvas,
    isPanning,
    initializeCanvas: useCallback((canvasEl: HTMLCanvasElement) => {
      const fabricCanvas = initializeCanvas(canvasEl);
      if (fabricCanvas && isMountedRef.current) {
        setCanvas(fabricCanvas);
      }
      return fabricCanvas;
    }, [initializeCanvas]),
    updateCanvasSize,
    displayPdfPage,
    cleanup,
    initialImgData
  };
};
