
import React from 'react';
import { Check, Download, AlertCircle, Info, FileText, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatFileSize } from '@/utils/pdf/compression-utils';
import { Link } from 'react-router-dom';

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
  totalStats?: {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavedPercentage: number;
    fileCount: number;
  } | null;
}

const CompressionResults: React.FC<CompressionResultsProps> = ({
  compressionInfo,
  compressionError,
  compressedFile,
  onDownload,
  file,
  multipleFiles = false,
  totalStats = null
}) => {
  return (
    <div className="mt-6">
      {totalStats && totalStats.fileCount > 1 && (
        <div className="mb-4">
          <div className={`${
            totalStats.totalSavedPercentage > 0 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-amber-50 border-amber-200'
          } border rounded-md p-4`}>
            <h3 className={`${
              totalStats.totalSavedPercentage > 0 
                ? 'text-blue-800' 
                : 'text-amber-800'
            } font-medium mb-2 flex items-center`}>
              <FileArchive className="h-4 w-4 mr-2" />
              Estadísticas de todos los archivos ({totalStats.fileCount} PDFs)
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-start">
                <span className="text-blue-800">Tamaño original total:</span>
                <span className="ml-auto text-blue-800 font-medium">
                  {formatFileSize(totalStats.totalOriginalSize)}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-800">Tamaño procesado total:</span>
                <span className="ml-auto text-blue-800 font-medium">
                  {formatFileSize(totalStats.totalCompressedSize)}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-800">
                  {totalStats.totalSavedPercentage >= 0 ? 'Reducción promedio:' : 'Cambio promedio:'}
                </span>
                <span className="ml-auto text-blue-800 font-medium">
                  {Math.abs(totalStats.totalSavedPercentage).toFixed(1)}%
                  {totalStats.totalSavedPercentage < 0 && ' (aumentó)'}
                </span>
              </div>
              <div className="flex items-start text-xs mt-2">
                <span className="text-blue-700">
                  {totalStats.totalSavedPercentage >= 0 ? 'Ahorro de espacio total:' : 'Cambio de tamaño total:'}
                </span>
                <span className="ml-auto">
                  {formatFileSize(Math.abs(totalStats.totalOriginalSize - totalStats.totalCompressedSize))}
                  {totalStats.totalOriginalSize < totalStats.totalCompressedSize && ' (aumentó)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {compressionInfo && compressedFile && (
        <div className="space-y-4">
          <div className={`${
            compressionInfo.savedPercentage > 0 
              ? 'bg-green-50 border-green-200' 
              : compressionInfo.savedPercentage === 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-amber-50 border-amber-200'
          } border rounded-md p-4`}>
            <h3 className={`${
              compressionInfo.savedPercentage > 0 
                ? 'text-green-800' 
                : compressionInfo.savedPercentage === 0 
                  ? 'text-blue-800' 
                  : 'text-amber-800'
            } font-medium mb-2`}>
              {compressionInfo.savedPercentage > 0 
                ? 'Compresión completada' 
                : 'Procesamiento completado con alta calidad'}
              {multipleFiles && ' para el archivo actual'}
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-start">
                <span className={compressionInfo.savedPercentage > 0 
                  ? 'text-green-800' 
                  : compressionInfo.savedPercentage === 0 
                    ? 'text-blue-800' 
                    : 'text-amber-800'
                }>Tamaño original:</span>
                <span className={`ml-auto ${
                  compressionInfo.savedPercentage > 0 
                    ? 'text-green-800' 
                    : compressionInfo.savedPercentage === 0 
                      ? 'text-blue-800' 
                      : 'text-amber-800'
                } font-medium`}>
                  {formatFileSize(compressionInfo.originalSize)}
                </span>
              </div>
              <div className="flex items-start">
                <span className={compressionInfo.savedPercentage > 0 
                  ? 'text-green-800' 
                  : compressionInfo.savedPercentage === 0 
                    ? 'text-blue-800' 
                    : 'text-amber-800'
                }>Tamaño procesado:</span>
                <span className={`ml-auto ${
                  compressionInfo.savedPercentage > 0 
                    ? 'text-green-800' 
                    : compressionInfo.savedPercentage === 0 
                      ? 'text-blue-800' 
                      : 'text-amber-800'
                } font-medium`}>
                  {formatFileSize(compressionInfo.compressedSize)}
                </span>
              </div>
              <div className="flex items-start">
                <span className={compressionInfo.savedPercentage > 0 
                  ? 'text-green-800' 
                  : compressionInfo.savedPercentage === 0 
                    ? 'text-blue-800' 
                    : 'text-amber-800'
                }>
                  {compressionInfo.savedPercentage >= 0 ? 'Reducción:' : 'Cambio:'}
                </span>
                <span className={`ml-auto ${
                  compressionInfo.savedPercentage > 0 
                    ? 'text-green-800' 
                    : compressionInfo.savedPercentage === 0 
                      ? 'text-blue-800' 
                      : 'text-amber-800'
                } font-medium`}>
                  {Math.abs(compressionInfo.savedPercentage).toFixed(1)}%
                  {compressionInfo.savedPercentage < 0 && ' (aumentó)'}
                </span>
              </div>
              <div className="flex items-start text-xs mt-2">
                <span className={compressionInfo.savedPercentage > 0 
                  ? 'text-green-700' 
                  : compressionInfo.savedPercentage === 0 
                    ? 'text-blue-700' 
                    : 'text-amber-700'
                }>
                  {compressionInfo.savedPercentage >= 0 ? 'Ahorro de espacio:' : 'Cambio de tamaño:'}
                </span>
                <span className="ml-auto">
                  {formatFileSize(Math.abs(compressionInfo.originalSize - compressionInfo.compressedSize))}
                  {compressionInfo.originalSize < compressionInfo.compressedSize && ' (aumentó)'}
                </span>
              </div>
            </div>
            
            {compressionInfo.savedPercentage < 0 && (
              <div className="mt-3 text-xs bg-red-100 p-2 rounded">
                <strong>Atención:</strong> El archivo procesado es más grande que el original. Recomendamos:
                <ul className="list-disc pl-4 mt-1">
                  <li>Intenta con nivel "Alto" de compresión</li>
                  <li>Si necesitas mantener alta calidad visual, considera usar el archivo original</li>
                </ul>
              </div>
            )}
          </div>
          
          <Button
            onClick={onDownload}
            variant="outline"
            className="w-full py-5 border-naranja text-naranja hover:bg-naranja/10 flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Descargar PDF{compressionInfo.savedPercentage > 0 ? ' comprimido' : ' procesado'}
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
