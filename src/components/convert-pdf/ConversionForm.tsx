
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
        <h2 className="text-xl font-semibold">Select a PDF</h2>
        <FileUpload 
          onFilesSelected={onFileSelected}
          multiple={false}
          accept=".pdf"
        />
        
        {file && (
          <div className="text-sm text-muted-foreground mt-2">
            File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>

      <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
        <h2 className="text-xl font-semibold">Convert to Word (DOCX)</h2>
        
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This tool extracts text from the PDF and generates an editable Word document.
            Scanned documents or those with images may require additional OCR.
          </AlertDescription>
        </Alert>
        
        {isProcessing && (
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm">
              <span>Conversion progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress < 20 ? "Loading PDF..." : 
               progress < 40 ? "Extracting text..." : 
               progress < 70 ? "Analyzing content..." : 
               progress < 85 ? "Generating Word document..." : 
               "Completing conversion..."}
            </p>
          </div>
        )}
        
        <Button 
          onClick={onConvert} 
          disabled={!file || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              Converting PDF to Word...
            </>
          ) : (
            'Convert to Word'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConversionForm;
