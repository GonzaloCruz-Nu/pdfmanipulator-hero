
import React, { useCallback, useState } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  acceptedFileTypes?: string[];
  accept?: string;
  className?: string;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  infoText?: string;  // Added this prop to fix the type error
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  multiple = true,
  acceptedFileTypes = [".pdf"],
  accept = ".pdf",
  className,
  maxFiles = 10,
  maxSize = 15,
  disabled = false,
  infoText = "Drag files here or click to browse", // Add default value
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || disabled) return;

      const newFiles = Array.from(selectedFiles);
      if (multiple) {
        const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
        setFiles(updatedFiles);
        onFilesSelected(updatedFiles);
      } else {
        setFiles(newFiles.slice(0, 1));
        onFilesSelected(newFiles.slice(0, 1));
      }
    },
    [files, multiple, maxFiles, onFilesSelected, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) handleFileChange(e.dataTransfer.files);
    },
    [handleFileChange, disabled]
  );

  const removeFile = useCallback(
    (index: number) => {
      if (disabled) return;
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, onFilesSelected, disabled]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "input-file relative border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer transition-all hover:border-naranja",
          {
            "opacity-50 cursor-not-allowed": disabled,
            "border-naranja bg-naranja/5": isDragging,
            "h-40": files.length > 0
          }
        )}
      >
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={(e) => handleFileChange(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={disabled}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="rounded-full bg-naranja/10 p-3">
            <Upload className="h-6 w-6 text-naranja" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-gray-800">
              {isDragging ? "Suelta aquí" : infoText}
            </p>
            <p className="text-xs text-gray-600">
              {multiple ? `PDF (máx. ${maxFiles})` : "PDF"}
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <p className="mb-2 text-sm font-medium">Archivos seleccionados:</p>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-md bg-gray-100 p-2 text-sm"
              >
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-4 w-4 text-naranja" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-naranja/10 hover:text-naranja"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
