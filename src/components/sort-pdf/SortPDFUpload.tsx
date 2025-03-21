
import React, { useCallback, useState } from 'react';
import { FileUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface SortPDFUploadProps {
  onFileSelected: (file: File) => void;
}

const SortPDFUpload: React.FC<SortPDFUploadProps> = ({ onFileSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) {
      return;
    }
    
    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecciona un archivo PDF válido');
      return;
    }
    
    onFileSelected(file);
  }, [onFileSelected]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  });

  return (
    <div 
      {...getRootProps()} 
      className={`input-file ${isDragging ? 'input-file-dragging' : ''}`}
    >
      <input {...getInputProps()} />
      <FileUp className="h-12 w-12 mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Arrastra y suelta un archivo PDF</h3>
      <p className="text-muted-foreground mb-4">
        o haz clic para seleccionar un archivo
      </p>
      <button className="btn-primary">
        Seleccionar PDF
      </button>
    </div>
  );
};

export default SortPDFUpload;
