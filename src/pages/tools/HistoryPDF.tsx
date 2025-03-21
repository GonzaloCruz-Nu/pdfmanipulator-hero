
import React from 'react';
import { motion } from 'framer-motion';
import { History, File, Trash, Clock, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import useRecentFiles from '@/hooks/useRecentFiles';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const HistoryPDF = () => {
  const { recentFiles, clearRecentFiles } = useRecentFiles();
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      return 'Fecha desconocida';
    }
  };
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Desconocido';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  const handleClearHistory = () => {
    clearRecentFiles();
    toast.success('Historial borrado correctamente');
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-8">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/10 p-3 rounded-full">
              <History className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Historial de PDFs</h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Accede a los documentos PDF que has procesado recientemente con nuestras herramientas.
          </p>
        </motion.div>

        <div className="bg-white dark:bg-card rounded-xl p-6 shadow-subtle">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Archivos recientes</h2>
            {recentFiles.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-destructive hover:text-destructive/90"
                onClick={handleClearHistory}
              >
                <Trash className="h-4 w-4 mr-2" />
                Borrar historial
              </Button>
            )}
          </div>
          
          {recentFiles.length > 0 ? (
            <div className="space-y-4">
              {recentFiles.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="bg-secondary/10 p-2 rounded-md mr-4">
                    <File className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{file.name}</h3>
                    <div className="flex text-xs text-muted-foreground">
                      <span className="flex items-center mr-4">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(file.date)}
                      </span>
                      {file.size && (
                        <span>{formatFileSize(file.size)}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {file.type}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay archivos recientes</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Aún no has procesado ningún archivo con nuestras herramientas. 
                Cuando lo hagas, aparecerán aquí para un acceso rápido.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HistoryPDF;
