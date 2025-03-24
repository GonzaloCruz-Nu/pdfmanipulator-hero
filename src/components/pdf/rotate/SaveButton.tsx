
import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveButtonProps {
  onSave: () => void;
  disabled: boolean;
  processing: boolean;
  rotationCount: number;
}

const SaveButton: React.FC<SaveButtonProps> = ({
  onSave,
  disabled,
  processing,
  rotationCount,
}) => {
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
        onClick={onSave}
        disabled={disabled || processing || rotationCount === 0}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Guardar cambios
          </>
        )}
      </Button>
    </div>
  );
};

export default SaveButton;
