
import React from 'react';
import { Check, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

interface PdfThumbnailSelectorProps {
  thumbnails: string[];
  selectedPages: number[];
  rotationAngles: { [key: number]: number };
  isPageSelectionEnabled: boolean;
  generatingThumbnails: boolean;
  isLoading: boolean;
  totalPages: number;
  togglePageSelection: (pageNumber: number) => void;
  selectAllPages: () => void;
  clearPageSelection: () => void;
}

const PdfThumbnailSelector: React.FC<PdfThumbnailSelectorProps> = ({
  thumbnails,
  selectedPages,
  rotationAngles,
  isPageSelectionEnabled,
  generatingThumbnails,
  isLoading,
  totalPages,
  togglePageSelection,
  selectAllPages,
  clearPageSelection,
}) => {
  return (
    <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg overflow-y-auto max-h-[600px] border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-sm">Selección de páginas</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={selectAllPages}
            disabled={generatingThumbnails || !isPageSelectionEnabled}
            title="Seleccionar todas"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearPageSelection}
            disabled={generatingThumbnails || !isPageSelectionEnabled}
            title="Limpiar selección"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {generatingThumbnails || isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: Math.min(10, totalPages || 5) }).map((_, idx) => (
            <div key={idx} className="flex items-center space-x-2 p-2 rounded animate-pulse">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <div className="flex items-center space-x-2 flex-1">
                <Skeleton className="w-12 h-16 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </div>
          ))}
          <div className="text-center text-sm text-muted-foreground pt-2">
            <Loader2 className="h-4 w-4 inline-block mr-1 animate-spin" />
            {generatingThumbnails ? "Generando miniaturas..." : "Cargando documento..."}
          </div>
        </div>
      ) : thumbnails.length > 0 ? (
        <div className="space-y-2">
          {thumbnails.map((thumb, idx) => (
            <div 
              key={idx} 
              className={`flex items-center space-x-2 p-2 rounded ${!isPageSelectionEnabled ? 'opacity-60' : selectedPages.includes(idx + 1) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'}`}
            >
              <Checkbox 
                id={`page-${idx + 1}`}
                checked={selectedPages.includes(idx + 1)}
                onCheckedChange={() => togglePageSelection(idx + 1)}
                disabled={!isPageSelectionEnabled}
              />
              <div className="flex items-center space-x-2 flex-1">
                <div className="w-12 h-16 relative border border-gray-200">
                  <img 
                    src={thumb} 
                    alt={`Página ${idx + 1}`} 
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
                <label 
                  htmlFor={`page-${idx + 1}`} 
                  className={`text-sm cursor-pointer flex-1 ${!isPageSelectionEnabled ? 'text-gray-400' : ''}`}
                >
                  Página {idx + 1}
                  {rotationAngles[idx + 1] ? 
                    <span className="text-xs text-blue-600 ml-1">
                      ({rotationAngles[idx + 1]}°)
                    </span> : null
                  }
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground pt-2">
          No se pudieron generar las miniaturas
        </div>
      )}
    </div>
  );
};

export default PdfThumbnailSelector;
