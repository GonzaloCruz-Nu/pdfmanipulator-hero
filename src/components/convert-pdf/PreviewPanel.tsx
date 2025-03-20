
import React, { useState, useEffect } from 'react';
import { File, Scan, LockIcon } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfPreview from '@/components/PdfPreview';

// Configuramos el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PreviewPanelProps {
  file: File | null;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ file }) => {
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdfData = async () => {
      if (!file) {
        setPageCount(null);
        setFileSize(null);
        setIsEncrypted(false);
        setError(null);
        return;
      }

      try {
        // Actualizar tamaño del archivo
        const size = file.size;
        setFileSize(
          size > 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(2)} MB`
            : `${(size / 1024).toFixed(2)} KB`
        );

        // Cargar PDF para obtener metadatos
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        
        try {
          const pdfDoc = await loadingTask.promise;
          setPageCount(pdfDoc.numPages);
          
          // Verificar si está encriptado de forma segura
          const metadata = await pdfDoc.getMetadata();
          // Comprobar la propiedad IsEncrypted de forma segura
          setIsEncrypted(metadata && 
                         metadata.info && 
                         ('IsEncrypted' in metadata.info ? 
                          Boolean(metadata.info.IsEncrypted) : false));
          
          setError(null);
        } catch (pdfError) {
          // Error específico de PDF.js
          console.error("Error al cargar el PDF:", pdfError);
          if (pdfError instanceof Error && pdfError.message.includes("password")) {
            setIsEncrypted(true);
            setError("Este PDF está protegido con contraseña");
          } else {
            setError("Error al procesar el PDF. Podría estar dañado o no ser un PDF válido.");
          }
        }
      } catch (e) {
        console.error("Error al procesar el archivo:", e);
        setError("No se puede procesar este archivo");
      }
    };

    loadPdfData();
  }, [file]);

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl shadow-subtle p-6">
        <div className="text-center">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-3">
            <File className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Vista previa del PDF</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecciona un archivo PDF para visualizarlo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-xl shadow-subtle flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Vista previa</h2>
        <div className="flex flex-wrap gap-2 mt-2 text-sm">
          <span className="px-2 py-1 bg-naranja/10 text-naranja rounded-full">
            {pageCount} {pageCount === 1 ? "página" : "páginas"}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
            {fileSize}
          </span>
          {isEncrypted && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center">
              <LockIcon className="h-3 w-3 mr-1" /> Protegido
            </span>
          )}
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-500 flex items-center">
            <Scan className="h-3 w-3 mr-1" />
            {error}
          </div>
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        <PdfPreview file={file} />
      </div>
    </div>
  );
};

export default PreviewPanel;
