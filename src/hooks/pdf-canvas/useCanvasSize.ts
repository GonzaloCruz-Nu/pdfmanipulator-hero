
import { useCallback, useRef } from 'react';
import { fabric } from 'fabric';

interface UseCanvasSizeProps {
  initialImgData: {
    width: number;
    height: number;
  };
  zoomLevel: number;
}

export const useCanvasSize = ({ initialImgData, zoomLevel }: UseCanvasSizeProps) => {
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  // Update canvas size with improved error handling and debouncing
  const updateCanvasSize = useCallback((canvas: fabric.Canvas | null, containerEl: HTMLDivElement) => {
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
          
          canvas.requestRenderAll();
        }
        
        resizeTimeoutRef.current = null;
      }, 100); // Debounce for performance
      
    } catch (error) {
      console.error("Error updating canvas size:", error);
    }
  }, [initialImgData.width, initialImgData.height, zoomLevel]);

  return {
    updateCanvasSize,
    resizeTimeoutRef,
    isMountedRef
  };
};
