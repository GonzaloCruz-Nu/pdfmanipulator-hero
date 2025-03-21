
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SortPDFUpload from '@/components/sort-pdf/SortPDFUpload';
import SortPDFEditor from '@/components/sort-pdf/SortPDFEditor';
import SortPDFResults from '@/components/sort-pdf/SortPDFResults';
import useSortPDF from '@/hooks/useSortPDF';

const SortPDF = () => {
  const {
    file,
    setFile,
    isProcessing,
    sortedFile,
    progress,
    error,
    pageOrder,
    setPageOrder,
    totalPages,
    thumbnails,
    isGeneratingThumbnails,
    sortPages,
    movePageUp,
    movePageDown,
    resetPageOrder,
  } = useSortPDF();

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
  };

  return (
    <Layout>
      <Header />
      
      <div className="container py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Ordenar PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reorganiza las páginas de tu documento PDF. Arrastra y suelta para reordenar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {!file && !sortedFile && (
            <SortPDFUpload onFileSelected={handleFileChange} />
          )}

          {file && !sortedFile && (
            <SortPDFEditor
              file={file}
              pageOrder={pageOrder}
              setPageOrder={setPageOrder}
              thumbnails={thumbnails}
              isGeneratingThumbnails={isGeneratingThumbnails}
              movePageUp={movePageUp}
              movePageDown={movePageDown}
              totalPages={totalPages}
              onReset={resetPageOrder}
              onSort={sortPages}
              isProcessing={isProcessing}
            />
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {sortedFile && (
            <SortPDFResults
              file={sortedFile}
              onReset={() => {
                setFile(null);
                setPageOrder([]);
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SortPDF;
