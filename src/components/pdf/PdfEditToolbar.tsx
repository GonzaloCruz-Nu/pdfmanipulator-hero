
import React from 'react';
import { 
  Type, 
  Square, 
  Circle, 
  Pen, 
  Trash2, 
  Move,
  ChevronDown
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type EditToolType = 'select' | 'text' | 'rectangle' | 'circle' | 'pen';

interface ColorOption {
  value: string;
  label: string;
}

const colorOptions: ColorOption[] = [
  { value: '#000000', label: 'Negro' },
  { value: '#FF0000', label: 'Rojo' },
  { value: '#0000FF', label: 'Azul' },
  { value: '#008000', label: 'Verde' },
  { value: '#FFA500', label: 'Naranja' },
  { value: '#800080', label: 'Púrpura' },
];

interface FontOption {
  value: string;
  label: string;
}

const fontOptions: FontOption[] = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Roboto', label: 'Roboto' },
];

interface PdfEditToolbarProps {
  activeTool: EditToolType;
  onToolChange: (tool: EditToolType) => void;
  color: string;
  onColorChange: (color: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  onClearCanvas: () => void;
  onDeleteSelected: () => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  fontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  hasSelection: boolean;
}

const PdfEditToolbar: React.FC<PdfEditToolbarProps> = ({
  activeTool,
  onToolChange,
  color,
  onColorChange,
  size,
  onSizeChange,
  onClearCanvas,
  onDeleteSelected,
  fontSize = 16,
  onFontSizeChange,
  fontFamily = 'Arial',
  onFontFamilyChange,
  hasSelection
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border-b">
      <ToggleGroup type="single" value={activeTool} onValueChange={(value) => value && onToolChange(value as EditToolType)}>
        <ToggleGroupItem value="select" aria-label="Seleccionar">
          <Move size={18} />
        </ToggleGroupItem>
        <ToggleGroupItem value="text" aria-label="Añadir texto">
          <Type size={18} />
        </ToggleGroupItem>
        <ToggleGroupItem value="rectangle" aria-label="Dibujar rectángulo">
          <Square size={18} />
        </ToggleGroupItem>
        <ToggleGroupItem value="circle" aria-label="Dibujar círculo">
          <Circle size={18} />
        </ToggleGroupItem>
        <ToggleGroupItem value="pen" aria-label="Dibujo libre">
          <Pen size={18} />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-6 w-px bg-gray-300 mx-1"></div>

      {/* Color selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="h-9 px-2 border-2"
            style={{ borderColor: color }}
          >
            <div 
              className="w-4 h-4 mr-1 rounded-full" 
              style={{ backgroundColor: color }}
            ></div>
            <ChevronDown size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="space-y-2">
            <Label>Color</Label>
            <RadioGroup 
              value={color} 
              onValueChange={onColorChange}
              className="grid grid-cols-3 gap-2"
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
            <span className="mr-1">Tamaño</span>
            <ChevronDown size={14} />
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

      {/* Font options - only show when text tool is active */}
      {activeTool === 'text' && onFontSizeChange && onFontFamilyChange && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 px-2">
                <span className="mr-1">Fuente</span>
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="space-y-2">
                <Label>Fuente</Label>
                <RadioGroup 
                  value={fontFamily} 
                  onValueChange={onFontFamilyChange}
                  className="space-y-1"
                >
                  {fontOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        id={`font-${option.value}`} 
                        value={option.value} 
                      />
                      <Label htmlFor={`font-${option.value}`} style={{ fontFamily: option.value }}>
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 px-2">
                <span className="mr-1">Tamaño texto</span>
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Tamaño</Label>
                  <span className="text-sm">{fontSize}px</span>
                </div>
                <Slider
                  value={[fontSize]}
                  min={8}
                  max={72}
                  step={1}
                  onValueChange={(value) => onFontSizeChange(value[0])}
                />
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

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
        <span>Eliminar seleccionado</span>
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearCanvas}
        className="h-9"
      >
        <Trash2 size={16} className="mr-1" />
        <span>Limpiar todo</span>
      </Button>
    </div>
  );
};

export default PdfEditToolbar;
