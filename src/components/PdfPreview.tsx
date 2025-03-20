
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import PdfControls from './pdf/PdfControls';
import PdfViewerContent from './pdf/PdfViewerContent';

interface PdfPreviewProps {
  file: File | null;
  onClose?: () => void;
  className?: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ file, onClose, className }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const {
    currentPage,
    totalPages,
    pageUrl,
    isLoading,
    error,
    nextPage,
    prevPage
  } = usePdfRenderer(file);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!file) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl shadow-glass-lg transition-all duration-300 flex flex-col",
        isFullscreen ? "fixed inset-4 z-50" : "h-[400px]",
        className
      )}
    >
      <PdfControls
        currentPage={currentPage}
        totalPages={totalPages}
        isFullscreen={isFullscreen}
        isLoading={isLoading}
        onPrevPage={prevPage}
        onNextPage={nextPage}
        onToggleFullscreen={toggleFullscreen}
        onClose={onClose}
        fileName={file.name}
      />

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <PdfViewerContent
            pageUrl={pageUrl}
            isLoading={isLoading}
            error={error}
            fileName={file.name}
            currentPage={currentPage}
            activeTool="select" // Adding the default activeTool prop
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
