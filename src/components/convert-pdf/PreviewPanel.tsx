
import React from 'react';
import { motion } from 'framer-motion';
import PdfPreview from '@/components/PdfPreview';

interface PreviewPanelProps {
  file: File | null;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ file }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-subtle p-6"
    >
      <h2 className="text-xl font-semibold mb-4">Preview</h2>
      {file ? (
        <PdfPreview file={file} />
      ) : (
        <div className="flex items-center justify-center h-80 bg-secondary/30 rounded-lg">
          <p className="text-muted-foreground">
            Select a PDF to see the preview
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PreviewPanel;
