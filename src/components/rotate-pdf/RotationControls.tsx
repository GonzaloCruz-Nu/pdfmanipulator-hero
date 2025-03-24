
import React from 'react';
import { RotateCw, RotateCcw, Undo2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RotationControlsProps {
  isLoading: boolean;
  handleRotate: (direction: 'clockwise' | 'counterclockwise') => void;
  handleResetRotation: () => void;
  toggleSelectionMode: () => void;
  showSelectionMode: boolean;
  hasRotation: boolean;
  currentPage: number;
  selectedPages: number[];
  rotationAngles: { [key: number]: number };
  thumbnailsExist: boolean;
}

const RotationControls: React.FC<RotationControlsProps> = ({
  isLoading,
  handleRotate,
  handleResetRotation,
  toggleSelectionMode,
  showSelectionMode,
  hasRotation,
  currentPage,
  selectedPages,
  rotationAngles,
  thumbnailsExist
}) => {
  return (
    <div className="absolute top-12 right-4 flex flex-col gap-2 z-20">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={() => handleRotate('counterclockwise')}
        disabled={isLoading}
        title="Rotar 90° a la izquierda"
      >
        <RotateCcw />
      </Button>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={() => handleRotate('clockwise')}
        disabled={isLoading}
        title="Rotar 90° a la derecha"
      >
        <RotateCw />
      </Button>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={handleResetRotation}
        disabled={isLoading || (selectedPages.length === 0 && !(rotationAngles[currentPage] !== undefined))}
        title="Restablecer rotación"
      >
        <Undo2 />
      </Button>
      <Button
        variant="secondary" 
        size="icon"
        onClick={toggleSelectionMode}
        disabled={isLoading || !thumbnailsExist}
        title={showSelectionMode ? "Ocultar selección de páginas" : "Mostrar selección de páginas"}
        className={showSelectionMode ? "bg-blue-100" : ""}
      >
        <ListChecks />
      </Button>
    </div>
  );
};

export default RotationControls;
