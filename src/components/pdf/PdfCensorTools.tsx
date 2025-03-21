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
  const canvasRef = useRef<fabric.Canvas | null>(null);
  
  // Update refs when props change
  useEffect(() => {
    toolRef.current = activeTool;
    colorRef.current = color;
    sizeRef.current = size; 
    onToolChangeRef.current = onToolChange;
  }, [activeTool, color, size, onToolChange]);

  // Keep track of canvas changes
  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);

  // Reset drawing state when canvas changes (like on page change)
  useEffect(() => {
    if (canvas) {
      console.log("Canvas reference changed in PdfCensorTools");
      isDrawingRef.current = false;
      
      // Explicitly apply tool settings to the new canvas
      applyToolSettings();
      
      // Force reattach event listeners
      setupEventListeners();
    }
    
    return () => {
      cleanupEventListeners();
    };
  }, [canvas]);

  // Apply tool settings based on current active tool
  const applyToolSettings = useCallback(() => {
    if (!canvasRef.current) return;

    console.log("Applying censor tool settings:", activeTool, "with color:", color);

    // Clear any existing drawing mode
    canvasRef.current.isDrawingMode = false;

    // Reset canvas selection options based on active tool
    switch (activeTool) {
      case 'select':
        canvasRef.current.selection = true;
        canvasRef.current.defaultCursor = 'default';
        canvasRef.current.forEachObject(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;
      case 'rectangle':
        canvasRef.current.selection = false;
        canvasRef.current.defaultCursor = 'crosshair';
        canvasRef.current.forEachObject(obj => {
          obj.selectable = false;
          obj.evented = false;
        });
        break;
      case 'eraser':
        canvasRef.current.isDrawingMode = true;
        // Configure eraser
        if (canvasRef.current.freeDrawingBrush) {
          canvasRef.current.freeDrawingBrush.color = 'white';
          canvasRef.current.freeDrawingBrush.width = size * 2;
        }
        break;
    }
    
    canvasRef.current.renderAll();
  }, [activeTool, color, size]);

  // Single function for rectangle drawing
  const handleRectangleDrawing = useCallback((e: fabric.IEvent) => {
    if (!canvasRef.current || toolRef.current !== 'rectangle' || isDrawingRef.current) return;
    
    console.log("Starting rectangle drawing");
    isDrawingRef.current = true;
    
    const pointer = canvasRef.current.getPointer(e.e);
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
    
    canvasRef.current.add(rect);
    
    const handleMouseMove = (moveEvent: fabric.IEvent) => {
      if (!canvasRef.current) return;
      
      const movePointer = canvasRef.current.getPointer(moveEvent.e);
      
      const width = Math.abs(movePointer.x - startX);
      const height = Math.abs(movePointer.y - startY);
      
      rect.set({
        width: width,
        height: height,
        left: Math.min(startX, movePointer.x),
        top: Math.min(startY, movePointer.y),
      });
      
      rect.setCoords();
      canvasRef.current.renderAll();
    };
    
    const handleMouseUp = () => {
      console.log("Finishing rectangle drawing");
      isDrawingRef.current = false;
      
      if (!canvasRef.current) return;
      
      // Remove the event handlers
      canvasRef.current.off('mouse:move', handleMouseMove);
      canvasRef.current.off('mouse:up', handleMouseUp);
      
      // If the rectangle is too small, remove it
      if (rect.width! < 5 || rect.height! < 5) {
        canvasRef.current.remove(rect);
        console.log("Rectangle too small, removed");
      } else {
        // Make sure rectangle is selectable
        rect.selectable = true;
        rect.evented = true;
        
        // Switch to selection tool after drawing
        onToolChangeRef.current('select');
        
        // Make all objects selectable again
        canvasRef.current.forEachObject(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
        
        canvasRef.current.setActiveObject(rect);
        console.log("Rectangle completed, switched to select tool");
      }
      
      canvasRef.current.renderAll();
    };
    
    canvasRef.current.on('mouse:move', handleMouseMove);
    canvasRef.current.on('mouse:up', handleMouseUp);
  }, []);

  // Set up event listeners
  const setupEventListeners = useCallback(() => {
    if (!canvasRef.current) return;
    
    console.log("Setting up canvas events for tool:", activeTool);
    
    // Clear any previous handlers
    cleanupEventListeners();
    
    // Store the handler in the ref
    if (activeTool === 'rectangle') {
      mouseDownHandlerRef.current = handleRectangleDrawing;
      canvasRef.current.on('mouse:down', handleRectangleDrawing);
    }
  }, [activeTool, handleRectangleDrawing]);

  // Clean up event listeners
  const cleanupEventListeners = useCallback(() => {
    if (!canvasRef.current || !mouseDownHandlerRef.current) return;
    
    console.log("Removing canvas events");
    canvasRef.current.off('mouse:down', mouseDownHandlerRef.current);
    mouseDownHandlerRef.current = null;
  }, []);

  // Handle tool changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    applyToolSettings();
    setupEventListeners();
  }, [activeTool, color, size, applyToolSettings, setupEventListeners]);

  return null;
};

export default PdfCensorTools;
