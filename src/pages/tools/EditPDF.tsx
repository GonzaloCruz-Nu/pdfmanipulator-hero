
import React, { useState, useEffect } from 'react';
import { FileText, Upload } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/FileUpload';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import PdfViewerContent from '@/components/pdf/PdfViewerContent';
import PdfThumbnailList from '@/components/pdf/PdfThumbnailList';
import { toast } from 'sonner';

const EditPDF = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pageRenderedUrls, setPageRenderedUrls] = useState<string[]>([]);

  const {
    currentPage,
    totalPages,
    pageUrl,
    isLoading,
    error,
    nextPage,
    prevPage,
    renderPage,
    pdfDocument
  } = usePdfRenderer(selectedFile);

  // Load all page thumbnails after PDF is loaded
  useEffect(() => {
    const loadAllPageThumbnails = async () => {
      if (!pdfDocument || totalPages === 0) return;
      
      const pageUrls = [];
      
      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdfDocument.getPage(i);
          const viewport = page.getViewport({ scale: 0.2 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) continue;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          await page.render(renderContext).promise;
          
          pageUrls.push(canvas.toDataURL('image/jpeg', 0.7));
        } catch (error) {
          console.error(`Error rendering thumbnail for page ${i}:`, error);
        }
      }
      
      setPageRenderedUrls(pageUrls);
    };
    
    loadAllPageThumbnails();
  }, [pdfDocument, totalPages]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handlePageSelect = (pageNum: number) => {
    if (pdfDocument && pageNum >= 1 && pageNum <= totalPages) {
      renderPage(pdfDocument, pageNum);
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-6">
        <div className="mb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Visualizador de PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualiza tus documentos PDF directamente en tu navegador.
          </p>
        </div>

        {!selectedFile ? (
          <div className="border-2 border-dashed border-border rounded-xl h-[400px] flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Seleccionar PDF</h2>
                <p className="text-center text-muted-foreground">
                  Sube un archivo PDF para visualizarlo
                </p>
              </div>
              
              <FileUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
                accept=".pdf"
                maxFiles={1}
              />
            </div>
          </div>
        ) : (
          <div className="h-[700px] rounded-xl overflow-hidden border shadow-md flex flex-col bg-white">
            {/* Top toolbar */}
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  {showSidebar ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
                </Button>
              </div>
              
              <div className="flex-1 text-center">
                <h2 className="text-sm font-medium truncate max-w-lg mx-auto">
                  {selectedFile.name}
                </h2>
              </div>
              
              <div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFile(null)}
                >
                  Cambiar archivo
                </Button>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Thumbnails sidebar */}
              {showSidebar && (
                <div className="w-[150px] border-r shrink-0 overflow-y-auto">
                  <PdfThumbnailList 
                    pages={pageRenderedUrls}
                    currentPage={currentPage}
                    onPageSelect={handlePageSelect}
                  />
                </div>
              )}
              
              {/* PDF content */}
              <div className="flex-1 relative overflow-hidden">
                <PdfViewerContent
                  pageUrl={pageUrl}
                  isLoading={isLoading}
                  error={error}
                  fileName={selectedFile.name}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onNextPage={nextPage}
                  onPrevPage={prevPage}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Help section */}
      <div className="mt-6 bg-blue-50 p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-blue-700 mb-2">
          Visualizador de PDF
        </h2>
        <p className="text-blue-600">
          Este visualizador te permite ver tus documentos PDF directamente en el navegador.
          Puedes navegar entre páginas y ver miniaturas de todas las páginas.
        </p>
      </div>
    </Layout>
  );
};

export default EditPDF;
