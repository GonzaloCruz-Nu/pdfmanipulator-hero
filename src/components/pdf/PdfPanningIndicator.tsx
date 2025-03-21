
import React from 'react';

interface PdfPanningIndicatorProps {
  isPanning: boolean;
}

const PdfPanningIndicator: React.FC<PdfPanningIndicatorProps> = ({ isPanning }) => {
  if (!isPanning) return null;

  return (
    <div className="absolute top-4 left-4 bg-primary/80 text-white px-3 py-1.5 rounded-md text-xs font-medium">
      Modo movimiento: Click y arrastra para mover
    </div>
  );
};

export default PdfPanningIndicator;
