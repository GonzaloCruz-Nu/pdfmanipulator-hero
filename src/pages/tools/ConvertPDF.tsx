
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileType, Download, FileText, Info, AlertTriangle, Scan } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import PdfPreview from '@/components/PdfPreview';
import { useConvertPDF } from '@/hooks/useConvertPDF';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

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

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-8">
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

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
              <h2 className="text-xl font-semibold">Select a PDF</h2>
              <FileUpload 
                onFilesSelected={handleFileSelected}
                multiple={false}
                accept=".pdf"
              />
              
              {file && (
                <div className="text-sm text-muted-foreground mt-2">
                  File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
              <h2 className="text-xl font-semibold">Convert to Word (DOCX)</h2>
              
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This tool extracts text from the PDF and generates an editable Word document.
                  Scanned documents or those with images may require additional OCR.
                </AlertDescription>
              </Alert>
              
              {isProcessing && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-sm">
                    <span>Conversion progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress < 20 ? "Loading PDF..." : 
                     progress < 40 ? "Extracting text..." : 
                     progress < 70 ? "Analyzing content..." : 
                     progress < 85 ? "Generating Word document..." : 
                     "Completing conversion..."}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleConvert} 
                disabled={!file || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Converting PDF to Word...
                  </>
                ) : (
                  'Convert to Word'
                )}
              </Button>
            </div>

            {convertedFiles.length > 0 && (
              <div className="space-y-4 bg-white rounded-xl p-6 shadow-subtle">
                <h2 className="text-xl font-semibold">Converted file</h2>
                <ul className="space-y-2">
                  {convertedFiles.map((convertedFile, index) => {
                    // Always show size in KB for small files
                    const fileSize = convertedFile.size;
                    const fileSizeFormatted = fileSize > 1024 * 1024 
                      ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' 
                      : (fileSize / 1024).toFixed(2) + ' KB';
                    
                    return (
                      <li key={index} className="flex items-center justify-between rounded-md bg-secondary/50 p-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{convertedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({fileSizeFormatted})
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Button 
                  onClick={downloadConvertedFiles} 
                  variant="secondary"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" /> 
                  Download Word document
                </Button>
                
                {/* Improved warning for very small files */}
                {convertedFiles[0]?.size < 20000 && file && file.size > 200000 && (
                  <Alert className="mt-2 bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-xs text-amber-800">
                      <p className="font-semibold">Very small Word document detected:</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>Original PDF: {(file.size / (1024 * 1024)).toFixed(2)} MB</li>
                        <li>Generated Word: {(convertedFiles[0].size / 1024).toFixed(2)} KB</li>
                        <li>Percentage of original size: {((convertedFiles[0].size / file.size) * 100).toFixed(2)}%</li>
                      </ul>
                      <p className="mt-2">
                        The PDF may contain mainly images, graphics, or non-extractable text.
                      </p>
                      <div className="mt-2">
                        <Link to="/tools/ocr" className="text-primary flex items-center">
                          <Scan className="h-3 w-3 mr-1" /> Try our OCR tool for scanned documents
                        </Link>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {conversionStarted && !isProcessing && convertedFiles.length === 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || 'Could not generate Word document. PDF file may be protected or contain only images.'}
                  <div className="mt-2">
                    <Link to="/tools/ocr" className="text-white/90 hover:text-white flex items-center">
                      <Scan className="h-3 w-3 mr-1" /> Try with the OCR tool for scanned documents
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </motion.div>

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
        </div>
      </div>
    </Layout>
  );
};

export default ConvertPDF;
