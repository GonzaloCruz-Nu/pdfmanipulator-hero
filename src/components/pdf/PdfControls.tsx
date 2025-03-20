
import React from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <Button
          onClick={onToggleFullscreen}
          variant="ghost"
          size="icon"
          className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 w-8"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-3 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground truncate max-w-[70%]">
          {fileName} - Página {currentPage} de {totalPages}
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={onPrevPage}
            disabled={currentPage <= 1 || isLoading}
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={onNextPage}
            disabled={currentPage >= totalPages || isLoading}
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default PdfControls;
