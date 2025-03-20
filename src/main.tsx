
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure the PDF.js worker is properly configured
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Añadir logs para depuración
console.log('PDF.js worker configurado:', pdfjsLib.GlobalWorkerOptions.workerSrc);
console.log('Versión de PDF.js:', pdfjsLib.version);

createRoot(document.getElementById("root")!).render(<App />);
