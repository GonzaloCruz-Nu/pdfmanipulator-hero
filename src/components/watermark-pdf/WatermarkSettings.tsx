
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WatermarkSettingsProps {
  watermarkText: string;
  setWatermarkText: (text: string) => void;
  watermarkColor: string;
  setWatermarkColor: (color: string) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  angle: number;
  setAngle: (angle: number) => void;
}

const WatermarkSettings = ({
  watermarkText,
  setWatermarkText,
  watermarkColor,
  setWatermarkColor,
  opacity,
  setOpacity,
  fontSize,
  setFontSize,
  angle,
  setAngle
}: WatermarkSettingsProps) => {
  const colorOptions = [
    { value: '#888888', label: 'Gris' },
    { value: '#000000', label: 'Negro' },
    { value: '#FF0000', label: 'Rojo' },
    { value: '#0000FF', label: 'Azul' },
    { value: '#008000', label: 'Verde' },
  ];
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="watermarkText">2. Texto de marca de agua</Label>
        <Input
          id="watermarkText"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          placeholder="Ej. CONFIDENCIAL"
          className="mt-1"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="watermarkColor">Color</Label>
          <div className="flex gap-2 mt-1">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setWatermarkColor(option.value)}
                className={`h-8 w-8 rounded-full border-2 ${
                  watermarkColor === option.value ? 'border-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: option.value }}
                title={option.label}
              />
            ))}
            <input
              type="color"
              value={watermarkColor}
              onChange={(e) => setWatermarkColor(e.target.value)}
              className="h-8 w-8 rounded-full border-2 cursor-pointer"
              title="Color personalizado"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="opacity">Opacidad: {opacity}%</Label>
          <Slider
            id="opacity"
            value={[opacity]}
            min={10}
            max={100}
            step={1}
            onValueChange={(value) => setOpacity(value[0])}
            className="mt-2"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fontSize">Tamaño de fuente: {fontSize}px</Label>
          <Slider
            id="fontSize"
            value={[fontSize]}
            min={12}
            max={72}
            step={1}
            onValueChange={(value) => setFontSize(value[0])}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label htmlFor="angle">Ángulo: {angle}°</Label>
          <Slider
            id="angle"
            value={[angle]}
            min={0}
            max={360}
            step={5}
            onValueChange={(value) => setAngle(value[0])}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default WatermarkSettings;
