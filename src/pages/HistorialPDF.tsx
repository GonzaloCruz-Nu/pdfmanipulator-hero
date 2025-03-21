
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const HistorialPDF = () => {
  return (
    <Layout>
      <Header />
      
      <div className="container py-12 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Historial PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Accede a tus PDFs procesados recientemente
          </p>
        </div>

        <Card className="border-amber-200 dark:border-amber-800 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-3 text-amber-600 dark:text-amber-400 mb-4">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-medium mb-2">Herramienta en desarrollo</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-lg">
              El historial de PDFs está actualmente en desarrollo y no se encuentra disponible.
              Estamos trabajando para implementarlo lo antes posible.
            </p>
            <Button variant="outline" asChild>
              <a href="/">Volver a herramientas</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HistorialPDF;
