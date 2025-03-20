
import React, { useState, useEffect } from 'react';
import { PanelRightOpen, FileText, Pen, Text, ImageIcon, Square, Circle, Eraser, Save } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { usePdfRenderer } from '@/hooks/usePdfRenderer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import PdfViewerContent from '@/components/pdf/PdfViewerContent';
import PdfControls from '@/components/pdf/PdfControls';
import FileUpload from '@/components/FileUpload';
import { usePdfAnnotations } from '@/hooks/usePdfAnnotations';
import { toast } from 'sonner';

interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon: Icon, label, active = false, onClick }) => (
  <Button
    variant="ghost"
    size="sm"
    className={cn(
      "flex flex-col items-center justify-center h-16 w-16 gap-1 rounded-lg p-2",
      active && "bg-secondary text-secondary-foreground"
    )}
    onClick={onClick}
  >
    <Icon className="h-5 w-5" />
    <span className="text-xs">{label}</span>
  </Button>
);

const EditPDF = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>("text");
  const [activeTool, setActiveTool] = useState<string>("select");
  const [fullscreen, setFullscreen] = useState(false);
  
  // Estado para las propiedades de las herramientas
  const [textFontSize, setTextFontSize] = useState<number>(16);
  const [textColor, setTextColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [fillColor, setFillColor] = useState<string>("#ffffff");

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
    pdfDocument
  } = usePdfRenderer(selectedFile);

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

  const renderToolbar = () => {
    switch (activeTab) {
      case "text":
        return (
          <div className="flex flex-wrap gap-2 p-2">
            <ToolButton 
              icon={Pen} 
              label="Añadir Texto" 
              active={activeTool === "addText"}
              onClick={() => setActiveTool("addText")}
            />
            <ToolButton 
              icon={Text} 
              label="Editar Texto" 
              active={activeTool === "editText"}
              onClick={() => setActiveTool("editText")}
            />
            <ToolButton 
              icon={Eraser} 
              label="Borrar" 
              active={activeTool === "erase"}
              onClick={() => setActiveTool("erase")}
            />
          </div>
        );
      case "draw":
        return (
          <div className="flex flex-wrap gap-2 p-2">
            <ToolButton 
              icon={Pen} 
              label="Lápiz" 
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
              icon={Eraser} 
              label="Borrar" 
              active={activeTool === "erase"}
              onClick={() => setActiveTool("erase")}
            />
          </div>
        );
      case "image":
        return (
          <div className="flex flex-wrap gap-2 p-2">
            <ToolButton 
              icon={ImageIcon} 
              label="Añadir Imagen" 
              active={activeTool === "addImage"}
              onClick={() => setActiveTool("addImage")}
            />
            <ToolButton 
              icon={Eraser} 
              label="Borrar" 
              active={activeTool === "erase"}
              onClick={() => setActiveTool("erase")}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderPropertyPanel = () => {
    switch (activeTool) {
      case "addText":
      case "editText":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tamaño de fuente:</label>
              <Input 
                type="number" 
                min="8" 
                max="72" 
                value={textFontSize} 
                onChange={(e) => setTextFontSize(parseInt(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color de texto:</label>
              <Input 
                type="color" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)} 
              />
            </div>
          </div>
        );
      case "pen":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grosor:</label>
              <Input 
                type="number" 
                min="1" 
                max="20" 
                value={strokeWidth} 
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color:</label>
              <Input 
                type="color" 
                value={strokeColor} 
                onChange={(e) => setStrokeColor(e.target.value)} 
              />
            </div>
          </div>
        );
      case "rectangle":
      case "circle":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grosor de borde:</label>
              <Input 
                type="number" 
                min="1" 
                max="20" 
                value={strokeWidth} 
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color de borde:</label>
              <Input 
                type="color" 
                value={strokeColor} 
                onChange={(e) => setStrokeColor(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color de relleno:</label>
              <Input 
                type="color" 
                value={fillColor} 
                onChange={(e) => setFillColor(e.target.value)} 
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            Selecciona una herramienta para ver sus propiedades
          </div>
        );
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-8">
        <div className="mb-8 text-center">
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
          <ResizablePanelGroup 
            direction="horizontal" 
            className="min-h-[600px] border rounded-xl overflow-hidden bg-white shadow-subtle"
          >
            <ResizablePanel defaultSize={80} minSize={50}>
              <div className="h-full flex flex-col">
                <div className="border-b p-2">
                  <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="text">Texto</TabsTrigger>
                      <TabsTrigger value="draw">Dibujo</TabsTrigger>
                      <TabsTrigger value="image">Imágenes</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="border-b">
                  {renderToolbar()}
                </div>

                <div className="relative flex-grow overflow-hidden">
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
                  <PdfControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    isFullscreen={fullscreen}
                    isLoading={isLoading}
                    onPrevPage={prevPage}
                    onNextPage={nextPage}
                    onToggleFullscreen={() => setFullscreen(!fullscreen)}
                    fileName={selectedFile.name}
                  />
                </div>
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={20} minSize={15}>
              <div className="h-full flex flex-col border-l">
                <div className="p-3 border-b font-medium flex items-center">
                  <PanelRightOpen className="h-4 w-4 mr-2" />
                  <span>Propiedades</span>
                </div>
                
                <div className="p-4 overflow-y-auto flex-grow">
                  {renderPropertyPanel()}
                </div>
                
                <div className="p-3 border-t">
                  <Button className="w-full" onClick={handleSavePdf} disabled={!selectedFile}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar PDF
                  </Button>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </Layout>
  );
};

export default EditPDF;
