
import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import FileUpload from '@/components/FileUpload';

interface ConversionFormProps {
  file: File | null;
  isProcessing: boolean;
  progress: number;
  onFileSelected: (files: File[]) => void;
  onConvert: () => void;
  conversionMode?: 'standard' | 'simple';
  onModeChange?: (mode: 'standard' | 'simple') => void;
}

const ConversionForm: React.FC<ConversionFormProps> = ({
  file,
  isProcessing,
  progress,
  onFileSelected,
  onConvert,
  conversionMode = 'standard',
  onModeChange,
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
        
        {/* Selector de método de conversión */}
        {onModeChange && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Método de conversión:</h3>
            <RadioGroup 
              defaultValue={conversionMode} 
              value={conversionMode}
              onValueChange={(value: string) => onModeChange(value as 'standard' | 'simple')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard">Estándar (con formato)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simple" id="simple" />
                <Label htmlFor="simple">Simple (texto básico)</Label>
              </div>
            </RadioGroup>
          </div>
        )}
        
        <Alert className="bg-[rgb(246,141,46)]/5 border-[rgb(246,141,46)]/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <p>Esta herramienta extrae texto del PDF y genera un documento Word editable.</p>
            <p className="mt-1">Proceso de conversión:</p>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>Carga del PDF usando pdf.js</li>
              <li>Extracción del texto página por página</li>
              <li>Generación del documento Word con docx.js</li>
              <li>Descarga automática del archivo final</li>
            </ol>
            <p className="mt-1">Los documentos escaneados o con imágenes pueden requerir OCR adicional.</p>
            {conversionMode === 'simple' && (
              <p className="mt-1 font-medium">Modo simple: Este método crea un documento Word con texto plano, sin intentar preservar el formato original del PDF.</p>
            )}
          </AlertDescription>
        </Alert>
        
        {isProcessing && (
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de conversión</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-100">
              <div className="h-full bg-[rgb(246,141,46)] transition-all" 
                   style={{ width: `${progress}%` }} />
            </Progress>
            <p className="text-xs text-muted-foreground mt-1">
              {progress < 20 ? "Cargando PDF con pdf.js..." : 
               progress < 40 ? "Extrayendo texto de cada página..." : 
               progress < 70 ? "Analizando estructura del contenido..." : 
               progress < 85 ? "Generando documento Word con docx.js..." : 
               "Finalizando conversión..."}
            </p>
          </div>
        )}
        
        <Button 
          onClick={onConvert} 
          disabled={!file || isProcessing}
          className="w-full bg-[rgb(246,141,46)] hover:bg-[rgb(246,141,46)]/90 text-white"
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Convirtiendo PDF a Word...
            </>
          ) : (
            `Convertir a Word${conversionMode === 'simple' ? ' (Método Simple)' : ''}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConversionForm;
