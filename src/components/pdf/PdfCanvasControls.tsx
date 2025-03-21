
import React from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfCanvasControlsProps {
  isPanning: boolean;
  togglePanning: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

const PdfCanvasControls: React.FC<PdfCanvasControlsProps> = ({
  isPanning,
  togglePanning,
  handleZoomIn,
  handleZoomOut
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2 z-10">
      <Button 
        variant={isPanning ? "default" : "secondary"} 
        size="sm" 
        onClick={togglePanning} 
        className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
        title={isPanning ? "Modo movimiento activado" : "Mover PDF"}
      >
        <Move className="h-4 w-4" />
      </Button>
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleZoomIn} 
        className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
        title="Acercar"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleZoomOut} 
        className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
        title="Alejar"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PdfCanvasControls;
