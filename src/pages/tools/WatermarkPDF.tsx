
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Stamp, File } from 'lucide-react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useWatermarkPDF } from '@/hooks/useWatermarkPDF';
import WatermarkHeader from '@/components/watermark-pdf/WatermarkHeader';
import WatermarkUpload from '@/components/watermark-pdf/WatermarkUpload';
import WatermarkSettings from '@/components/watermark-pdf/WatermarkSettings';
import WatermarkResults from '@/components/watermark-pdf/WatermarkResults';

const WatermarkPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkColor, setWatermarkColor] = useState('#888888');
  const [opacity, setOpacity] = useState(30);
  const [fontSize, setFontSize] = useState(24);
  const [angle, setAngle] = useState(45);
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    applyWatermark,
    isProcessing,
    progress,
    watermarkedFile,
    errorMessage,
    downloadWatermarkedFile
  } = useWatermarkPDF();

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    
    await applyWatermark(file, {
      text: watermarkText,
      color: watermarkColor,
      opacity: opacity / 100,
      fontSize,
      angle
    });
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <Layout>
      <Header />
      
      <div className="container py-12 max-w-4xl mx-auto">
        <WatermarkHeader />

        <div className="grid grid-cols-1 gap-8">
          <motion.div
            className="rounded-xl border bg-card p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-6 flex items-center">
              <Stamp className="mr-2 h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Añadir marca de agua</h2>
            </div>

            <div className="space-y-6">
              <WatermarkUpload onFilesSelected={handleFilesSelected} />

              {file && (
                <>
                  <WatermarkSettings 
                    watermarkText={watermarkText}
                    setWatermarkText={setWatermarkText}
                    watermarkColor={watermarkColor}
                    setWatermarkColor={setWatermarkColor}
                    opacity={opacity}
                    setOpacity={setOpacity}
                    fontSize={fontSize}
                    setFontSize={setFontSize}
                    angle={angle}
                    setAngle={setAngle}
                  />
                  
                  <div>
                    <Button 
                      onClick={handleApplyWatermark}
                      disabled={!file || !watermarkText}
                      className="w-full sm:w-auto"
                    >
                      {isProcessing ? (
                        <>Procesando</>
                      ) : (
                        <>
                          <File className="h-4 w-4 mr-2" />
                          Aplicar marca de agua
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <WatermarkResults 
                    isProcessing={isProcessing}
                    progress={progress}
                    errorMessage={errorMessage}
                    watermarkedFile={watermarkedFile}
                    showPreview={showPreview}
                    togglePreview={togglePreview}
                    downloadWatermarkedFile={downloadWatermarkedFile}
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

export default WatermarkPDF;
