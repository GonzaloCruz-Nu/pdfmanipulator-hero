
import React from 'react';

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
  selectedPages: number[];
}

const PageIndicator: React.FC<PageIndicatorProps> = ({
  currentPage,
  totalPages,
  selectedPages,
}) => {
  return (
    <div className="absolute bottom-16 left-0 right-0 flex justify-center">
      <div className="bg-white px-4 py-2 rounded-full shadow text-sm">
        Página {currentPage} de {totalPages}
        {selectedPages.length > 0 && (
          <span className="ml-2 text-blue-600">
            ({selectedPages.length} {selectedPages.length === 1 ? 'página seleccionada' : 'páginas seleccionadas'})
          </span>
        )}
      </div>
    </div>
  );
};

export default PageIndicator;
