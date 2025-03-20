
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
        <div>
          <div className="flex items-center p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 mb-4">
            <Check className="h-5 w-5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Compresión completada</p>
              <p>Tamaño original: {formatFileSize(compressionInfo.originalSize)}</p>
              <p>Tamaño comprimido: {formatFileSize(compressionInfo.compressedSize)}</p>
              <p>Reducción: <span className="font-bold">{compressionInfo.savedPercentage.toFixed(1)}%</span></p>
              <p className="text-xs mt-1 text-green-600">Ahorro de espacio: {formatFileSize(compressionInfo.originalSize - compressionInfo.compressedSize)}</p>
            </div>
          </div>
          
          <Button
            onClick={onDownload}
            variant="secondary"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF comprimido
          </Button>
        </div>
      )}

      {compressionError && (
        <Alert variant="destructive" className="bg-red-50">
          <AlertCircle className="h-5 w-5 mr-2" />
          <AlertDescription>
            {compressionError}
          </AlertDescription>
        </Alert>
      )}

      {!file && (
        <div className="flex items-center p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
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
