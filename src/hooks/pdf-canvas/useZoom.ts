
import { useEffect } from 'react';
import { fabric } from 'fabric';

interface UseZoomProps {
  canvas: fabric.Canvas | null;
  zoomLevel: number;
  initialImgData: {
    width: number;
    height: number;
  };
}

export const useZoom = ({ canvas, zoomLevel, initialImgData }: UseZoomProps) => {
  // Apply zoom level to background image when zoomLevel changes
  useEffect(() => {
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

  return {};
};
