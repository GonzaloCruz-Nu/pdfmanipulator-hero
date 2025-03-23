
import React, { useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import { EditToolType } from './PdfEditToolbar';

interface PdfCanvasToolsProps {
  canvas: fabric.Canvas | null;
  activeTool: EditToolType;
  color: string;
  size: number;
  fontSize: number;
  fontFamily: string;
  onToolChange: (tool: EditToolType) => void;
  isPanning?: boolean;
}

const PdfCanvasTools: React.FC<PdfCanvasToolsProps> = ({
  canvas,
  activeTool,
  color,
  size,
  fontSize,
  fontFamily,
  onToolChange,
  isPanning = false,
}) => {
  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;

    // If panning is active, disable all other tools
    if (isPanning) {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'grab';
      return;
    }

    console.log("Updating tool to:", activeTool, "with color:", color, "and size:", size);

    canvas.isDrawingMode = false;

    switch (activeTool) {
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        // Ensure all objects are selectable
        canvas.forEachObject(obj => {
          obj.selectable = true;
          obj.setCoords();
        });
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
  }, [activeTool, color, size, canvas, isPanning]);

  // Handle canvas mouse events for drawing shapes
  const handleCanvasMouseDown = useCallback((e: fabric.IEvent) => {
    if (!canvas || activeTool === 'select' || activeTool === 'pen' || isPanning) return;
    
    console.log("Mouse down event with tool:", activeTool);
    
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
      onToolChange('select');
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
    
    const handleMouseMove = (moveEvent: fabric.IEvent) => {
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
    };
    
    const handleMouseUp = () => {
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      onToolChange('select');
      
      canvas.setActiveObject(tempShape);
      canvas.renderAll();
    };
    
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
  }, [canvas, activeTool, color, size, fontSize, fontFamily, onToolChange, isPanning]);

  useEffect(() => {
    if (!canvas) return;
    
    canvas.on('mouse:down', handleCanvasMouseDown);
    
    return () => {
      canvas.off('mouse:down', handleCanvasMouseDown);
    };
  }, [canvas, handleCanvasMouseDown]);

  return null;
};

export default PdfCanvasTools;
