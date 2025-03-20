
import React from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';

interface PdfControlsProps {
  currentPage: number;
  totalPages: number;
  isFullscreen: boolean;
  isLoading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleFullscreen: () => void;
  onClose?: () => void;
  fileName: string;
}

const PdfControls: React.FC<PdfControlsProps> = ({
  currentPage,
  totalPages,
  isFullscreen,
  isLoading,
  onPrevPage,
  onNextPage,
  onToggleFullscreen,
  onClose,
  fileName,
}) => {
  return (
    <>
      <div className="absolute top-3 right-3 flex space-x-2 z-10">
        <button
          onClick={onToggleFullscreen}
          className="rounded-full p-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-3 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {fileName} - Página {currentPage} de {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1 || isLoading}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages || isLoading}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default PdfControls;
