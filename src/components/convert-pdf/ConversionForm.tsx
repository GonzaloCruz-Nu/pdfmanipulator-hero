
import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileUpload from '@/components/FileUpload';

interface ConversionFormProps {
  file: File | null;
  isProcessing: boolean;
  progress: number;
  onFileSelected: (files: File[]) => void;
  onConvert: () => void;
}

const ConversionForm: React.FC<ConversionFormProps> = ({
  file,
  isProcessing,
  progress,
  onFileSelected,
  onConvert,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
        <h2 className="text-xl font-semibold">Selecciona un PDF</h2>
        <FileUpload 
          onFilesSelected={onFileSelected}
          multiple={false}
          accept=".pdf"
        />
        
        {file && (
          <div className="text-sm text-muted-foreground mt-2">
            Archivo: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>

      <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
        <h2 className="text-xl font-semibold">Convertir a Word (DOCX)</h2>
        
        <Alert className="bg-naranja/5 border-naranja/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Esta herramienta extrae texto del PDF y genera un documento Word editable.
            Los documentos escaneados o aquellos con imágenes pueden requerir OCR adicional.
          </AlertDescription>
        </Alert>
        
        {isProcessing && (
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de conversión</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress < 20 ? "Cargando PDF..." : 
               progress < 40 ? "Extrayendo texto..." : 
               progress < 70 ? "Analizando contenido..." : 
               progress < 85 ? "Generando documento Word..." : 
               "Completando conversión..."}
            </p>
          </div>
        )}
        
        <Button 
          onClick={onConvert} 
          disabled={!file || isProcessing}
          className="w-full bg-naranja hover:bg-naranja/90 text-white"
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Convirtiendo PDF a Word...
            </>
          ) : (
            'Convertir a Word'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConversionForm;
