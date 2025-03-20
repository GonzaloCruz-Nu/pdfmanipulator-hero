
import React from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type CompressionLevel = 'low' | 'medium' | 'high';

interface CompressionControlsProps {
  file: File | null;
  compressionLevel: CompressionLevel;
  setCompressionLevel: (level: CompressionLevel) => void;
  onCompress: () => void;
  isProcessing: boolean;
  progress: number;
}

const CompressionControls: React.FC<CompressionControlsProps> = ({
  file,
  compressionLevel,
  setCompressionLevel,
  onCompress,
  isProcessing,
  progress
}) => {
  if (!file) return null;

  return (
    <div className="mt-6">
      <h3 className="text-md font-medium mb-2">Nivel de compresión</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Selecciona el nivel de compresión deseado. Mayor compresión puede afectar la calidad.
      </p>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setCompressionLevel('low')}
          className={`px-4 py-2 rounded-md text-sm ${
            compressionLevel === 'low' 
              ? 'bg-primary text-white' 
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          Baja (20%)
        </button>
        <button
          onClick={() => setCompressionLevel('medium')}
          className={`px-4 py-2 rounded-md text-sm ${
            compressionLevel === 'medium' 
              ? 'bg-primary text-white' 
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          Media (50%)
        </button>
        <button
          onClick={() => setCompressionLevel('high')}
          className={`px-4 py-2 rounded-md text-sm ${
            compressionLevel === 'high' 
              ? 'bg-primary text-white' 
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          Alta (75%)
        </button>
      </div>

      <Button
        onClick={onCompress}
        disabled={isProcessing || !file}
        variant="default"
        className="w-full"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Comprimiendo...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Comprimir PDF
          </>
        )}
      </Button>
      
      {isProcessing && (
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center mt-1 text-muted-foreground">{progress}%</p>
        </div>
      )}
    </div>
  );
};

export default CompressionControls;
