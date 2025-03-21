
import React, { useEffect, useState, useRef } from 'react';
import { fabric } from 'fabric';
import { CensorToolType, CensorStyleType } from './PdfCensorToolbar';
import { toast } from 'sonner';

interface PdfCensorToolsProps {
  canvas: fabric.Canvas | null;
  activeTool: CensorToolType;
  censorStyle: CensorStyleType;
  zoomLevel: number;
}

const PdfCensorTools: React.FC<PdfCensorToolsProps> = ({
  canvas,
  activeTool,
  censorStyle,
  zoomLevel
}) => {
  const isDrawingRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<fabric.Rect | null>(null);
  const prevZoomRef = useRef(zoomLevel);
  
  // Apply zoom to canvas objects
  useEffect(() => {
    if (!canvas || zoomLevel === prevZoomRef.current) return;
    
    try {
      console.log(`Applying zoom level: ${zoomLevel}`);
      
      // Get the canvas center
      const center = canvas.getCenter();
      
      // Calculate zoom ratio
      const zoomRatio = zoomLevel / prevZoomRef.current;
      
      // Zoom to point with animation
      canvas.zoomToPoint(
        { x: center.left, y: center.top }, 
        canvas.getZoom() * zoomRatio
      );
      
      // Force render
      canvas.renderAll();
      
      // Update previous zoom reference
      prevZoomRef.current = zoomLevel;
      
    } catch (error) {
      console.error("Error applying zoom:", error);
    }
  }, [canvas, zoomLevel]);
  
  // Setup rectangle drawing functionality
  useEffect(() => {
    if (!canvas) return;
    
    console.log("Setting up canvas drawing with tool:", activeTool);
    
    // Remove any existing event listeners to prevent duplicates
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    
    // Make objects selectable or not based on active tool
    if (activeTool === 'rectangle' || activeTool === 'pixelated') {
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      
      const handleMouseDown = (e: fabric.IEvent) => {
        const pointer = canvas.getPointer(e.e);
        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };
        
        console.log("Mouse down at:", pointer.x, pointer.y);
        
        // Determine fill and stroke based on censor style
        const fillColor = censorStyle === 'black' ? '#000000' : '#555555';
        const strokeColor = censorStyle === 'black' ? 'transparent' : '#333333';
        const strokeWidth = censorStyle === 'black' ? 0 : 1;
        const strokeDashArray = censorStyle === 'black' ? [] : [5, 5];
        
        // Create and add rectangle
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
          selectable: false,
          evented: false,
        });
        
        setCurrentRect(rect);
        canvas.add(rect);
        canvas.renderAll();
      };
      
      const handleMouseMove = (e: fabric.IEvent) => {
        if (!isDrawingRef.current || !currentRect) return;
        
        const pointer = canvas.getPointer(e.e);
        const startPoint = startPointRef.current;
        
        // Calculate width and height (can be negative if drawing backwards)
        let width = pointer.x - startPoint.x;
        let height = pointer.y - startPoint.y;
        
        // Set left/top to the smaller of current and start points
        if (width < 0) {
          currentRect.set({ left: pointer.x });
          width = Math.abs(width);
        }
        
        if (height < 0) {
          currentRect.set({ top: pointer.y });
          height = Math.abs(height);
        }
        
        currentRect.set({
          width: width,
          height: height
        });
        
        canvas.renderAll();
      };
      
      const handleMouseUp = () => {
        isDrawingRef.current = false;
        
        if (currentRect) {
          // If rectangle is too small, remove it
          if (currentRect.width! < 5 || currentRect.height! < 5) {
            canvas.remove(currentRect);
            console.log("Rectangle too small, removed");
          } else {
            // Make rectangle selectable after drawing is complete
            currentRect.set({
              selectable: true,
              evented: true,
              hasControls: true,
              hasBorders: true
            });
            
            console.log("Rectangle created with dimensions:", 
              currentRect.width, "x", currentRect.height);
          }
          
          setCurrentRect(null);
        }
        
        // Restore canvas selection state
        canvas.selection = true;
        canvas.renderAll();
      };
      
      // Attach event handlers
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
    } else {
      // For non-drawing tools, enable selection
      canvas.selection = true;
      canvas.defaultCursor = 'default';
    }
    
    return () => {
      // Clean up event listeners when effect is unmounted
      if (canvas) {
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');
      }
    };
  }, [canvas, activeTool, censorStyle, currentRect]);
  
  return null;
};

export default PdfCensorTools;
