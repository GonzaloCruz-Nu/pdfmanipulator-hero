
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { fabric } from 'fabric';
import { toast } from 'sonner';

interface PdfViewerContentProps {
  pageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  fileName: string;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}

const PdfViewerContent: React.FC<PdfViewerContentProps> = ({
  pageUrl,
  isLoading,
  error,
  fileName,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  // Initialize canvas when component mounts
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 1000,
        backgroundColor: '#FFFFFF',
      });
      
      setCanvas(fabricCanvas);
      
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

  // Update canvas size to match container when page loads or window resizes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvas && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        canvas.setWidth(containerWidth);
        canvas.setHeight(containerHeight);
        canvas.renderAll();
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [canvas]);

  // Load PDF page as background when the page changes
  useEffect(() => {
    if (!canvas || !pageUrl) return;
    
    // Clear existing objects when page changes
    canvas.clear();
    
    fabric.Image.fromURL(pageUrl, (img) => {
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: canvas.width! / img.width!,
        scaleY: canvas.height! / img.height!,
        originX: 'left',
        originY: 'top',
      });
      
      // Adjust canvas size to fit the image
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        const imgRatio = img.width! / img.height!;
        let newWidth = containerWidth;
        let newHeight = containerWidth / imgRatio;
        
        if (newHeight > containerHeight) {
          newHeight = containerHeight;
          newWidth = containerHeight * imgRatio;
        }
        
        img.scaleToWidth(newWidth);
        img.set({
          left: (containerWidth - newWidth) / 2,
          top: (containerHeight - img.getScaledHeight()) / 2,
        });
        
        canvas.renderAll();
      }
    });
  }, [pageUrl, canvas]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-2 text-sm text-muted-foreground">Cargando PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500 h-full flex flex-col items-center justify-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex justify-center items-center overflow-hidden relative"
    >
      <canvas ref={canvasRef} className="border border-border rounded" />
      
      {/* Navigation controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
          <button
            className="hover:bg-gray-100 p-2 rounded-full disabled:opacity-50"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-sm font-medium">
            {currentPage} / {totalPages}
          </span>
          
          <button
            className="hover:bg-gray-100 p-2 rounded-full disabled:opacity-50"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfViewerContent;
