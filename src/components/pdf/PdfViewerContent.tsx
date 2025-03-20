
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import PdfEditToolbar, { EditToolType } from './PdfEditToolbar';
import PdfCanvas from './PdfCanvas';
import PdfCanvasTools from './PdfCanvasTools';
import PdfNavigation from './PdfNavigation';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';

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
  const [hasSelection, setHasSelection] = useState(false);
  const { canvas, canvasRef, containerRef } = useFabricCanvas({
    onSelectionChange: setHasSelection
  });
  
  const [activeTool, setActiveTool] = useState<EditToolType>('select');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');

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
        
        <PdfCanvasTools
          canvas={canvas}
          activeTool={activeTool}
          color={color}
          size={size}
          fontSize={fontSize}
          fontFamily={fontFamily}
          onToolChange={setActiveTool}
        />
        
        <PdfNavigation
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={onNextPage}
          onPrevPage={onPrevPage}
        />
      </div>
    </div>
  );
};

export default PdfViewerContent;
