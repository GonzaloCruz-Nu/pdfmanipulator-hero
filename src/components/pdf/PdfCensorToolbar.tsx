
import React from 'react';
import { 
  EyeOff, 
  Eraser, 
  Square, 
  Trash2, 
  Save,
  Move
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type CensorToolType = 'select' | 'rectangle' | 'eraser';

interface ColorOption {
  value: string;
  label: string;
}

const colorOptions: ColorOption[] = [
  { value: '#000000', label: 'Negro' },
  { value: '#FF0000', label: 'Rojo' },
  { value: '#0000FF', label: 'Azul' },
  { value: '#808080', label: 'Gris' },
];

interface PdfCensorToolbarProps {
  activeTool: CensorToolType;
  onToolChange: (tool: CensorToolType) => void;
  censorColor: string;
  onColorChange: (color: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
  onApplyCensors: () => void;
  hasSelection: boolean;
  isProcessing: boolean;
}

const PdfCensorToolbar: React.FC<PdfCensorToolbarProps> = ({
  activeTool,
  onToolChange,
  censorColor,
  onColorChange,
  size,
  onSizeChange,
  onClearAll,
  onDeleteSelected,
  onApplyCensors,
  hasSelection,
  isProcessing
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border-b">
      <ToggleGroup 
        type="single" 
        value={activeTool} 
        onValueChange={(value) => value && onToolChange(value as CensorToolType)}
      >
        <ToggleGroupItem value="select" aria-label="Seleccionar">
          <Move size={18} />
        </ToggleGroupItem>
        <ToggleGroupItem value="rectangle" aria-label="Censurar área">
          <Square size={18} />
        </ToggleGroupItem>
        <ToggleGroupItem value="eraser" aria-label="Borrador">
          <Eraser size={18} />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-6 w-px bg-gray-300 mx-1"></div>

      {/* Color selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="h-9 px-2 border-2"
            style={{ borderColor: censorColor }}
          >
            <div 
              className="w-4 h-4 mr-1 rounded-full" 
              style={{ backgroundColor: censorColor }}
            ></div>
            <span className="text-xs">Color</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="space-y-2">
            <Label>Color de censura</Label>
            <RadioGroup 
              value={censorColor} 
              onValueChange={onColorChange}
              className="grid grid-cols-2 gap-2"
            >
              {colorOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    id={option.value} 
                    value={option.value}
                    className="peer sr-only" 
                  />
                  <Label
                    htmlFor={option.value}
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-transparent p-2 hover:bg-muted hover:text-muted-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: option.value }}></div>
                    <span className="text-xs">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </PopoverContent>
      </Popover>

      {/* Size slider */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 px-2">
            <span className="text-xs">Grosor</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Grosor</Label>
              <span className="text-sm">{size}px</span>
            </div>
            <Slider
              value={[size]}
              min={1}
              max={20}
              step={1}
              onValueChange={(value) => onSizeChange(value[0])}
            />
          </div>
        </PopoverContent>
      </Popover>

      <div className="h-6 w-px bg-gray-300 mx-1"></div>

      {/* Delete selected and clear buttons */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className="h-9"
      >
        <Trash2 size={16} className="mr-1" />
        <span className="text-xs">Eliminar seleccionado</span>
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearAll}
        className="h-9"
      >
        <Trash2 size={16} className="mr-1" />
        <span className="text-xs">Limpiar todo</span>
      </Button>

      {/* Apply censors button */}
      <Button 
        variant="default" 
        size="sm" 
        onClick={onApplyCensors}
        className="h-9 ml-auto"
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
