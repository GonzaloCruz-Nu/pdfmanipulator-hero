
import React from 'react';
import { cn } from '@/lib/utils';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import PdfViewerContent from './pdf/PdfViewerContent';

interface PdfPreviewProps {
  file: File | null;
  onClose?: () => void;
  className?: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ file, onClose, className }) => {
  const {
    currentPage,
    totalPages,
    pageUrl,
    isLoading,
    error,
    nextPage,
    prevPage
  } = usePdfRenderer(file);

  if (!file) {
    return null;
  }

  return (
    <div className={cn("relative bg-white rounded-xl shadow-lg h-[500px]", className)}>
      <div className="absolute top-3 right-3 z-10">
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 p-2 hover:bg-white text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative h-full">
        <PdfViewerContent
          pageUrl={pageUrl}
          isLoading={isLoading}
          error={error}
          fileName={file.name}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={nextPage}
          onPrevPage={prevPage}
        />
      </div>
    </div>
  );
};

export default PdfPreview;
