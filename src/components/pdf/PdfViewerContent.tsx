import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import PdfEditToolbar, { EditToolType } from './PdfEditToolbar';
import PdfCanvas from './PdfCanvas';
import PdfCanvasTools from './PdfCanvasTools';
import PdfNavigation from './PdfNavigation';
import { fabric } from 'fabric';

interface PdfViewerContentProps {
  pageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  fileName: string;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onSaveChanges: (dataUrl: string) => void;
}

const PdfViewerContent: React.FC<PdfViewerContentProps> = ({
  pageUrl,
  isLoading,
  error,
  fileName,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  onSaveChanges
}) => {
  const [hasSelection, setHasSelection] = useState(false);
  const [activeTool, setActiveTool] = useState<EditToolType>('select');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  useEffect(() => {
    if (pageUrl && canvasRef.current && canvasInitialized) {
      console.log("Página cambiada, reiniciando modo de edición");
      setActiveTool('select');
      setIsPanning(false);
    }
  }, [pageUrl, canvasInitialized]);

  const handleToolChange = (tool: EditToolType) => {
    if (isPanning) {
      setIsPanning(false);
    }
    setActiveTool(tool);
  };

  const handleClearCanvas = () => {
    if (canvasRef.current) {
      const bgImage = canvasRef.current.backgroundImage;
      canvasRef.current.clear();
      
      if (bgImage) {
        canvasRef.current.setBackgroundImage(bgImage, canvasRef.current.renderAll.bind(canvasRef.current));
      }
      
      canvasRef.current.renderAll();
      toast.success('Todos los elementos han sido eliminados');
    }
  };

  const handleDeleteSelected = () => {
    if (canvasRef.current) {
      const activeObject = canvasRef.current.getActiveObject();
      if (activeObject) {
        canvasRef.current.remove(activeObject);
        toast.success('Elemento seleccionado eliminado');
      }
    }
  };

  const handleSaveChanges = () => {
    if (!canvasRef.current) {
      toast.error('No se puede guardar la página. Inténtalo de nuevo.');
      return;
    }

    try {
      const dataUrl = canvasRef.current.toDataURL({
        format: 'jpeg',
        quality: 0.95
      });
      
      onSaveChanges(dataUrl);
      toast.success(`Cambios guardados en la página ${currentPage}`);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      toast.error('Error al guardar los cambios en el PDF');
    }
  };

  const handleCanvasInitialized = (canvas: fabric.Canvas) => {
    console.log("Canvas inicializado en PdfViewerContent");
    setCanvasInitialized(true);
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
        onSaveChanges={handleSaveChanges}
      />
      
      <div className="flex-1 relative overflow-hidden">
        <PdfCanvas 
          pageUrl={pageUrl}
          onSelectionChange={setHasSelection}
          fabricRef={canvasRef}
          onCanvasInitialized={handleCanvasInitialized}
        />
        
        <PdfCanvasTools
          canvas={canvasRef.current}
          activeTool={activeTool}
          color={color}
          size={size}
          fontSize={fontSize}
          fontFamily={fontFamily}
          onToolChange={setActiveTool}
          isPanning={isPanning}
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
