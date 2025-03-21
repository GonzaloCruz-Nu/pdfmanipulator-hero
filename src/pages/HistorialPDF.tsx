
import React from 'react';
import { motion } from 'framer-motion';
import { History, Trash2, Download, FilePlus, FileSearch } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePdfHistory, PdfHistoryItem } from '@/hooks/usePdfHistory';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const HistorialPDF = () => {
  const { history, removeFromHistory, clearHistory } = usePdfHistory();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: es
    });
  };

  if (history.length === 0) {
    return (
      <Layout>
        <Header />
        <div className="container py-8 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Historial PDF</h1>
            <p className="text-muted-foreground">
              Aquí podrás ver un registro de los PDFs que has procesado recientemente.
            </p>
          </div>
          
          <Card className="border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
              <FileSearch className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No hay historial</h3>
              <p className="text-muted-foreground text-center mb-4">
                No tienes ningún PDF procesado recientemente.
                Cuando uses nuestras herramientas, aparecerán aquí.
              </p>
              <Button variant="outline" asChild>
                <a href="/">Ir a herramientas</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header />
      
      <div className="container py-8 max-w-6xl mx-auto">
        <motion.div 
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <History className="mr-3 h-8 w-8 text-primary" />
              Historial PDF
            </h1>
            <p className="text-muted-foreground">
              PDF procesados recientemente ({history.length})
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={clearHistory}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar historial
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => (
            <HistoryCard 
              key={item.id} 
              item={item} 
              onRemove={() => removeFromHistory(item.id)}
              formatFileSize={formatFileSize}
              formatTimestamp={formatTimestamp}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

interface HistoryCardProps {
  item: PdfHistoryItem;
  onRemove: () => void;
  formatFileSize: (bytes: number) => string;
  formatTimestamp: (timestamp: number) => string;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ 
  item, 
  onRemove,
  formatFileSize,
  formatTimestamp
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full overflow-hidden">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="truncate max-w-[80%]">
              <h3 className="font-medium text-foreground truncate" title={item.fileName}>
                {item.fileName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(item.fileSize)} • {formatTimestamp(item.timestamp)}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar</span>
            </Button>
          </div>
          
          <div className="bg-muted p-3 rounded-md mb-3 flex items-center">
            <span className="text-xs font-medium">
              Herramienta: {item.tool}
            </span>
          </div>
          
          {item.thumbnail ? (
            <div className="aspect-[4/3] mb-3 bg-muted rounded-md overflow-hidden">
              <img 
                src={item.thumbnail} 
                alt={item.fileName} 
                className="w-full h-full object-contain" 
              />
            </div>
          ) : (
            <div className="aspect-[4/3] mb-3 bg-muted/50 rounded-md flex items-center justify-center">
              <FilePlus className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          
          <Button variant="outline" className="w-full" disabled>
            <Download className="mr-2 h-4 w-4" />
            Acceder al archivo
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HistorialPDF;
