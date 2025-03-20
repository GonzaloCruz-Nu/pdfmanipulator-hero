
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
import ConvertPDF from "./pages/tools/ConvertPDF";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/about" element={<About />} />
          <Route path="/tools/merge" element={<MergePDF />} />
          <Route path="/tools/split" element={<SplitPDF />} />
          <Route path="/tools/compress" element={<CompressPDF />} />
          <Route path="/tools/unlock" element={<UnlockPDF />} />
          <Route path="/tools/convert" element={<ConvertPDF />} />
          {/* Ruta de redirección para /convert (por si alguien accede directamente) */}
          <Route path="/convert" element={<Navigate to="/tools/convert" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
