
import { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface UseFabricCanvasProps {
  onSelectionChange?: (hasSelection: boolean) => void;
}

export const useFabricCanvas = ({ onSelectionChange }: UseFabricCanvasProps = {}) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (!canvas || !onSelectionChange) return;

    const handleSelectionChange = () => {
      onSelectionChange(!!canvas.getActiveObject());
    };

    canvas.on('selection:created', handleSelectionChange);
    canvas.on('selection:updated', handleSelectionChange);
    canvas.on('selection:cleared', handleSelectionChange);

    return () => {
      canvas.off('selection:created', handleSelectionChange);
      canvas.off('selection:updated', handleSelectionChange);
      canvas.off('selection:cleared', handleSelectionChange);
    };
  }, [canvas, onSelectionChange]);

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

  return {
    canvas,
    canvasRef,
    containerRef,
  };
};
