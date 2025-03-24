
import React from 'react';
import PdfPreview from '@/components/PdfPreview';
import RotationControls from './RotationControls';
import PageIndicator from './PageIndicator';

interface PdfPreviewSectionProps {
  file: File;
  currentPage: number;
  totalPages: number;
  selectedPages: number[];
  rotationAngles: { [key: number]: number };
  isLoading: boolean;
  handleRotate: (direction: 'clockwise' | 'counterclockwise') => void;
  handleResetRotation: () => void;
  toggleSelectionMode: () => void;
  showSelectionMode: boolean;
  thumbnails: string[];
  generatingThumbnails: boolean;
}

const PdfPreviewSection: React.FC<PdfPreviewSectionProps> = ({
  file,
  currentPage,
  totalPages,
  selectedPages,
  rotationAngles,
  isLoading,
  handleRotate,
  handleResetRotation,
  toggleSelectionMode,
  showSelectionMode,
  thumbnails,
  generatingThumbnails,
}) => {
  return (
    <div className={`relative ${showSelectionMode ? 'md:col-span-3' : 'md:col-span-4'}`}>
      <PdfPreview file={file} className="h-[600px]" />
      
      <RotationControls 
        onRotate={handleRotate}
        onResetRotation={handleResetRotation}
        toggleSelectionMode={toggleSelectionMode}
        showSelectionMode={showSelectionMode}
        isLoading={isLoading}
        selectedPages={selectedPages}
        currentPage={currentPage}
        rotationAngles={rotationAngles}
        hasThumbnails={thumbnails.length > 0}
        generatingThumbnails={generatingThumbnails}
      />
      
      <PageIndicator 
        currentPage={currentPage} 
        totalPages={totalPages} 
        selectedPages={selectedPages} 
      />
    </div>
  );
};

export default PdfPreviewSection;
