
import React from 'react';
import { cn } from '@/lib/utils';

interface PdfThumbnailListProps {
  pages: string[];
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  className?: string;
  isChangingPage?: boolean;
}

const PdfThumbnailList: React.FC<PdfThumbnailListProps> = ({
  pages,
  currentPage,
  onPageSelect,
  className,
  isChangingPage = false
}) => {
  return (
    <div className={cn("flex flex-col h-full overflow-y-auto bg-gray-50 p-3", className)}>
      {pages.length === 0 ? (
        <div className="text-center p-4 text-sm text-gray-500">
          No hay miniaturas disponibles
        </div>
      ) : (
        pages.map((pageUrl, index) => (
          <div 
            key={index}
            className={cn(
              "mb-3 cursor-pointer transition-all duration-150 flex flex-col items-center bg-white p-1",
              currentPage === index + 1 ? "ring-2 ring-primary" : "ring-1 ring-gray-200 hover:ring-gray-300",
              isChangingPage && "opacity-50 pointer-events-none"
            )}
            onClick={() => onPageSelect(index + 1)}
          >
            <div className="relative w-full aspect-[3/4]">
              <img 
                src={pageUrl} 
                alt={`Page ${index + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-medium mt-1 text-center">
              {index + 1}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PdfThumbnailList;
