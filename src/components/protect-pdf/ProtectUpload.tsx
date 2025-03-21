
import React from 'react';
import FileUpload from '@/components/FileUpload';
import { Label } from '@/components/ui/label';

interface ProtectUploadProps {
  onFilesSelected: (files: File[]) => void;
}

const ProtectUpload = ({ onFilesSelected }: ProtectUploadProps) => {
  return (
    <div>
      <Label htmlFor="file">1. Selecciona el PDF a procesar</Label>
      <FileUpload
        onFilesSelected={onFilesSelected}
        multiple={false}
        accept=".pdf"
        maxFiles={1}
        maxSize={100} // 100 MB
      />
    </div>
  );
};

export default ProtectUpload;
