
import React from 'react';
import { 
  Square, 
  Trash2,
  GridIcon,
  EyeOff,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export type CensorToolType = 'rectangle' | 'pixelated';
export type CensorStyleType = 'black' | 'pixelated';

interface PdfCensorToolbarProps {
  activeTool: CensorToolType;
  onToolChange: (tool: CensorToolType) => void;
  censorStyle: CensorStyleType;
  onStyleChange: (style: CensorStyleType) => void;
  onClearAll: () => void;
  onApplyCensors: () => void;
  isProcessing: boolean;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const PdfCensorToolbar: React.FC<PdfCensorToolbarProps> = ({
  activeTool,
  onToolChange,
  censorStyle,
  onStyleChange,
  onClearAll,
  onApplyCensors,
  isProcessing,
  zoomLevel,
  onZoomIn,
  onZoomOut
}) => {
  console.log("Toolbar rendering with activeTool:", activeTool, "style:", censorStyle);
  
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border-b">
      <ToggleGroup 
        type="single" 
        value={activeTool} 
        onValueChange={(value) => {
          if (value) {
            console.log(`Toolbar: Changing tool to ${value}`);
            onToolChange(value as CensorToolType);
          }
        }}
        className="flex gap-1"
      >
        <ToggleGroupItem value="rectangle" aria-label="Rectángulo negro" className="h-9 px-3">
          <Square size={18} className="mr-1" />
          <span className="text-xs">Rectángulo</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="pixelated" aria-label="Rectángulo pixelado" className="h-9 px-3">
          <GridIcon size={18} className="mr-1" />
          <span className="text-xs">Pixelado</span>
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-6 w-px bg-gray-300 mx-1"></div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">Estilo:</span>
        <RadioGroup 
          value={censorStyle} 
          onValueChange={(value) => onStyleChange(value as CensorStyleType)}
          className="flex gap-3"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem id="black" value="black" />
            <Label htmlFor="black" className="text-xs">Negro</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem id="pixelated" value="pixelated" />
            <Label htmlFor="pixelated" className="text-xs">Pixelado</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-1"></div>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onZoomOut}
          className="h-9 w-9 p-0 flex items-center justify-center"
        >
          <ZoomOut size={18} />
        </Button>
        <span className="text-xs font-medium">{Math.round(zoomLevel * 100)}%</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onZoomIn}
          className="h-9 w-9 p-0 flex items-center justify-center"
        >
          <ZoomIn size={18} />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300 mx-1"></div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearAll}
        className="h-9 px-3"
      >
        <Trash2 size={16} className="mr-1" />
        <span className="text-xs">Limpiar todo</span>
      </Button>

      <Button 
        variant="default" 
        size="sm" 
        onClick={onApplyCensors}
        className="h-9 px-3 ml-auto bg-orange-500 hover:bg-orange-600"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
            <span className="text-xs">Procesando...</span>
          </>
        ) : (
          <>
            <EyeOff size={16} className="mr-1" />
            <span className="text-xs">Aplicar censuras</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default PdfCensorToolbar;
