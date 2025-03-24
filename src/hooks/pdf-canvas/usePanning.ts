
import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface UsePanningProps {
  canvas: fabric.Canvas | null;
  isPanning: boolean;
}

export const usePanning = ({ canvas, isPanning }: UsePanningProps) => {
  const isDraggingRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);
  const activePanningRef = useRef(isPanning);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when props change
  useEffect(() => {
    activePanningRef.current = isPanning;
  }, [isPanning]);

  // Setup panning functionality
  useEffect(() => {
    if (!canvas) return;
    
    const handleMouseDown = (opt: fabric.IEvent) => {
      if (!activePanningRef.current) return;
      
      isDraggingRef.current = true;
      
      const evt = opt.e as MouseEvent;
      lastPosXRef.current = evt.clientX;
      lastPosYRef.current = evt.clientY;
      
      // Disable object selection while panning
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.forEachObject(function(obj) {
        obj.selectable = false;
      });
      canvas.renderAll();
    };

    const handleMouseMove = (opt: fabric.IEvent) => {
      if (!isDraggingRef.current || !activePanningRef.current || !canvas) return;
      
      if (!canvas.backgroundImage) return;
      
      const evt = opt.e as MouseEvent;
      const deltaX = evt.clientX - lastPosXRef.current;
      const deltaY = evt.clientY - lastPosYRef.current;
      
      // Performance optimization: batch updates and reduce renders
      canvas.discardActiveObject();
      
      // Move the background image
      if (canvas.backgroundImage) {
        canvas.backgroundImage.set({
          left: (canvas.backgroundImage.left || 0) + deltaX,
          top: (canvas.backgroundImage.top || 0) + deltaY
        });
      }
      
      // Also move all objects on the canvas - but batch the update
      canvas.forEachObject(function(obj) {
        obj.set({
          left: obj.left! + deltaX,
          top: obj.top! + deltaY,
          hasControls: false
        });
      });
      
      // Update the cursor position
      lastPosXRef.current = evt.clientX;
      lastPosYRef.current = evt.clientY;
      
      // Throttle renders for better performance
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      
      renderTimeoutRef.current = setTimeout(() => {
        canvas.requestRenderAll();
        renderTimeoutRef.current = null;
      }, 10);
    };

    const handleMouseUp = () => {
      if (!canvas) return;
      
      isDraggingRef.current = false;
      
      // Re-enable object selection after panning
      if (activePanningRef.current) {
        canvas.selection = true;
        canvas.forEachObject(function(obj) {
          obj.selectable = true;
          obj.hasControls = true;
          obj.setCoords();
        });
        
        // Ensure we render with the correct object positions
        canvas.requestRenderAll();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    
    return () => {
      if (canvas) {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [canvas]);

  return {
    isDragging: isDraggingRef.current
  };
};
