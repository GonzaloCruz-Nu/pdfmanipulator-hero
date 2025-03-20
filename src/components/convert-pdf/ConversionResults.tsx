
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
        <h2 className="text-xl font-semibold">Converted file</h2>
        <ul className="space-y-2">
          {convertedFiles.map((convertedFile, index) => {
            // Always show size in KB for small files
            const fileSize = convertedFile.size;
            const fileSizeFormatted = fileSize > 1024 * 1024 
              ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' 
              : (fileSize / 1024).toFixed(2) + ' KB';
            
            return (
              <li key={index} className="flex items-center justify-between rounded-md bg-secondary/50 p-3 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate max-w-[200px]">{convertedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({fileSizeFormatted})
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <Button 
          onClick={onDownload} 
          variant="secondary"
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" /> 
          Download Word document
        </Button>
        
        {/* Improved warning for very small files */}
        {convertedFiles[0]?.size < 20000 && originalFile && originalFile.size > 200000 && (
          <Alert className="mt-2 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs text-amber-800">
              <p className="font-semibold">Very small Word document detected:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Original PDF: {(originalFile.size / (1024 * 1024)).toFixed(2)} MB</li>
                <li>Generated Word: {(convertedFiles[0].size / 1024).toFixed(2)} KB</li>
                <li>Percentage of original size: {((convertedFiles[0].size / originalFile.size) * 100).toFixed(2)}%</li>
              </ul>
              <p className="mt-2">
                The PDF may contain mainly images, graphics, or non-extractable text.
              </p>
              <div className="mt-2">
                <Link to="/tools/ocr" className="text-primary flex items-center">
                  <Scan className="h-3 w-3 mr-1" /> Try our OCR tool for scanned documents
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
  
  if (conversionStarted && !isProcessing && convertedFiles.length === 0) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {errorMessage || 'Could not generate Word document. PDF file may be protected or contain only images.'}
          <div className="mt-2">
            <Link to="/tools/ocr" className="text-white/90 hover:text-white flex items-center">
              <Scan className="h-3 w-3 mr-1" /> Try with the OCR tool for scanned documents
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};

export default ConversionResults;
