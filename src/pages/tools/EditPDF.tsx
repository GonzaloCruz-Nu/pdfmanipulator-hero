
import React, { useState } from 'react';
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
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  const {
    currentPage,
    totalPages,
    pageUrl,
    isLoading,
    error,
    nextPage,
    prevPage,
  } = usePdfRenderer(selectedFile);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedFile(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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
          <div 
            className="border-2 border-dashed border-border rounded-xl h-[400px] flex flex-col items-center justify-center p-6"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Selecciona o arrastra un PDF</h3>
            <p className="text-muted-foreground text-center mb-6">
              Arrastra y suelta un archivo PDF aquí o haz clic en el botón para seleccionarlo.
            </p>
            <label>
              <Input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="hidden"
              />
              <Button asChild>
                <span>Seleccionar PDF</span>
              </Button>
            </label>
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
                  <div className="space-y-4">
                    {activeTool === "addText" || activeTool === "editText" ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Texto:</label>
                          <Textarea placeholder="Escribe aquí..." />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Tamaño:</label>
                            <Input type="number" min="8" max="72" defaultValue="16" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Color:</label>
                            <Input type="color" defaultValue="#000000" />
                          </div>
                        </div>
                      </>
                    ) : activeTool === "pen" || activeTool === "rectangle" || activeTool === "circle" ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Grosor:</label>
                          <Input type="number" min="1" max="20" defaultValue="2" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Color:</label>
                          <Input type="color" defaultValue="#000000" />
                        </div>
                        {(activeTool === "rectangle" || activeTool === "circle") && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Color de relleno:</label>
                            <Input type="color" defaultValue="#ffffff" />
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
                
                <div className="p-3 border-t">
                  <Button className="w-full" disabled={!selectedFile}>
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
