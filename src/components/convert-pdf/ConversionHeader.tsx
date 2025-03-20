
import React from 'react';
import { FileType } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const ConversionHeader: React.FC = () => {
  return (
    <motion.div 
      className="text-center mb-12"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      <div className="rounded-full bg-primary/10 p-3 inline-flex mb-4">
        <FileType className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Convert PDF to Word</h1>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Convert your PDF documents to Word (DOCX) format to easily edit them.
        All processing happens in your browser to keep your documents private.
      </p>
    </motion.div>
  );
};

export default ConversionHeader;
