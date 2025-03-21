
import React from 'react';
import { Download, FileText, AlertTriangle, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

interface ConversionResultsProps {
  convertedFiles: File[];
  originalFile: File | null;
  onDownload: () => void;
  errorMessage: string | null;
  conversionStarted: boolean;
  isProcessing: boolean;
}

const ConversionResults: React.FC<ConversionResultsProps> = ({
  convertedFiles,
  originalFile,
  onDownload,
  errorMessage,
  conversionStarted,
  isProcessing,
}) => {
  if (convertedFiles.length > 0) {
    return (
      <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
        <h2 className="text-xl font-semibold">Archivo convertido</h2>
        <ul className="space-y-2">
          {convertedFiles.map((convertedFile, index) => {
            // Mostrar siempre el tamaño en KB para archivos pequeños
            const fileSize = convertedFile.size;
            const fileSizeFormatted = fileSize > 1024 * 1024 
              ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' 
              : (fileSize / 1024).toFixed(2) + ' KB';
            
            // Calcular la proporción del tamaño respecto al original
            const conversionRatio = originalFile 
              ? ((convertedFile.size / originalFile.size) * 100).toFixed(1) + '%'
              : 'N/A';
            
            const isVerySmall = originalFile && (convertedFile.size / originalFile.size) < 0.05;
            
            return (
              <li 
                key={index} 
                className={`flex items-center justify-between rounded-md ${isVerySmall ? 'bg-amber-50' : 'bg-gray-100'} p-3 text-sm`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className={`h-4 w-4 ${isVerySmall ? 'text-amber-500' : 'text-[rgb(246,141,46)]'}`} />
                  <span className="truncate max-w-[200px]">{convertedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({fileSizeFormatted})
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {originalFile && <span title="Tamaño relativo al PDF original">
                    {conversionRatio}
                  </span>}
                </div>
              </li>
            );
          })}
        </ul>
        <Button 
          onClick={onDownload} 
          variant="secondary"
          className="w-full bg-[rgb(31,42,68)] hover:bg-[rgb(31,42,68)]/90 text-white"
        >
          <Download className="mr-2 h-4 w-4" /> 
          Descargar documento Word
        </Button>
        
        {/* Advertencia mejorada para archivos muy pequeños */}
        {originalFile && convertedFiles[0] && convertedFiles[0].size < originalFile.size * 0.1 && originalFile.size > 200000 && (
          <Alert className="mt-2 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs text-amber-800">
              <p className="font-semibold">El documento Word es considerablemente más pequeño que el PDF original:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>PDF original: {(originalFile.size / (1024 * 1024)).toFixed(2)} MB</li>
                <li>Word generado: {(convertedFiles[0].size / 1024).toFixed(2)} KB</li>
                <li>Porcentaje del tamaño original: {((convertedFiles[0].size / originalFile.size) * 100).toFixed(2)}%</li>
              </ul>
              <p className="mt-2">
                Algunas imágenes o elementos complejos pueden no haberse convertido. El PDF puede contener principalmente imágenes, gráficos o texto no extraíble.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
  
  // Mostrar error si la conversión falló
  if (errorMessage && conversionStarted && !isProcessing && convertedFiles.length === 0) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium">Error en la conversión:</p>
          <p>{errorMessage || 'No se pudo generar el documento Word. El archivo PDF puede estar protegido o contener sólo imágenes.'}</p>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};

export default ConversionResults;
