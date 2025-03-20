
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import About from "./pages/About";
import MergePDF from "./pages/tools/MergePDF";
import SplitPDF from "./pages/tools/SplitPDF";
import CompressPDF from "./pages/tools/CompressPDF";
import UnlockPDF from "./pages/tools/UnlockPDF";
import EditPDF from "./pages/tools/EditPDF";
import NotFound from "./pages/NotFound";
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
            <Route path="/" element={<Index />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/about" element={<About />} />
            <Route path="/tools/merge" element={<MergePDF />} />
            <Route path="/tools/split" element={<SplitPDF />} />
            <Route path="/tools/compress" element={<CompressPDF />} />
            <Route path="/tools/unlock" element={<UnlockPDF />} />
            <Route path="/tools/edit" element={<EditPDF />} />
            {/* Ruta catchall para páginas no encontradas */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
