
import React, { useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import { CensorToolType } from './PdfCensorToolbar';

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
  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;

    console.log("Actualizando herramienta de censura:", activeTool, "con color:", color);

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

  // Handle canvas mouse events for drawing shapes
  const handleCanvasMouseDown = useCallback((e: fabric.IEvent) => {
    if (!canvas || activeTool !== 'rectangle') return;
    
    console.log("Dibujando rectángulo de censura");
    
    const pointer = canvas.getPointer(e.e);
    const startX = pointer.x;
    const startY = pointer.y;

    // Create redaction rectangle
    const rect = new fabric.Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      fill: color,
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 1,
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
      if (!canvas) return;
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      
      // If the rectangle is too small, remove it
      if (rect.width! < 5 || rect.height! < 5) {
        canvas.remove(rect);
      } else {
        // Switch to selection tool after drawing
        onToolChange('select');
        canvas.setActiveObject(rect);
      }
      
      canvas.renderAll();
    };
    
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
  }, [canvas, activeTool, color, size, onToolChange]);

  useEffect(() => {
    if (!canvas) return;
    
    // Clean up previous event listeners to prevent duplicates
    canvas.off('mouse:down', handleCanvasMouseDown);
    
    // Add new event listener
    canvas.on('mouse:down', handleCanvasMouseDown);
    
    return () => {
      if (canvas) {
        canvas.off('mouse:down', handleCanvasMouseDown);
      }
    };
  }, [canvas, handleCanvasMouseDown]);

  return null;
};

export default PdfCensorTools;
