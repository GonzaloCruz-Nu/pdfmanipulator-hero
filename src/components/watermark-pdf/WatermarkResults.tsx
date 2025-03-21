
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import PdfPreview from '@/components/PdfPreview';
import { File, Download } from 'lucide-react';

interface WatermarkResultsProps {
  isProcessing: boolean;
  progress: number;
  errorMessage: string | null;
  watermarkedFile: File | null;
  showPreview: boolean;
  togglePreview: () => void;
  downloadWatermarkedFile: () => void;
}

const WatermarkResults = ({
  isProcessing,
  progress,
  errorMessage,
  watermarkedFile,
  showPreview,
  togglePreview,
  downloadWatermarkedFile
}: WatermarkResultsProps) => {
  if (!watermarkedFile && !isProcessing && !errorMessage) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {isProcessing && progress > 0 && (
        <Progress value={progress} className="h-2 mt-4" />
      )}
      
      {errorMessage && (
        <p className="text-sm text-destructive mt-2">{errorMessage}</p>
      )}
      
      {watermarkedFile && (
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <File className="h-5 w-5 text-primary mr-2" />
              <div>
                <p className="font-medium">PDF procesado con éxito</p>
                <p className="text-sm text-muted-foreground">
                  {watermarkedFile.name} ({(watermarkedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={togglePreview}>
                {showPreview ? "Ocultar vista previa" : "Ver PDF"}
              </Button>
              <Button size="sm" onClick={downloadWatermarkedFile}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {showPreview && watermarkedFile && (
        <PdfPreview 
          file={watermarkedFile} 
          onClose={() => togglePreview()}
          showEditor={false}
        />
      )}
    </div>
  );
};

export default WatermarkResults;
