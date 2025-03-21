
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileLock, File, Download, Shield, Info } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useProtectPDF } from '@/hooks/useProtectPDF';
import PdfPreview from '@/components/PdfPreview';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProtectPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [useOwnerPassword, setUseOwnerPassword] = useState(false);
  const [canPrint, setCanPrint] = useState(true);
  const [canCopy, setCanCopy] = useState(true);
  const [canModify, setCanModify] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    protectPDF,
    isProcessing,
    progress,
    protectedFile,
    errorMessage,
    downloadProtectedFile
  } = useProtectPDF();

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleProtect = async () => {
    if (!file) return;
    
    await protectPDF(file, {
      userPassword,
      ownerPassword: useOwnerPassword ? ownerPassword : undefined,
      canPrint,
      canCopy,
      canModify
    });
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Proteger PDF</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Añade contraseñas y restricciones de seguridad a tus documentos PDF. Toda la operación
            se realiza en tu navegador sin enviar datos a servidores externos.
          </p>
        </motion.div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            La funcionalidad de protección con contraseña está temporalmente desactivada mientras trabajamos en mejorarla.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-8">
          <motion.div
            className="rounded-xl border bg-card p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-6 flex items-center">
              <FileLock className="mr-2 h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Procesar PDF</h2>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="file">1. Selecciona el PDF a procesar</Label>
                <FileUpload
                  onFilesSelected={handleFilesSelected}
                  multiple={false}
                  accept=".pdf"
                  maxFiles={1}
                  maxSize={100} // 100 MB
                />
              </div>

              {file && (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="userPassword">2. Configura la protección</Label>
                    
                    <div className="p-4 border rounded-md space-y-4 opacity-70">
                      <div className="space-y-2">
                        <Label htmlFor="userPassword">Contraseña de usuario</Label>
                        <Input
                          id="userPassword"
                          type="password"
                          placeholder="Contraseña para abrir el documento"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          Esta contraseña será necesaria para abrir el documento
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="useOwnerPassword" 
                            checked={useOwnerPassword}
                            onCheckedChange={(checked) => {
                              setUseOwnerPassword(checked === true);
                            }}
                            disabled
                          />
                          <Label htmlFor="useOwnerPassword">Usar contraseña de propietario diferente</Label>
                        </div>
                        
                        {useOwnerPassword && (
                          <div className="space-y-2 mt-2">
                            <Label htmlFor="ownerPassword">Contraseña de propietario</Label>
                            <Input
                              id="ownerPassword"
                              type="password"
                              placeholder="Contraseña para modificar permisos"
                              value={ownerPassword}
                              onChange={(e) => setOwnerPassword(e.target.value)}
                              disabled
                            />
                            <p className="text-xs text-muted-foreground">
                              Esta contraseña permitirá modificar la configuración de seguridad
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <Label className="mb-2 block">Permisos (con la contraseña de usuario)</Label>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="canPrint" 
                              checked={canPrint}
                              onCheckedChange={(checked) => {
                                setCanPrint(checked === true);
                              }}
                              disabled
                            />
                            <Label htmlFor="canPrint">Permitir imprimir</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="canCopy" 
                              checked={canCopy}
                              onCheckedChange={(checked) => {
                                setCanCopy(checked === true);
                              }}
                              disabled
                            />
                            <Label htmlFor="canCopy">Permitir copiar texto</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="canModify" 
                              checked={canModify}
                              onCheckedChange={(checked) => {
                                setCanModify(checked === true);
                              }}
                              disabled
                            />
                            <Label htmlFor="canModify">Permitir modificar</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Button 
                      onClick={handleProtect}
                      disabled={!file}
                      className="w-full sm:w-auto"
                    >
                      {isProcessing ? (
                        <>Procesando</>
                      ) : (
                        <>
                          <File className="h-4 w-4 mr-2" />
                          Procesar PDF
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
                </>
              )}

              {protectedFile && (
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <File className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <p className="font-medium">PDF procesado con éxito</p>
                        <p className="text-sm text-muted-foreground">
                          {protectedFile.name} ({(protectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={togglePreview}>
                        {showPreview ? "Ocultar vista previa" : "Ver PDF"}
                      </Button>
                      <Button size="sm" onClick={downloadProtectedFile}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {showPreview && protectedFile && (
                <PdfPreview 
                  file={protectedFile} 
                  onClose={() => setShowPreview(false)}
                  showEditor={false}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ProtectPDF;
