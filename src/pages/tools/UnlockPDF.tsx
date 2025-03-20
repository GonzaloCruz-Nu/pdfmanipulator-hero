
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileLock, File, Download, Lock, Unlock } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnlockPDF } from '@/hooks/useUnlockPDF';
import PdfPreview from '@/components/PdfPreview';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

const UnlockPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  
  const {
    unlockPDF,
    isProcessing,
    progress,
    unlockedFile,
    errorMessage,
    downloadUnlockedFile
  } = useUnlockPDF();

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setNeedsPassword(false); // Reset password flag on new file
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    
    // Try unlocking without password first
    if (!needsPassword) {
      const result = await unlockPDF(file);
      
      // If we need a password, let the user know
      if (!result.success && result.message.includes('requiere una contraseña')) {
        setNeedsPassword(true);
      }
    } else {
      // Use password if needed
      await unlockPDF(file, password);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <Layout>
      <Header />
      
      <div className="container py-12 max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Desbloquear PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Elimina la contraseña de tus documentos PDF protegidos. Toda la operación
            se realiza en tu navegador sin enviar datos a servidores externos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8">
          <motion.div
            className="rounded-xl border bg-card p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-6 flex items-center">
              <FileLock className="mr-2 h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Desbloquear PDF</h2>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="file">1. Selecciona el PDF protegido</Label>
                <FileUpload
                  onFilesSelected={handleFilesSelected}
                  multiple={false}
                  accept=".pdf"
                  maxFiles={1}
                  className="mt-2"
                />
              </div>

              {file && (
                <div>
                  {needsPassword ? (
                    <div className="space-y-2">
                      <Label htmlFor="password">2. Este PDF requiere contraseña</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          type="password"
                          placeholder="Contraseña del PDF"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">2. Haz clic en desbloquear para eliminar la protección del PDF</p>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      onClick={handleUnlock}
                      disabled={!file || (needsPassword && !password) || isProcessing}
                      className="w-full sm:w-auto"
                    >
                      {isProcessing ? (
                        <>Procesando</>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Desbloquear PDF
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {isProcessing && progress > 0 && (
                    <Progress value={progress} className="h-2 mt-4" />
                  )}
                  
                  {errorMessage && (
                    <p className="text-sm text-destructive mt-2">{errorMessage}</p>
                  )}
                </div>
              )}

              {unlockedFile && (
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <File className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <p className="font-medium">PDF desbloqueado con éxito</p>
                        <p className="text-sm text-muted-foreground">
                          {unlockedFile.name} ({(unlockedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={togglePreview}>
                        {showPreview ? "Ocultar vista previa" : "Ver PDF"}
                      </Button>
                      <Button size="sm" onClick={downloadUnlockedFile}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {showPreview && unlockedFile && (
                <PdfPreview 
                  file={unlockedFile} 
                  onClose={() => setShowPreview(false)}
                  showEditor={false} // Explicitly set to false
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default UnlockPDF;
