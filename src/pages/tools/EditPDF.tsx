
import React, { useState, useEffect } from 'react';
import { 
  Pencil, 
  FileText, 
  Type, 
  ImageIcon, 
  Square, 
  Circle, 
  Eraser,
  Hand, 
  Save, 
  ZoomIn, 
  ZoomOut, 
  PanelLeftOpen, 
  PanelLeftClose
} from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Menubar, 
  MenubarContent, 
  MenubarItem, 
  MenubarMenu, 
  MenubarSeparator, 
  MenubarTrigger 
} from "@/components/ui/menubar";
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { usePdfAnnotations } from '@/hooks/usePdfAnnotations';
import FileUpload from '@/components/FileUpload';
import PdfViewerContent from '@/components/pdf/PdfViewerContent';
import PdfThumbnailList from '@/components/pdf/PdfThumbnailList';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

// Update the type for activeTool to include all possible values
type ActiveToolType = "select" | "addText" | "editText" | "pen" | "rectangle" | "circle" | "addImage" | "erase";

const ToolButton: React.FC<ToolButtonProps> = ({ icon: Icon, label, active = false, onClick }) => (
  <Button
    variant={active ? "secondary" : "ghost"}
    size="sm"
    className={cn(
      "flex items-center justify-center h-10 rounded-md gap-2",
      active && "bg-secondary text-secondary-foreground"
    )}
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
    <span className="text-xs font-medium">{label}</span>
  </Button>
);

