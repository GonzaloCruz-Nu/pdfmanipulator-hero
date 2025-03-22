
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
  multipleFiles?: boolean;
}

const CompressionResults: React.FC<CompressionResultsProps> = ({
  compressionInfo,
  compressionError,
  compressedFile,
  onDownload,
  file,
  multipleFiles = false
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
          <div className={`${compressionInfo.savedPercentage > 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-md p-4`}>
            <h3 className={`${compressionInfo.savedPercentage > 0 ? 'text-green-800' : 'text-blue-800'} font-medium mb-2`}>
              {compressionInfo.savedPercentage > 0 ? 'Compresión completada' : 'Procesamiento completado'}
              {multipleFiles && ' para el archivo actual'}
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-start">
                <span className={compressionInfo.savedPercentage > 0 ? 'text-green-800' : 'text-blue-800'}>Tamaño original:</span>
                <span className={`ml-auto ${compressionInfo.savedPercentage > 0 ? 'text-green-800' : 'text-blue-800'} font-medium`}>
                  {formatFileSize(compressionInfo.originalSize)}
                </span>
              </div>
              <div className="flex items-start">
                <span className={compressionInfo.savedPercentage > 0 ? 'text-green-800' : 'text-blue-800'}>Tamaño procesado:</span>
                <span className={`ml-auto ${compressionInfo.savedPercentage > 0 ? 'text-green-800' : 'text-blue-800'} font-medium`}>
                  {formatFileSize(compressionInfo.compressedSize)}
                </span>
              </div>
              <div className="flex items-start">
                <span className={compressionInfo.savedPercentage > 0 ? 'text-green-800' : 'text-blue-800'}>
                  {compressionInfo.savedPercentage > 0 ? 'Reducción:' : 'Cambio:'}
                </span>
                <span className={`ml-auto ${compressionInfo.savedPercentage > 0 ? 'text-green-800' : 'text-blue-800'} font-medium`}>
                  {compressionInfo.savedPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-start text-xs mt-2">
                <span className={compressionInfo.savedPercentage > 0 ? 'text-green-700' : 'text-blue-700'}>
                  {compressionInfo.savedPercentage > 0 ? 'Ahorro de espacio:' : 'Cambio de tamaño:'}
                </span>
                <span className="ml-auto">
                  {formatFileSize(Math.abs(compressionInfo.originalSize - compressionInfo.compressedSize))}
                  {compressionInfo.originalSize < compressionInfo.compressedSize && ' (aumentó)'}
                </span>
              </div>
            </div>
            
            {compressionInfo.savedPercentage <= 0 && (
              <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                <strong>Nota:</strong> Con nivel de compresión "Baja", se prioriza la calidad máxima sobre la reducción de tamaño.
              </div>
            )}
          </div>
          
          <Button
            onClick={onDownload}
            variant="outline"
            className="w-full py-5 border-naranja text-naranja hover:bg-naranja/10 flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Descargar PDF procesado
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
