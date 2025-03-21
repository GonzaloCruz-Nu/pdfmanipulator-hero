
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Tools from "./pages/Tools";
import About from "./pages/About";
import Wiki from "./pages/Wiki";
import MergePDF from "./pages/tools/MergePDF";
import SplitPDF from "./pages/tools/SplitPDF";
import CompressPDF from "./pages/tools/CompressPDF";
import UnlockPDF from "./pages/tools/UnlockPDF";
import EditPDF from "./pages/tools/EditPDF";
import ConvertPDF from "./pages/tools/ConvertPDF";
import NotFound from "./pages/NotFound";
import CompressPDFGuide from "./pages/wiki/CompressPDFGuide";
import MergePDFGuide from "./pages/wiki/MergePDFGuide";
import SplitPDFGuide from "./pages/wiki/SplitPDFGuide";
import UnlockPDFGuide from "./pages/wiki/UnlockPDFGuide";
import ConvertPDFGuide from "./pages/wiki/ConvertPDFGuide";
import { useEffect } from "react";

// Create a new QueryClient instance with retry settings to avoid infinite error loops
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Log navigation for debugging
const RouteLogger = () => {
  useEffect(() => {
    console.log('Aplicación iniciada, navegación activa');
    return () => {
      console.log('Navegación terminada');
    };
  }, []);
  
  return null;
};

const App = () => {
  console.log('App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteLogger />
          <Routes>
            <Route path="/" element={<Tools />} />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/wiki/compress" element={<CompressPDFGuide />} />
            <Route path="/wiki/merge" element={<MergePDFGuide />} />
            <Route path="/wiki/split" element={<SplitPDFGuide />} />
            <Route path="/wiki/unlock" element={<UnlockPDFGuide />} />
            <Route path="/wiki/convert" element={<ConvertPDFGuide />} />
            <Route path="/about" element={<About />} />
            <Route path="/tools/merge" element={<MergePDF />} />
            <Route path="/tools/split" element={<SplitPDF />} />
            <Route path="/tools/compress" element={<CompressPDF />} />
            <Route path="/tools/unlock" element={<UnlockPDF />} />
            <Route path="/tools/edit" element={<EditPDF />} />
            <Route path="/tools/ocr" element={<ConvertPDF />} />
            <Route path="/tools/convert" element={<ConvertPDF />} />
            <Route path="/tools/protect" element={<UnlockPDF />} />
            {/* Ruta catchall para páginas no encontradas */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