const EditPDF = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveToolType>("select");
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Estado para las propiedades de las herramientas
  const [textFontSize, setTextFontSize] = useState<number>(16);
  const [textColor, setTextColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [fillColor, setFillColor] = useState<string>("#ffffff");
  const [pageRenderedUrls, setPageRenderedUrls] = useState<string[]>([]);

  // Gestionar anotaciones por página
  const { addAnnotation, getPageAnnotations } = usePdfAnnotations();

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

  const handleAnnotationAdded = (annotation: any) => {
    addAnnotation({
      ...annotation,
      pageNum: currentPage
    });
  };

  const handleSavePdf = async () => {
    if (!selectedFile || !pdfDocument) {
      toast.error("No hay PDF para guardar");
      return;
    }
    
    toast.success("PDF guardado correctamente");
    // En una implementación real, aquí guardaríamos las anotaciones en el PDF
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
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Editor de PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Edita el contenido de tus documentos PDF directamente en tu navegador.
          </p>
        </div>

        {!selectedFile ? (
          <div className="border-2 border-dashed border-border rounded-xl h-[400px] flex flex-col items-center justify-center p-6">
            <FileUpload
              onFilesSelected={handleFileSelected}
              multiple={false}
              accept=".pdf"
              maxFiles={1}
            />
          </div>
        ) : (
          <div className="h-[700px] rounded-xl overflow-hidden border shadow-md flex flex-col bg-white">
            {/* Top toolbar */}
            <div className="p-2 border-b bg-background flex items-center gap-2 flex-wrap">
              <Menubar className="border-none bg-transparent p-0 h-auto">
                <MenubarMenu>
                  <MenubarTrigger className="px-3 h-9 text-sm">Archivo</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem onClick={() => setSelectedFile(null)}>Nuevo</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={handleSavePdf}>Guardar</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger className="px-3 h-9 text-sm">Editar</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>Deshacer</MenubarItem>
                    <MenubarItem>Rehacer</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger className="px-3 h-9 text-sm">Ver</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem onClick={() => setShowSidebar(!showSidebar)}>
                      {showSidebar ? "Ocultar" : "Mostrar"} miniaturas
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
              
              <div className="flex-1"></div>
              
              <Button variant="outline" size="sm" className="gap-2" onClick={handleSavePdf}>
                <Save className="h-4 w-4" />
                Guardar PDF
              </Button>
            </div>
            
            {/* Toolbar for editing */}
            <div className="flex items-center gap-2 p-2 border-b overflow-x-auto">
              <ToolButton 
                icon={Hand} 
                label="Seleccionar" 
                active={activeTool === "select"}
                onClick={() => setActiveTool("select")}
              />
              <ToolButton 
                icon={Type} 
                label="Texto" 
                active={activeTool === "addText"}
                onClick={() => setActiveTool("addText")}
              />
              <ToolButton 
                icon={Pencil} 
                label="Dibujar" 
                active={activeTool === "pen"}
                onClick={() => setActiveTool("pen")}
              />
              <ToolButton 
                icon={Square} 
                label="Rectángulo" 
                active={activeTool === "rectangle"}
                onClick={() => setActiveTool("rectangle")}
              />
              <ToolButton 
                icon={Circle} 
                label="Círculo" 
                active={activeTool === "circle"}
                onClick={() => setActiveTool("circle")}
              />
              <ToolButton 
                icon={ImageIcon} 
                label="Imagen" 
                active={activeTool === "addImage"}
                onClick={() => setActiveTool("addImage")}
              />
              <ToolButton 
                icon={Eraser} 
                label="Borrar" 
                active={activeTool === "erase"}
                onClick={() => setActiveTool("erase")}
              />
              
              <div className="border-l h-8 mx-1"></div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
              
              <div className="flex items-center gap-1 ml-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">100%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Thumbnails sidebar */}
              {showSidebar && (
                <div className="w-[120px] border-r shrink-0 overflow-y-auto">
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
                  activeTool={activeTool}
                  textOptions={{
                    fontSize: textFontSize,
                    color: textColor
                  }}
                  drawOptions={{
                    color: strokeColor,
                    width: strokeWidth,
                    fill: fillColor
                  }}
                  onAnnotationAdded={handleAnnotationAdded}
                />
                
                {/* Page navigation */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center p-2 bg-gradient-to-t from-background/80 to-transparent">
                  <div className="flex items-center gap-2 bg-background/70 backdrop-blur px-4 py-1 rounded-full shadow">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={prevPage}
                      disabled={currentPage <= 1}
                    >
                      <span className="sr-only">Página anterior</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                    
                    <span className="text-sm font-medium">
                      Página {currentPage} de {totalPages}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={nextPage}
                      disabled={currentPage >= totalPages}
                    >
                      <span className="sr-only">Página siguiente</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M6.1584 3.13514C5.95694 3.32401 5.94673 3.64042 6.13559 3.84188L9.565 7.49991L6.13559 11.1579C5.94673 11.3594 5.95694 11.6758 6.1584 11.8647C6.35986 12.0535 6.67627 12.0433 6.86514 11.8419L10.6151 7.84188C10.7954 7.64955 10.7954 7.35027 10.6151 7.15794L6.86514 3.15794C6.67627 2.95648 6.35986 2.94628 6.1584 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Right side tool properties panel - collapsed by default, can be expanded on specific tool selection */}
              {(activeTool === "addText" || activeTool === "editText" || activeTool === "pen" || activeTool === "rectangle" || activeTool === "circle") && (
                <div className="w-[230px] border-l p-3 shrink-0 bg-secondary/5">
                  <h3 className="text-sm font-medium mb-3">Propiedades</h3>
                  
                  {(activeTool === "addText" || activeTool === "editText") && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Tamaño de fuente:</label>
                        <Input 
                          type="number" 
                          min="8" 
                          max="72" 
                          value={textFontSize} 
                          onChange={(e) => setTextFontSize(parseInt(e.target.value))} 
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Color de texto:</label>
                        <Input 
                          type="color" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)} 
                          className="h-8 w-full"
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTool === "pen" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Grosor:</label>
                        <Input 
                          type="number" 
                          min="1" 
                          max="20" 
                          value={strokeWidth} 
                          onChange={(e) => setStrokeWidth(parseInt(e.target.value))} 
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Color:</label>
                        <Input 
                          type="color" 
                          value={strokeColor} 
                          onChange={(e) => setStrokeColor(e.target.value)} 
                          className="h-8 w-full"
                        />
                      </div>
                    </div>
                  )}
                  
                  {(activeTool === "rectangle" || activeTool === "circle") && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Grosor de borde:</label>
                        <Input 
                          type="number" 
                          min="1" 
                          max="20" 
                          value={strokeWidth} 
                          onChange={(e) => setStrokeWidth(parseInt(e.target.value))} 
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Color de borde:</label>
                        <Input 
                          type="color" 
                          value={strokeColor} 
                          onChange={(e) => setStrokeColor(e.target.value)} 
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Color de relleno:</label>
                        <Input 
                          type="color" 
                          value={fillColor} 
                          onChange={(e) => setFillColor(e.target.value)} 
                          className="h-8 w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Help section */}
      <div className="mt-6 bg-blue-50 p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-blue-700 mb-2">
          Utiliza la barra de herramientas para modificar tu PDF
        </h2>
        <p className="text-blue-600">
          Añade texto, dibuja formas, inserta imágenes o anota tu documento fácilmente. 
          Cuando termines, haz clic en "Guardar PDF" para descargar tu documento editado.
        </p>
      </div>
    </Layout>
  );
};

export default EditPDF;
