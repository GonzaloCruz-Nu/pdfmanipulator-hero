
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure the PDF.js worker is properly configured
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

createRoot(document.getElementById("root")!).render(<App />);
