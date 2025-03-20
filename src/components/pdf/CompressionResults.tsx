
import React from 'react';
import { Check, Download, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

interface CompressionResultsProps {
  compressionInfo: CompressionInfo | null;
  compressionError: string | null;
  compressedFile: File | null;
  onDownload: () => void;
  file: File | null;
}

const CompressionResults: React.FC<CompressionResultsProps> = ({
  compressionInfo,
  compressionError,
  compressedFile,
  onDownload,
  file
}) => {
  // Función para mostrar tamaño con formato
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="mt-6">
      {compressionInfo && compressedFile && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-green-800 font-medium mb-2">Compresión completada</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-start">
                <span className="text-green-800">Tamaño original:</span>
                <span className="ml-auto text-green-800 font-medium">{formatFileSize(compressionInfo.originalSize)}</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-800">Tamaño comprimido:</span>
                <span className="ml-auto text-green-800 font-medium">{formatFileSize(compressionInfo.compressedSize)}</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-800">Reducción:</span>
                <span className="ml-auto text-green-800 font-medium">{compressionInfo.savedPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex items-start text-xs text-green-700 mt-2">
                <span>Ahorro de espacio:</span>
                <span className="ml-auto">{formatFileSize(compressionInfo.originalSize - compressionInfo.compressedSize)}</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={onDownload}
            variant="outline"
            className="w-full py-5 border-naranja text-naranja hover:bg-naranja/10 flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Descargar PDF comprimido
          </Button>
        </div>
      )}

      {compressionError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 mt-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <AlertDescription>
            {compressionError}
          </AlertDescription>
        </Alert>
      )}

      {!file && (
        <div className="flex items-center p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
          <Info className="h-5 w-5 mr-2 flex-shrink-0" />
          <p className="text-sm">
            Selecciona un archivo PDF para comenzar a comprimirlo.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompressionResults;
