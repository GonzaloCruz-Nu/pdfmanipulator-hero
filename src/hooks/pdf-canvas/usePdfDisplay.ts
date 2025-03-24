
import { useState, useCallback, useRef } from 'react';
import { fabric } from 'fabric';

interface UsePdfDisplayProps {
  zoomLevel: number;
}

export const usePdfDisplay = ({ zoomLevel }: UsePdfDisplayProps) => {
  const [initialImgData, setInitialImgData] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0
  });
  
  const currentImageRef = useRef<fabric.Image | null>(null);
  const lastDisplayedUrl = useRef<string | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Display PDF page with improved performance and caching
  const displayPdfPage = useCallback((canvas: fabric.Canvas | null, pageUrl: string, containerEl: HTMLDivElement) => {
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
          ) * zoomLevel;
          
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
  }, []);

  return {
    initialImgData,
    displayPdfPage,
    lastDisplayedUrl,
    currentImageRef,
    renderTimeoutRef,
    isMountedRef
  };
};
