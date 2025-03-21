
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileLock, File } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useProtectPDF } from '@/hooks/useProtectPDF';
import ProtectHeader from '@/components/protect-pdf/ProtectHeader';
import ProtectUpload from '@/components/protect-pdf/ProtectUpload';
import ProtectSettings from '@/components/protect-pdf/ProtectSettings';
import ProtectResults from '@/components/protect-pdf/ProtectResults';

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
        <ProtectHeader />

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
              <ProtectUpload onFilesSelected={handleFilesSelected} />

              {file && (
                <>
                  <ProtectSettings 
                    userPassword={userPassword}
                    setUserPassword={setUserPassword}
                    ownerPassword={ownerPassword}
                    setOwnerPassword={setOwnerPassword}
                    useOwnerPassword={useOwnerPassword}
                    setUseOwnerPassword={setUseOwnerPassword}
                    canPrint={canPrint}
                    setCanPrint={setCanPrint}
                    canCopy={canCopy}
                    setCanCopy={setCanCopy}
                    canModify={canModify}
                    setCanModify={setCanModify}
                  />
                  
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
                  
                  <ProtectResults 
                    isProcessing={isProcessing}
                    progress={progress}
                    errorMessage={errorMessage}
                    protectedFile={protectedFile}
                    showPreview={showPreview}
                    togglePreview={togglePreview}
                    downloadProtectedFile={downloadProtectedFile}
                  />
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ProtectPDF;
