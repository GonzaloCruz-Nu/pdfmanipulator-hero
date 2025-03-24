
import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveControlsProps {
  rotationAngles: { [key: number]: number };
  processingRotation: boolean;
  isLoading: boolean;
  handleSaveRotations: () => void;
}

const SaveControls: React.FC<SaveControlsProps> = ({
  rotationAngles,
  processingRotation,
  isLoading,
  handleSaveRotations
}) => {
  const rotationCount = Object.keys(rotationAngles).length;
  
  return (
    <div className="flex justify-between items-center mt-4">
      <div>
        {rotationCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {rotationCount} {rotationCount === 1 ? 'página rotada' : 'páginas rotadas'}
          </p>
        )}
      </div>
      <Button 
        onClick={handleSaveRotations}
        disabled={isLoading || processingRotation || rotationCount === 0}
      >
        <Save className="mr-2 h-4 w-4" />
        Guardar cambios
      </Button>
    </div>
  );
};

export default SaveControls;
