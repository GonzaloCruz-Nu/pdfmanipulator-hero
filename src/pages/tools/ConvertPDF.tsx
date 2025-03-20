
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { useConvertPDF } from '@/hooks/useConvertPDF';
import ConversionHeader from '@/components/convert-pdf/ConversionHeader';
import ConversionForm from '@/components/convert-pdf/ConversionForm';
import ConversionResults from '@/components/convert-pdf/ConversionResults';
import PreviewPanel from '@/components/convert-pdf/PreviewPanel';

const ConvertPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [conversionStarted, setConversionStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { 
    convertPDF, 
    isProcessing, 
    progress, 
    convertedFiles,
    downloadConvertedFiles
  } = useConvertPDF();

  // Reset state when a new file is selected
  useEffect(() => {
    setConversionStarted(false);
    setErrorMessage(null);
  }, [file]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      console.log('File selected:', files[0].name, 'size:', (files[0].size / 1024 / 1024).toFixed(2), 'MB');
    } else {
      setFile(null);
    }
  };

  const handleConvert = async () => {
    if (file) {
      try {
        setConversionStarted(true);
        setErrorMessage(null);
        console.log('Starting conversion for:', file.name);
        const result = await convertPDF(file, 'docx');
        
        if (result.success) {
          // Show size in KB for small files
          const fileSize = result.files[0].size;
          const fileSizeFormatted = fileSize > 1024 * 1024 
            ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' 
            : (fileSize / 1024).toFixed(2) + ' KB';
            
          // Updated thresholds for warnings:
          // - If Word is less than 20KB and PDF is greater than 200KB = strong warning
          // - If Word is less than 50KB and PDF is greater than 500KB = mild warning
          if (fileSize < 20000 && file.size > 200000) {
            toast.warning(`The generated Word document is very small (${fileSizeFormatted}). The PDF probably contains mainly images or non-extractable text.`);
          } else if (fileSize < 50000 && file.size > 500000) {
            toast.warning(`The Word document (${fileSizeFormatted}) is considerably smaller than the original PDF. Some images or complex elements may not have been converted.`);
          } else {
            toast.success(`PDF successfully converted to Word (${fileSizeFormatted})`);
          }
          console.log('Conversion completed successfully, result:', result);
        } else {
          setErrorMessage(result.message);
          toast.error(result.message || 'Error converting PDF');
          console.error('Conversion error:', result.message);
        }
      } catch (error) {
        console.error('Conversion error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error during conversion');
        toast.error('Error converting PDF to Word');
      }
    } else {
      toast.error('Please select a PDF file');
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-8">
        <ConversionHeader />

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ConversionForm 
              file={file}
              isProcessing={isProcessing}
              progress={progress}
              onFileSelected={handleFileSelected}
              onConvert={handleConvert}
            />

            <ConversionResults 
              convertedFiles={convertedFiles}
              originalFile={file}
              onDownload={downloadConvertedFiles}
              errorMessage={errorMessage}
              conversionStarted={conversionStarted}
              isProcessing={isProcessing}
            />
          </motion.div>

          <PreviewPanel file={file} />
        </div>
      </div>
    </Layout>
  );
};

export default ConvertPDF;
