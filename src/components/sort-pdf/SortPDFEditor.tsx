
import React, { useState } from 'react';
import { ArrowUp, ArrowDown, RotateCcw, MoveVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SortPDFEditorProps {
  file: File;
  pageOrder: number[];
  setPageOrder: (order: number[]) => void;
  thumbnails: string[];
  isGeneratingThumbnails: boolean;
  movePageUp: (index: number) => void;
  movePageDown: (index: number) => void;
  totalPages: number;
  onReset: () => void;
  onSort: () => void;
  isProcessing: boolean;
}

const SortPDFEditor: React.FC<SortPDFEditorProps> = ({
  file,
  pageOrder,
  setPageOrder,
  thumbnails,
  isGeneratingThumbnails,
  movePageUp,
  movePageDown,
  totalPages,
  onReset,
  onSort,
  isProcessing,
}) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag-and-drop functionality
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (sourceIndex === targetIndex) return;
    
    const newOrder = [...pageOrder];
    const [movedItem] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, movedItem);
    
    setPageOrder(newOrder);
    setDraggedItem(null);
    setDragOverIndex(null);
    
    // Notificar al usuario sobre el cambio
    const pageNumber = pageOrder[sourceIndex];
    const fromPosition = sourceIndex + 1;
    const toPosition = targetIndex + 1;
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-subtle p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Reordenar páginas</h2>
        <p className="text-muted-foreground">
          Ordenando: <span className="font-medium text-foreground">{file.name}</span> ({totalPages} páginas)
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          <MoveVertical className="h-4 w-4 inline mr-1" /> Arrastra y suelta las miniaturas para reorganizar
        </p>
      </div>

      {isGeneratingThumbnails ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="mb-2">Generando miniaturas...</p>
          <Progress value={thumbnails.length / totalPages * 100} className="max-w-md mx-auto" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6 max-h-[600px] overflow-y-auto p-2">
            {pageOrder.map((pageNum, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-gray-50 border rounded-lg p-2 flex flex-col cursor-move relative transition-all duration-200 ${
                  draggedItem === index 
                    ? 'opacity-50 border-dashed border-gray-400' 
                    : dragOverIndex === index 
                      ? 'border-primary border-2' 
                      : 'border-gray-200'
                }`}
              >
                <div className="text-xs text-muted-foreground mb-2 flex justify-between items-center">
                  <span className="font-medium">Página {pageNum}</span>
                  <MoveVertical className="h-4 w-4" />
                </div>
                <div className="flex justify-center mb-2">
                  <img
                    src={thumbnails[pageNum - 1]}
                    alt={`Página ${pageNum}`}
                    className="max-h-40 border border-gray-200 shadow-xs rounded"
                  />
                </div>
                <div className="flex justify-between mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => movePageUp(index)}
                    disabled={index === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => movePageDown(index)}
                    disabled={index === pageOrder.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-6 justify-between">
            <Button 
              variant="outline" 
              onClick={onReset}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restablecer orden original
            </Button>
            
            <Button 
              onClick={onSort}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Aplicar nuevo orden
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SortPDFEditor;
