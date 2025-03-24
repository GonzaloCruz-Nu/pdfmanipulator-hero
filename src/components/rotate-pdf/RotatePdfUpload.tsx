
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/FileUpload';

interface RotatePdfUploadProps {
  file: File | null;
  handleFileChange: (uploadedFiles: File[]) => void;
  setFile: (file: File | null) => void;
}

const RotatePdfUpload: React.FC<RotatePdfUploadProps> = ({ file, handleFileChange, setFile }) => {
  if (!file) {
    return (
      <Card className="p-6 max-w-xl mx-auto">
        <FileUpload
          onFilesSelected={handleFileChange}
          maxFiles={1}
          maxSize={100}
          accept=".pdf"
          infoText="Arrastra un archivo PDF o haz clic para seleccionarlo"
        />
      </Card>
    );
  }

  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">{file.name}</h2>
      <Button 
        variant="ghost" 
        onClick={() => setFile(null)}
      >
        Cambiar archivo
      </Button>
    </div>
  );
};

export default RotatePdfUpload;
