
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
  const isDrawingRef = useRef(false);
  const mouseDownHandlerRef = useRef<((e: fabric.IEvent) => void) | null>(null);
  
  // Update refs when props change
  useEffect(() => {
    toolRef.current = activeTool;
    colorRef.current = color;
    sizeRef.current = size; 
    onToolChangeRef.current = onToolChange;
  }, [activeTool, color, size, onToolChange]);

  // Reset drawing state when canvas changes (like on page change)
  useEffect(() => {
    if (canvas) {
      console.log("Canvas reference changed in PdfCensorTools");
      isDrawingRef.current = false;
      
      // Explicitly apply tool settings to the new canvas
      applyToolSettings();
    }
  }, [canvas]);

  // Apply tool settings based on current active tool
  const applyToolSettings = useCallback(() => {
    if (!canvas) return;

    console.log("Applying censor tool settings:", activeTool, "with color:", color);

    // Clear any existing drawing mode
    canvas.isDrawingMode = false;

    // Reset canvas selection options based on active tool
    switch (activeTool) {
      case 'select':
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.forEachObject(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;
      case 'rectangle':
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        canvas.forEachObject(obj => {
          obj.selectable = false;
          obj.evented = false;
        });
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
  }, [canvas, activeTool, color, size]);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;
    
    applyToolSettings();

    return () => {
      // Cleanup on tool change
      if (canvas && canvas.lowerCanvasEl) {
        try {
          console.log("Cleaning up tool:", activeTool);
          isDrawingRef.current = false;
        } catch (error) {
          console.error("Error cleaning up tool:", error);
        }
      }
    };
  }, [activeTool, color, size, canvas, applyToolSettings]);

  // Single function for rectangle drawing
  const handleRectangleDrawing = useCallback((e: fabric.IEvent) => {
    if (!canvas || toolRef.current !== 'rectangle' || isDrawingRef.current) return;
    
    console.log("Starting rectangle drawing");
    isDrawingRef.current = true;
    
    const pointer = canvas.getPointer(e.e);
    const startX = pointer.x;
    const startY = pointer.y;

    // Create redaction rectangle
    const rect = new fabric.Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      fill: colorRef.current,
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 1,
      selectable: true, // Make sure the rectangle is selectable when done
      evented: true
    });
    
    canvas.add(rect);
    
    const handleMouseMove = (moveEvent: fabric.IEvent) => {
      if (!canvas) return;
      
      const movePointer = canvas.getPointer(moveEvent.e);
      
      const width = Math.abs(movePointer.x - startX);
      const height = Math.abs(movePointer.y - startY);
      
      rect.set({
        width: width,
        height: height,
        left: Math.min(startX, movePointer.x),
        top: Math.min(startY, movePointer.y),
      });
      
      rect.setCoords();
      canvas.renderAll();
    };
    
    const handleMouseUp = () => {
      console.log("Finishing rectangle drawing");
      isDrawingRef.current = false;
      
      if (!canvas) return;
      
      // Remove the event handlers
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      
      // If the rectangle is too small, remove it
      if (rect.width! < 5 || rect.height! < 5) {
        canvas.remove(rect);
        console.log("Rectangle too small, removed");
      } else {
        // Make sure rectangle is selectable
        rect.selectable = true;
        rect.evented = true;
        
        // Switch to selection tool after drawing
        onToolChangeRef.current('select');
        
        // Make all objects selectable again
        canvas.forEachObject(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
        
        canvas.setActiveObject(rect);
        console.log("Rectangle completed, switched to select tool");
      }
      
      canvas.renderAll();
    };
    
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
  }, [canvas]);

  // Set up and clean up event handlers
  useEffect(() => {
    if (!canvas) return;
    
    console.log("Setting up canvas events for tool:", activeTool);
    
    // Clear any previous handlers to avoid duplicates
    if (mouseDownHandlerRef.current) {
      canvas.off('mouse:down', mouseDownHandlerRef.current);
      mouseDownHandlerRef.current = null;
    }
    
    // Store the handler in the ref
    if (activeTool === 'rectangle') {
      mouseDownHandlerRef.current = handleRectangleDrawing;
      canvas.on('mouse:down', handleRectangleDrawing);
    }
    
    // Return cleanup function
    return () => {
      if (!canvas) return;
      
      console.log("Removing canvas events for tool:", activeTool);
      if (mouseDownHandlerRef.current) {
        canvas.off('mouse:down', mouseDownHandlerRef.current);
        mouseDownHandlerRef.current = null;
      }
    };
  }, [canvas, activeTool, handleRectangleDrawing]);

  return null;
};

export default PdfCensorTools;
