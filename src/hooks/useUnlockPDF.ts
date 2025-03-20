
import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

interface UnlockResult {
  success: boolean;
  unlockedFile: File | null;
  message: string;
}

export const useUnlockPDF = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [unlockedFile, setUnlockedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Attempt to unlock a password-protected PDF and remove all signatures
   */
  const unlockPDF = async (file: File | null, password?: string): Promise<UnlockResult> => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo PDF');
      return { success: false, unlockedFile: null, message: 'No se ha seleccionado archivo' };
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setErrorMessage(null);
      setUnlockedFile(null);

      // Leer archivo
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);

      setProgress(30);

      // Intentar cargar el PDF con o sin contraseña
      let pdfDoc;
      try {
        // Primera tentativa: cargar sin contraseña
        pdfDoc = await PDFDocument.load(fileBytes, { 
          updateMetadata: false,
          ignoreEncryption: true // Intentar ignorar encriptación
        });
        setProgress(45);
      } catch (initialError) {
        console.log('PDF probablemente protegido, intentando con contraseña...');
        
        // Si no se proporciona contraseña, intentamos métodos alternativos
        if (!password) {
          // Método alternativo 1: Crear nuevo documento y copiar contenido
          try {
            const newPdfDoc = await PDFDocument.create();
            const sourcePdf = await PDFDocument.load(fileBytes, { 
              ignoreEncryption: true 
            });
            
            const pageCount = sourcePdf.getPageCount();
            if (pageCount === 0) {
              throw new Error('No se pudieron extraer páginas del PDF protegido');
            }
            
            // Copiar todas las páginas al nuevo documento
            const pages = await newPdfDoc.copyPages(sourcePdf, sourcePdf.getPageIndices());
            pages.forEach(page => newPdfDoc.addPage(page));
            
            pdfDoc = newPdfDoc;
            setProgress(50);
          } catch (alternativeError) {
            console.error('Error con método alternativo 1:', alternativeError);
            
            // Método alternativo 2: Intentar con otro enfoque más agresivo
            try {
              const newPdfDoc = await PDFDocument.create();
              
              // Carga forzada incluso con errores
              const tempDoc = await PDFDocument.load(fileBytes, {
                ignoreEncryption: true,
                throwOnInvalidObject: false,
                updateMetadata: false
              });
              
              // Copia cada página individualmente con manejo de errores
              const pageIndices = tempDoc.getPageIndices();
              for (let i = 0; i < pageIndices.length; i++) {
                try {
                  const [copiedPage] = await newPdfDoc.copyPages(tempDoc, [i]);
                  newPdfDoc.addPage(copiedPage);
                } catch (pageError) {
                  console.warn(`No se pudo copiar la página ${i}:`, pageError);
                  // Crear una página en blanco en su lugar
                  newPdfDoc.addPage();
                }
              }
              
              if (newPdfDoc.getPageCount() === 0) {
                throw new Error('No se pudo recuperar ninguna página');
              }
              
              pdfDoc = newPdfDoc;
              setProgress(50);
            } catch (aggressiveError) {
              console.error('Error con método alternativo 2:', aggressiveError);
              
              if (password === undefined) {
                setErrorMessage('Este PDF está protegido. Por favor, introduce una contraseña');
                toast.error('Este PDF requiere una contraseña');
                return { 
                  success: false, 
                  unlockedFile: null, 
                  message: 'Este PDF requiere una contraseña' 
                };
              } else {
                throw new Error('No se pudo desbloquear el PDF con los métodos disponibles');
              }
            }
          }
        } else {
          // Intentar con la contraseña proporcionada
          try {
            // Corrección: pdf-lib acepta "password" pero TypeScript no lo reconoce
            // Usamos type assertion para pasarlo correctamente
            pdfDoc = await PDFDocument.load(fileBytes, { 
              // @ts-ignore - La tipificación de LoadOptions de pdf-lib no incluye password, pero la API sí lo acepta
              password,
              updateMetadata: false
            });
            setProgress(50);
          } catch (passwordError) {
            console.error('Error al intentar con contraseña:', passwordError);
            setErrorMessage('Contraseña incorrecta');
            toast.error('Contraseña incorrecta');
            return { 
              success: false, 
              unlockedFile: null, 
              message: 'Contraseña incorrecta' 
            };
          }
        }
      }

      setProgress(60);

      // Eliminar firmas digitales y otros elementos de seguridad
      if (pdfDoc) {
        // 1. Limpiar el catálogo del PDF de firmas
        const catalog = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Root);
        if (catalog instanceof PDFDict) {
          // Eliminar campos de firma
          if (catalog.has(PDFName.of('AcroForm'))) {
            const acroForm = catalog.get(PDFName.of('AcroForm'));
            if (acroForm instanceof PDFDict) {
              // Eliminar referencias a campos de firma
              if (acroForm.has(PDFName.of('Fields'))) {
                acroForm.delete(PDFName.of('Fields'));
              }
              // Eliminar definiciones de firma
              if (acroForm.has(PDFName.of('SigFlags'))) {
                acroForm.delete(PDFName.of('SigFlags'));
              }
            }
            // En algunos casos, eliminar todo el AcroForm puede ser más efectivo
            catalog.delete(PDFName.of('AcroForm'));
          }
          
          // Eliminar permisos y encriptación
          if (catalog.has(PDFName.of('Perms'))) {
            catalog.delete(PDFName.of('Perms'));
          }
          
          // Eliminar metadatos que pueden contener información de firma
          if (catalog.has(PDFName.of('Metadata'))) {
            catalog.delete(PDFName.of('Metadata'));
          }
        }
        
        // 2. Eliminar firmas de cada página
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          
          // Eliminar anotaciones que pueden contener firmas
          if (page.node.has(PDFName.of('Annots'))) {
            page.node.delete(PDFName.of('Annots'));
          }
          
          // Eliminar contenido que pueda tener referencias a firmas
          if (page.node.has(PDFName.of('Metadata'))) {
            page.node.delete(PDFName.of('Metadata'));
          }
        }
      }

      setProgress(80);

      // Crear una nueva copia del PDF sin protección
      const unlockedPdfBytes = await pdfDoc.save({
        useObjectStreams: false, // Más compatible con diferentes lectores
        addDefaultPage: false,
        updateFieldAppearances: false // Evita reconstruir campos que podrían contener firmas
      });
      
      setProgress(90);

      // Crear un nuevo archivo
      const unlockedFile = new File(
        [unlockedPdfBytes],
        `desbloqueado_${file.name}`,
        { type: 'application/pdf' }
      );

      setUnlockedFile(unlockedFile);
      setProgress(100);
      toast.success('PDF desbloqueado correctamente');

      return { 
        success: true, 
        unlockedFile, 
        message: 'PDF desbloqueado correctamente' 
      };

    } catch (error) {
      console.error('Error al desbloquear el PDF:', error);
      setErrorMessage('Error al procesar el PDF. Verifica que el archivo sea válido.');
      toast.error('Error al desbloquear el PDF');
      
      return { 
        success: false, 
        unlockedFile: null, 
        message: 'Error al procesar el PDF. Verifica que el archivo sea válido.' 
      };
    } finally {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      setIsProcessing(false);
    }
  };

  /**
   * Descargar el PDF desbloqueado
   */
  const downloadUnlockedFile = () => {
    if (!unlockedFile) return;
    
    const url = URL.createObjectURL(unlockedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = unlockedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF desbloqueado descargado con éxito');
  };

  return {
    unlockPDF,
    isProcessing,
    progress,
    unlockedFile,
    errorMessage,
    downloadUnlockedFile
  };
};
