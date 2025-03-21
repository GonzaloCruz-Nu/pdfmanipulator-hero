
import React, { useEffect, useCallback, useRef } from 'react';
import { fabric } from 'fabric';
import { CensorToolType } from './PdfCensorToolbar';
import { toast } from 'sonner';

interface PdfCensorToolsProps {
  canvas: fabric.Canvas | null;
  activeTool: CensorToolType;
  color: string;
  size: number;
  onToolChange: (tool: CensorToolType) => void;
}

const PdfCensorTools: React.FC<PdfCensorToolsProps> = ({
  canvas,
  activeTool,
  color,
  size,
  onToolChange,
}) => {
  // Use ref to track the current props for event handlers
  const toolRef = useRef(activeTool);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  const onToolChangeRef = useRef(onToolChange);
  const mouseDownHandlerRef = useRef<((e: fabric.IEvent) => void) | null>(null);
  
  // Update refs when props change
  useEffect(() => {
    toolRef.current = activeTool;
    colorRef.current = color;
    sizeRef.current = size;
    onToolChangeRef.current = onToolChange;
  }, [activeTool, color, size, onToolChange]);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;

    console.log("Actualizando herramienta de censura:", activeTool, "con color:", color);

    // Clear any existing drawing mode
    canvas.isDrawingMode = false;

    // Reset canvas selection options based on active tool
    switch (activeTool) {
      case 'select':
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        break;
      case 'rectangle':
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        break;
      case 'eraser':
        canvas.isDrawingMode = true;
        // Configure eraser
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = 'white';
          canvas.freeDrawingBrush.width = size * 2;
        }
        break;
    }
    
    canvas.renderAll();

  }, [activeTool, color, size, canvas]);

  // Create a single handleCanvasMouseDown handler that captures the current canvas and tool
  const handleCanvasMouseDown = useCallback((e: fabric.IEvent) => {
    const currentCanvas = canvas;
    const currentTool = toolRef.current;
    const currentColor = colorRef.current;
    const currentSize = sizeRef.current;
    const currentOnToolChange = onToolChangeRef.current;
    
    if (!currentCanvas || currentTool !== 'rectangle') return;
    
    console.log("Dibujando rectángulo de censura");
    
    const pointer = currentCanvas.getPointer(e.e);
    const startX = pointer.x;
    const startY = pointer.y;

    // Create redaction rectangle
    const rect = new fabric.Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      fill: currentColor,
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 1,
    });
    
    currentCanvas.add(rect);
    
    const handleMouseMove = (moveEvent: fabric.IEvent) => {
      if (!currentCanvas) return;
      const movePointer = currentCanvas.getPointer(moveEvent.e);
      
      const width = Math.abs(movePointer.x - startX);
      const height = Math.abs(movePointer.y - startY);
      
      rect.set({
        width: width,
        height: height,
        left: Math.min(startX, movePointer.x),
        top: Math.min(startY, movePointer.y),
      });
      
      rect.setCoords();
      currentCanvas.renderAll();
    };
    
    const handleMouseUp = () => {
      if (!currentCanvas) return;
      
      // Important: Remove the event handlers
      currentCanvas.off('mouse:move', handleMouseMove);
      currentCanvas.off('mouse:up', handleMouseUp);
      
      // If the rectangle is too small, remove it
      if (rect.width! < 5 || rect.height! < 5) {
        currentCanvas.remove(rect);
      } else {
        // Switch to selection tool after drawing
        currentOnToolChange('select');
        currentCanvas.setActiveObject(rect);
      }
      
      currentCanvas.renderAll();
    };
    
    currentCanvas.on('mouse:move', handleMouseMove);
    currentCanvas.on('mouse:up', handleMouseUp);
  }, [canvas]);

  // Set up and clean up event handlers
  useEffect(() => {
    if (!canvas) return;
    
    console.log("Configurando eventos del canvas para herramienta", activeTool);
    
    // Remove previous handler if it exists
    if (mouseDownHandlerRef.current) {
      canvas.off('mouse:down', mouseDownHandlerRef.current);
      mouseDownHandlerRef.current = null;
    }
    
    // Store the new handler reference
    mouseDownHandlerRef.current = handleCanvasMouseDown;
    
    // Add mouse down event listener
    canvas.on('mouse:down', handleCanvasMouseDown);
    
    // Return cleanup function that properly removes the specific handler
    return () => {
      if (canvas && mouseDownHandlerRef.current) {
        try {
          canvas.off('mouse:down', mouseDownHandlerRef.current);
          mouseDownHandlerRef.current = null;
          console.log("Eventos del canvas limpiados correctamente");
        } catch (error) {
          console.error("Error al limpiar eventos del canvas:", error);
        }
      }
    };
  }, [canvas, handleCanvasMouseDown]);

  return null;
};

export default PdfCensorTools;
