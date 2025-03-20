
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PdfPreview from '@/components/PdfPreview';
import { FileWarning, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PreviewPanelProps {
  file: File | null;
}

interface PdfDetails {
  numPages: number;
  hasText: boolean;
  isEncrypted: boolean;
  hasImages: boolean;
  textCharacters: number;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ file }) => {
  const [pdfDetails, setPdfDetails] = useState<PdfDetails | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPdfDetails(null);
      setError(null);
      return;
    }

    const analyzePdf = async () => {
      try {
        setIsAnalyzing(true);
        setError(null);

        const arrayBuffer = await file.arrayBuffer();
        const pdfData = new Uint8Array(arrayBuffer);
        
        const loadingTask = pdfjsLib.getDocument({
          data: pdfData,
          disableFontFace: false,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/',
          cMapPacked: true,
          useSystemFonts: true,
        });
        
        const pdf = await loadingTask.promise;
        console.log(`PDF analysis: Document has ${pdf.numPages} pages`);
        
        let isEncrypted = false;
        try {
          const metadata = await pdf.getMetadata();
          isEncrypted = Boolean(
            metadata?.info && 'IsEncrypted' in metadata.info && metadata.info['IsEncrypted']
          );
          
          if (!isEncrypted && metadata?.metadata) {
            try {
              const encryptedValue = metadata.metadata.get('IsEncrypted');
              isEncrypted = encryptedValue === 'true';
            } catch (metadataErr) {
              console.warn('Error accessing metadata value:', metadataErr);
            }
          }
        } catch (err) {
          console.warn('Could not check encryption status:', err);
          isEncrypted = false;
        }
        
        let totalTextCharacters = 0;
        let hasImages = false;
        
        const pagesToAnalyze = Math.min(5, pdf.numPages);
        
        for (let i = 1; i <= pagesToAnalyze; i++) {
          const page = await pdf.getPage(i);
          
          const textContent = await page.getTextContent({
            includeMarkedContent: true,
          });
          
          totalTextCharacters += textContent.items.reduce(
            (sum, item) => sum + (('str' in item) ? item.str.length : 0), 
            0
          );
          
          if (!hasImages) {
            try {
              const opList = await page.getOperatorList();
              hasImages = opList.fnArray.some(op => op === pdfjsLib.OPS.paintImageXObject);
            } catch (err) {
              console.warn(`Error checking for images on page ${i}:`, err);
            }
          }
        }
        
        const estimatedTotalText = Math.round(totalTextCharacters * (pdf.numPages / pagesToAnalyze));
        
        setPdfDetails({
          numPages: pdf.numPages,
          hasText: totalTextCharacters > 0,
          isEncrypted,
          hasImages,
          textCharacters: estimatedTotalText
        });
        
        console.log('PDF analysis complete:', {
          numPages: pdf.numPages,
          hasText: totalTextCharacters > 0,
          isEncrypted,
          hasImages,
          estimatedTextCharacters: estimatedTotalText
        });
      } catch (err) {
        console.error('Error analyzing PDF:', err);
        setError('Error al analizar el PDF. El archivo puede estar dañado o protegido con contraseña.');
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzePdf();
  }, [file]);

  const getConversionDifficultyInfo = () => {
    if (!pdfDetails) return null;
    
    const { numPages, hasText, isEncrypted, hasImages, textCharacters } = pdfDetails;
    
    if (isEncrypted) {
      return {
        level: 'high',
        message: 'Este PDF está cifrado o protegido con contraseña. La conversión puede estar limitada o no ser posible.'
      };
    }
    
    if (!hasText && hasImages) {
      return {
        level: 'high',
        message: 'Este PDF parece ser escaneado o basado en imágenes sin texto extraíble. Puede requerir OCR.'
      };
    }
    
    if (textCharacters < 100 && numPages > 1) {
      return {
        level: 'high',
        message: 'Este PDF contiene muy poco texto extraíble. Puede ser principalmente imágenes o gráficos.'
      };
    }
    
    if (textCharacters / numPages < 200 && hasImages) {
      return {
        level: 'medium',
        message: 'Este PDF contiene contenido mixto con imágenes y algo de texto. La conversión puede estar incompleta.'
      };
    }
    
    if (numPages > 50) {
      return {
        level: 'medium',
        message: 'Este es un PDF grande. El proceso de conversión puede tardar más.'
      };
    }
    
    return {
      level: 'low',
      message: 'Este PDF parece contener principalmente texto. La conversión debería funcionar bien.'
    };
  };

  const difficultyInfo = pdfDetails ? getConversionDifficultyInfo() : null;
  
  const getDifficultyClass = (level: string | undefined) => {
    switch (level) {
      case 'high':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-green-500 bg-green-50 border-green-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-subtle p-6"
    >
      <h2 className="text-xl font-semibold mb-4">Vista previa</h2>
      {file ? (
        <>
          <PdfPreview file={file} />
          
          {isAnalyzing && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-naranja border-t-transparent"></div>
              Analizando estructura del PDF...
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 flex items-start">
              <FileWarning className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}
          
          {pdfDetails && !isAnalyzing && !error && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground">
                  {pdfDetails.numPages} {pdfDetails.numPages === 1 ? 'página' : 'páginas'}
                </span>
                
                {pdfDetails.isEncrypted && (
                  <span className="px-2 py-1 rounded-full bg-red-50 text-red-500">
                    Cifrado
                  </span>
                )}
                
                {pdfDetails.hasImages && (
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-500">
                    Contiene imágenes
                  </span>
                )}
                
                <span className="px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground">
                  ~{pdfDetails.textCharacters.toLocaleString()} caracteres
                </span>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Estos detalles ayudan a estimar qué tan bien se convertirá el PDF a formato Word.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {difficultyInfo && (
                <div className={`p-3 rounded-md border text-sm flex items-start ${getDifficultyClass(difficultyInfo.level)}`}>
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <div>{difficultyInfo.message}</div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-80 bg-secondary/30 rounded-lg">
          <p className="text-muted-foreground">
            Selecciona un PDF para ver la vista previa
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PreviewPanel;
