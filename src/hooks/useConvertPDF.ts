
import { useState } from 'react';
import { toast } from 'sonner';
import { extractTextFromPDF } from '@/utils/pdf/pdfTextExtractor';
import { createDocxFromPdfContent } from '@/utils/pdf/docxCreator';
import { createWordFile, downloadFile } from '@/utils/pdf/fileOperations';

interface ConvertResult {
  success: boolean;
  files: File[];
  message: string;
}

export const useConvertPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<File[]>([]);

  /**
   * Convert a PDF to DOCX (Word) format with improved text extraction
   */
  const convertPDF = async (file: File | null, format: string): Promise<ConvertResult> => {
    if (!file) {
      toast.error('Please select a PDF file');
      return { success: false, files: [], message: 'No file selected' };
    }

    // Verify that we only support DOCX as format
    if (format !== 'docx') {
      toast.error('Only conversion to DOCX format is supported');
      return { success: false, files: [], message: 'Format not supported' };
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setConvertedFiles([]);
      console.log('Starting PDF to DOCX conversion...', file.name, 'size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // Load PDF as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      setProgress(20);
      console.log('PDF loaded into memory, starting processing...');

      // Extract text from PDF using the utility
      const { pageContents, totalTextExtracted, numPages } = await extractTextFromPDF(
        pdfData,
        (newProgress) => setProgress(newProgress)
      );
      
      setProgress(70);
      console.log('Text extracted from all pages. Total content:', totalTextExtracted, 'characters');
      
      // Check extracted content with flexible criteria
      if (totalTextExtracted < 100 && numPages > 1) {
        console.error('Very little text extracted from PDF, possibly a scanned document or with images');
        return { 
          success: false, 
          files: [], 
          message: 'The document appears to contain mainly images or scanned text. Try with the OCR tool.' 
        };
      }
      
      // Create DOCX document from extracted content
      const docxBlob = await createDocxFromPdfContent(
        file.name,
        file.size,
        pageContents,
        numPages
      );
      
      setProgress(85);
      
      if (!docxBlob || docxBlob.size === 0) {
        throw new Error('The generated blob is empty');
      }
      
      // Verify the size of the generated file
      if (docxBlob.size < 20000 && totalTextExtracted > 1000) { // 20KB minimum for documents with text
        console.warn(`Warning: The DOCX file size (${docxBlob.size / 1024} KB) seems small for ${totalTextExtracted} characters`);
      }
      
      // Create Word file
      const docxFile = createWordFile(docxBlob, file.name);
      
      if (docxFile.size === 0) {
        throw new Error('The generated file is empty');
      }
      
      setConvertedFiles([docxFile]);
      
      setProgress(100);
      console.log('Conversion completed successfully');
      
      return {
        success: true,
        files: [docxFile],
        message: 'PDF converted to DOCX successfully'
      };
    } catch (error) {
      console.error('Error converting PDF:', error);
      toast.error('Error converting PDF');
      
      return {
        success: false,
        files: [],
        message: 'Error converting PDF: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    } finally {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  /**
   * Download the converted files
   */
  const downloadConvertedFiles = () => {
    if (convertedFiles.length === 0) {
      toast.error('No files to download');
      return;
    }
    
    downloadFile(convertedFiles[0]);
  };

  return {
    convertPDF,
    isProcessing,
    progress,
    convertedFiles,
    downloadConvertedFiles
  };
};
