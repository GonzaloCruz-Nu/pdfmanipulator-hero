
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure the PDF.js worker is properly configured with error handling
import * as pdfjsLib from 'pdfjs-dist';
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  console.log('PDF.js worker configurado correctamente:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  console.log('Versión de PDF.js:', pdfjsLib.version);
} catch (error) {
  console.error('Error al configurar PDF.js worker:', error);
}

// Add error boundary to catch rendering errors
try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    console.log('Elemento root encontrado, iniciando renderizado');
    createRoot(rootElement).render(<App />);
  } else {
    console.error('ELEMENTO ROOT NO ENCONTRADO');
  }
} catch (error) {
  console.error('Error al renderizar la aplicación:', error);
}
