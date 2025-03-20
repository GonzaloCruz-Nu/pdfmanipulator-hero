
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
  activeTool: "select" | "addText" | "editText" | "pen" | "rectangle" | "circle" | "addImage" | "erase";
  textOptions?: {
    fontSize: number;
    color: string;
    fontFamily?: string;
  };
  drawOptions?: {
    color: string;
    width: number;
    fill?: string;
  };
  onAnnotationAdded?: (annotation: any) => void;
}

const PdfViewerContent: React.FC<PdfViewerContentProps> = ({
  pageUrl,
  isLoading,
  error,
  fileName,
  currentPage,
  activeTool,
  textOptions = { fontSize: 16, color: '#000000', fontFamily: 'Arial' },
  drawOptions = { color: '#000000', width: 2 },
  onAnnotationAdded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<fabric.Image | null>(null);
  const [scale, setScale] = useState(1);

  // Initialize canvas when component mounts
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 1000,
        backgroundColor: '#FFFFFF',
      });
      
      fabricCanvas.freeDrawingBrush.color = drawOptions.color;
      fabricCanvas.freeDrawingBrush.width = drawOptions.width;
      
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
        
        // Reposition background if exists
        if (backgroundImage) {
          const imgRatio = backgroundImage.width! / backgroundImage.height!;
          let newWidth = containerWidth;
          let newHeight = containerWidth / imgRatio;
          
          if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = containerHeight * imgRatio;
          }
          
          backgroundImage.scaleToWidth(newWidth);
          backgroundImage.set({
            left: (containerWidth - newWidth) / 2,
            top: (containerHeight - backgroundImage.getScaledHeight()) / 2,
          });
          canvas.renderAll();
        }
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [canvas, backgroundImage]);

  // Update tools based on active tool
  useEffect(() => {
    if (!canvas) return;
    
    // Disable all event handlers
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    
    // Disable drawing mode by default
    canvas.isDrawingMode = false;
    
    switch (activeTool) {
      case 'addText':
        canvas.defaultCursor = 'text';
        canvas.hoverCursor = 'text';
        canvas.on('mouse:down', addTextHandler);
        break;
      
      case 'editText':
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';
        // Enable editing existing text objects
        break;
      
      case 'pen':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = drawOptions.color;
        canvas.freeDrawingBrush.width = drawOptions.width;
        break;
      
      case 'rectangle':
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        canvas.on('mouse:down', startRectangle);
        canvas.on('mouse:move', moveRectangle);
        canvas.on('mouse:up', endRectangle);
        break;
      
      case 'circle':
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        canvas.on('mouse:down', startCircle);
        canvas.on('mouse:move', moveCircle);
        canvas.on('mouse:up', endCircle);
        break;
      
      case 'erase':
        canvas.defaultCursor = 'not-allowed';
        canvas.hoverCursor = 'not-allowed';
        canvas.on('mouse:down', eraseObject);
        break;
      
      default:
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';
        canvas.selection = true;
        break;
    }
    
    return () => {
      // Clean up event handlers when the effect runs again
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
    };
  }, [activeTool, canvas, textOptions, drawOptions]);

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
      
      setBackgroundImage(img);
      
      // Ajustar tamaño del canvas al tamaño de la imagen
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

  // Handlers for different tools
  const addTextHandler = (e: fabric.IEvent) => {
    if (!canvas) return;
    
    const pointer = canvas.getPointer(e.e);
    const text = new fabric.IText('Haga clic para editar', {
      left: pointer.x,
      top: pointer.y,
      fontSize: textOptions.fontSize,
      fontFamily: textOptions.fontFamily || 'Arial',
      fill: textOptions.color,
      editable: true,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    
    if (onAnnotationAdded) {
      onAnnotationAdded({
        type: 'text',
        properties: { ...textOptions },
        pageNum: currentPage,
        object: text
      });
    }
    
    toast.success("Texto añadido correctamente");
  };

  // Variables para almacenar objetos temporales de dibujo
  let startX = 0;
  let startY = 0;
  let rect: fabric.Rect | null = null;
  let circle: fabric.Circle | null = null;

  const startRectangle = (e: fabric.IEvent) => {
    if (!canvas || isDrawing) return;
    
    setIsDrawing(true);
    const pointer = canvas.getPointer(e.e);
    startX = pointer.x;
    startY = pointer.y;
    
    rect = new fabric.Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      fill: drawOptions.fill || 'transparent',
      stroke: drawOptions.color,
      strokeWidth: drawOptions.width,
      selectable: true,
    });
    
    canvas.add(rect);
  };

  const moveRectangle = (e: fabric.IEvent) => {
    if (!canvas || !isDrawing || !rect) return;
    
    const pointer = canvas.getPointer(e.e);
    
    if (pointer.x < startX) {
      rect.set({ left: pointer.x });
    }
    
    if (pointer.y < startY) {
      rect.set({ top: pointer.y });
    }
    
    rect.set({
      width: Math.abs(pointer.x - startX),
      height: Math.abs(pointer.y - startY),
    });
    
    canvas.renderAll();
  };

  const endRectangle = () => {
    if (!canvas || !isDrawing || !rect) return;
    
    setIsDrawing(false);
    canvas.setActiveObject(rect);
    
    if (onAnnotationAdded) {
      onAnnotationAdded({
        type: 'rectangle',
        properties: { ...drawOptions },
        pageNum: currentPage,
        object: rect
      });
    }
    
    toast.success("Rectángulo añadido correctamente");
  };

  const startCircle = (e: fabric.IEvent) => {
    if (!canvas || isDrawing) return;
    
    setIsDrawing(true);
    const pointer = canvas.getPointer(e.e);
    startX = pointer.x;
    startY = pointer.y;
    
    circle = new fabric.Circle({
      left: startX,
      top: startY,
      radius: 0,
      fill: drawOptions.fill || 'transparent',
      stroke: drawOptions.color,
      strokeWidth: drawOptions.width,
      selectable: true,
    });
    
    canvas.add(circle);
  };

  const moveCircle = (e: fabric.IEvent) => {
    if (!canvas || !isDrawing || !circle) return;
    
    const pointer = canvas.getPointer(e.e);
    const radius = Math.max(
      Math.abs(pointer.x - startX),
      Math.abs(pointer.y - startY)
    ) / 2;
    
    circle.set({
      left: Math.min(pointer.x, startX),
      top: Math.min(pointer.y, startY),
      radius: radius,
    });
    
    canvas.renderAll();
  };

  const endCircle = () => {
    if (!canvas || !isDrawing || !circle) return;
    
    setIsDrawing(false);
    canvas.setActiveObject(circle);
    
    if (onAnnotationAdded) {
      onAnnotationAdded({
        type: 'circle',
        properties: { ...drawOptions },
        pageNum: currentPage,
        object: circle
      });
    }
    
    toast.success("Círculo añadido correctamente");
  };

  const eraseObject = (e: fabric.IEvent) => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      toast.success("Objeto eliminado correctamente");
    } else {
      // Si no hay un objeto seleccionado, intentamos encontrar uno en la posición del clic
      const pointer = canvas.getPointer(e.e);
      const objects = canvas.getObjects();
      
      for (let i = objects.length - 1; i >= 0; i--) {
        const object = objects[i];
        if (object.containsPoint(pointer)) {
          canvas.remove(object);
          toast.success("Objeto eliminado correctamente");
          break;
        }
      }
    }
    
    canvas.renderAll();
  };

  // Zoom controls
  const zoomIn = () => {
    if (!canvas) return;
    setScale(prev => {
      const newScale = Math.min(prev + 0.1, 3);
      canvas.setZoom(newScale);
      return newScale;
    });
  };

  const zoomOut = () => {
    if (!canvas) return;
    setScale(prev => {
      const newScale = Math.max(prev - 0.1, 0.5);
      canvas.setZoom(newScale);
      return newScale;
    });
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
    <div 
      ref={containerRef} 
      className="w-full h-full flex justify-center items-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="border border-border rounded" />
    </div>
  );
};

export default PdfViewerContent;
