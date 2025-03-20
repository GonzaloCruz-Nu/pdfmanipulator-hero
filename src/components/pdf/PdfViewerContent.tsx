
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { fabric } from 'fabric';
import { toast } from 'sonner';
import PdfEditToolbar, { EditToolType } from './PdfEditToolbar';

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
  const [hasSelection, setHasSelection] = useState(false);
  
  const [activeTool, setActiveTool] = useState<EditToolType>('select');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  
  // Initialize Fabric canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
      });
      
      setCanvas(fabricCanvas);
      
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

  // Track selection changes
  useEffect(() => {
    if (!canvas) return;

    const handleSelectionChange = () => {
      setHasSelection(!!canvas.getActiveObject());
    };

    canvas.on('selection:created', handleSelectionChange);
    canvas.on('selection:updated', handleSelectionChange);
    canvas.on('selection:cleared', handleSelectionChange);

    return () => {
      canvas.off('selection:created', handleSelectionChange);
      canvas.off('selection:updated', handleSelectionChange);
      canvas.off('selection:cleared', handleSelectionChange);
    };
  }, [canvas]);

  // Update canvas size on window resize
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

  // Display PDF when pageUrl changes
  useEffect(() => {
    if (!canvas || !pageUrl) return;
    
    // Clear existing content
    canvas.clear();
    
    // Load PDF image as background
    fabric.Image.fromURL(pageUrl, (img) => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        canvas.setDimensions({
          width: containerWidth,
          height: containerHeight
        });
        
        // Calculate scale to fit the PDF image in the container
        const scale = Math.min(
          (containerWidth * 0.9) / img.width!,
          (containerHeight * 0.9) / img.height!
        );
        
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
      }
    });
  }, [pageUrl, canvas]);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = false;

    switch (activeTool) {
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        break;
      case 'pen':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = size;
        break;
      case 'text':
      case 'rectangle':
      case 'circle':
        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        break;
    }
    
    canvas.renderAll();
  }, [activeTool, color, size, canvas]);

  // Handle canvas mouse events for drawing shapes
  const handleCanvasMouseDown = useCallback((e: fabric.IEvent) => {
    if (!canvas || activeTool === 'select' || activeTool === 'pen') return;
    
    const pointer = canvas.getPointer(e.e);
    const startX = pointer.x;
    const startY = pointer.y;

    if (activeTool === 'text') {
      const text = new fabric.IText('Texto', {
        left: startX,
        top: startY,
        fontFamily: fontFamily,
        fontSize: fontSize,
        fill: color,
        editable: true,
      });
      
      canvas.add(text);
      canvas.setActiveObject(text);
      setActiveTool('select');
      return;
    }

    let tempShape: fabric.Object;
    if (activeTool === 'rectangle') {
      tempShape = new fabric.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth: size,
      });
    } else if (activeTool === 'circle') {
      tempShape = new fabric.Circle({
        left: startX,
        top: startY,
        radius: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth: size,
      });
    } else {
      return;
    }

    canvas.add(tempShape);
    
    canvas.on('mouse:move', (moveEvent) => {
      const movePointer = canvas.getPointer(moveEvent.e);
      
      if (activeTool === 'rectangle') {
        const rect = tempShape as fabric.Rect;
        
        const width = Math.abs(movePointer.x - startX);
        const height = Math.abs(movePointer.y - startY);
        
        rect.set({
          width: width,
          height: height,
          left: Math.min(startX, movePointer.x),
          top: Math.min(startY, movePointer.y),
        });
        
        rect.setCoords();
      } else if (activeTool === 'circle') {
        const circle = tempShape as fabric.Circle;
        
        const radius = Math.sqrt(
          Math.pow(movePointer.x - startX, 2) + 
          Math.pow(movePointer.y - startY, 2)
        ) / 2;
        
        const centerX = (startX + movePointer.x) / 2;
        const centerY = (startY + movePointer.y) / 2;
        
        circle.set({
          radius: radius,
          left: centerX - radius,
          top: centerY - radius,
        });
        
        circle.setCoords();
      }
      
      canvas.renderAll();
    });
    
    canvas.on('mouse:up', () => {
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      setActiveTool('select');
      
      canvas.setActiveObject(tempShape);
      canvas.renderAll();
    });
  }, [canvas, activeTool, color, size, fontSize, fontFamily]);

  useEffect(() => {
    if (!canvas) return;
    
    canvas.on('mouse:down', handleCanvasMouseDown);
    
    return () => {
      canvas.off('mouse:down', handleCanvasMouseDown);
    };
  }, [canvas, handleCanvasMouseDown]);

  const handleToolChange = (tool: EditToolType) => {
    setActiveTool(tool);
  };

  const handleClearCanvas = () => {
    if (!canvas) return;
    
    const backgroundImage = canvas.backgroundImage;
    canvas.clear();
    
    if (backgroundImage) {
      canvas.setBackgroundImage(backgroundImage, canvas.renderAll.bind(canvas));
    }
    
    toast.success('Se han eliminado todos los elementos');
  };

  const handleDeleteSelected = () => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    
    if (activeObject) {
      canvas.remove(activeObject);
      toast.success('Elemento eliminado');
    }
  };

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
    <div className="flex flex-col h-full">
      <PdfEditToolbar 
        activeTool={activeTool}
        onToolChange={handleToolChange}
        color={color}
        onColorChange={setColor}
        size={size}
        onSizeChange={setSize}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        fontFamily={fontFamily}
        onFontFamilyChange={setFontFamily}
        onClearCanvas={handleClearCanvas}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={hasSelection}
      />
      
      <div 
        ref={containerRef} 
        className="w-full flex-1 flex justify-center items-center overflow-hidden relative bg-gray-100"
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
        
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
    </div>
  );
};

export default PdfViewerContent;
