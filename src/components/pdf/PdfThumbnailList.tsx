
import React from 'react';
import { cn } from '@/lib/utils';

interface PdfThumbnailListProps {
  pages: string[];
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  className?: string;
}

const PdfThumbnailList: React.FC<PdfThumbnailListProps> = ({
  pages,
  currentPage,
  onPageSelect,
  className
}) => {
  return (
    <div className={cn("flex flex-col h-full overflow-y-auto bg-secondary/10 p-2", className)}>
      {pages.map((pageUrl, index) => (
        <div 
          key={index}
          className={cn(
            "mb-3 cursor-pointer hover:opacity-90 transition-all duration-150 flex flex-col items-center",
            currentPage === index + 1 ? "ring-2 ring-primary" : "ring-1 ring-border"
          )}
          onClick={() => onPageSelect(index + 1)}
        >
          <div className="relative w-full aspect-[3/4] bg-white shadow-sm">
            <img 
              src={pageUrl} 
              alt={`Page ${index + 1} thumbnail`}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
          <div className="text-xs font-medium mt-1 text-center">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PdfThumbnailList;
