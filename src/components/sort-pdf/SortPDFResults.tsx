
import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PdfPreview from '@/components/PdfPreview';

interface SortPDFResultsProps {
  file: File;
  onReset: () => void;
}

const SortPDFResults: React.FC<SortPDFResultsProps> = ({ file, onReset }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    
    try {
      // Create a URL for the blob
      const url = URL.createObjectURL(file);
      
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      
      // Append to the document
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-subtle p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">PDF reordenado correctamente</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Tu PDF ha sido reordenado según la secuencia especificada. Puedes previsualizarlo y descargarlo.
        </p>
      </div>
      
      <div className="mb-6">
        <PdfPreview file={file} className="w-full" />
      </div>
      
      <div className="flex flex-wrap gap-3 justify-between">
        <Button 
          variant="outline" 
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reordenar otro PDF
        </Button>
        
        <Button 
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2"
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Descargando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Descargar PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SortPDFResults;
