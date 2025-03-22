
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
  currentFile?: number;
  totalFiles?: number;
}

const CompressionControls: React.FC<CompressionControlsProps> = ({
  file,
  compressionLevel,
  setCompressionLevel,
  onCompress,
  isProcessing,
  progress,
  currentFile = 1,
  totalFiles = 1
}) => {
  if (!file) return null;

  return (
    <div className="mt-6">
      <h3 className="text-md font-medium mb-2">Selecciona el nivel de compresión deseado</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Mayor compresión puede afectar la calidad visual del PDF.
      </p>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setCompressionLevel('low')}
          className={`flex-1 px-4 py-3 rounded-md text-sm transition-colors ${
            compressionLevel === 'low' 
              ? 'bg-naranja text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="block font-medium">Baja</span>
          <span className="block text-xs mt-1">Calidad máxima, compresión mínima</span>
        </button>
        <button
          onClick={() => setCompressionLevel('medium')}
          className={`flex-1 px-4 py-3 rounded-md text-sm transition-colors ${
            compressionLevel === 'medium' 
              ? 'bg-naranja text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="block font-medium">Media</span>
          <span className="block text-xs mt-1">Alta calidad, compresión moderada</span>
        </button>
        <button
          onClick={() => setCompressionLevel('high')}
          className={`flex-1 px-4 py-3 rounded-md text-sm transition-colors ${
            compressionLevel === 'high' 
              ? 'bg-naranja text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="block font-medium">Alta</span>
          <span className="block text-xs mt-1">Menor calidad, máxima compresión</span>
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-6 text-sm text-amber-800">
        <p>Hemos mejorado la calidad de imagen en todos los niveles. Para <strong>documentos con texto</strong>, recomendamos usar nivel <strong>BAJO</strong> o <strong>MEDIO</strong> para asegurar legibilidad. El nivel alto es ideal para fotos o imágenes donde el texto no es crucial.</p>
      </div>

      <Button
        onClick={onCompress}
        disabled={isProcessing || !file}
        variant="default"
        className="w-full bg-naranja hover:bg-naranja/90 text-white py-6 text-base flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {totalFiles > 1 ? `Procesando (${currentFile}/${totalFiles})...` : 'Procesando...'}
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 mr-2" />
            Procesar PDF{totalFiles > 1 ? 's' : ''}
          </>
        )}
      </Button>
      
      {isProcessing && (
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center mt-1 text-muted-foreground">
            {totalFiles > 1 ? `Archivo ${currentFile}/${totalFiles} - ` : ''}{progress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default CompressionControls;
