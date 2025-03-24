
import React from 'react';
import { RotateCw, RotateCcw, Undo2, ListChecks, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RotationControlsProps {
  onRotate: (direction: 'clockwise' | 'counterclockwise') => void;
  onResetRotation: () => void;
  toggleSelectionMode: () => void;
  showSelectionMode: boolean;
  isLoading: boolean;
  selectedPages: number[];
  currentPage: number;
  rotationAngles: { [key: number]: number };
  hasThumbnails: boolean;
  generatingThumbnails: boolean;
}

const RotationControls: React.FC<RotationControlsProps> = ({
  onRotate,
  onResetRotation,
  toggleSelectionMode,
  showSelectionMode,
  isLoading,
  selectedPages,
  currentPage,
  rotationAngles,
  hasThumbnails,
  generatingThumbnails,
}) => {
  return (
    <div className="absolute top-12 right-4 flex flex-col gap-2 z-20">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={() => onRotate('counterclockwise')}
        disabled={isLoading}
        title="Rotar 90° a la izquierda"
      >
        <RotateCcw />
      </Button>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={() => onRotate('clockwise')}
        disabled={isLoading}
        title="Rotar 90° a la derecha"
      >
        <RotateCw />
      </Button>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={onResetRotation}
        disabled={isLoading || (selectedPages.length === 0 && !(rotationAngles[currentPage] !== undefined))}
        title="Restablecer rotación"
      >
        <Undo2 />
      </Button>
      <Button
        variant="secondary" 
        size="icon"
        onClick={toggleSelectionMode}
        disabled={isLoading || !hasThumbnails || generatingThumbnails}
        title={showSelectionMode ? "Ocultar selección de páginas" : "Mostrar selección de páginas"}
        className={showSelectionMode ? "bg-blue-100" : ""}
      >
        {generatingThumbnails ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ListChecks />
        )}
      </Button>
    </div>
  );
};

export default RotationControls;
