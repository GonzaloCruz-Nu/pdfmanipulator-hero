
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Merge, Scissors, Zap, Unlock, FileCog, 
  FileSearch, FileLock, RotateCw, Languages, 
  Stamp, MoveVertical, EyeOff, ImagePlus,
  Files, History
} from 'lucide-react';
import ToolCard from '@/components/ToolCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from 'lucide-react';

interface Tool {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  category: string;
  maintenance?: boolean;
  isNew?: boolean;
}

const ToolsGrid = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const categories = [
    {
      id: "todas",
      label: "Todas",
    },
    {
      id: "basicas",
      label: "Básicas",
    },
    {
      id: "edicion",
      label: "Edición",
    },
    {
      id: "seguridad",
      label: "Seguridad",
    },
    {
      id: "avanzadas",
      label: "Avanzadas",
    }
  ];

  const basicTools: Tool[] = [
    {
      title: "Unir PDFs",
      description: "Combina múltiples documentos PDF en uno",
      icon: Merge,
      to: "/tools/merge",
      category: "basicas"
    },
    {
      title: "Dividir PDF",
      description: "Divide un documento PDF en varios archivos",
      icon: Scissors,
      to: "/tools/split",
      category: "basicas"
    },
    {
      title: "Comprimir PDF",
      description: "Reduce el tamaño sin perder calidad",
      icon: Zap,
      to: "/tools/compress",
      category: "basicas"
    },
    {
      title: "Rotar PDF",
      description: "Cambia la orientación de las páginas",
      icon: RotateCw,
      to: "/tools/rotate",
      category: "basicas"
    }
  ];

  const editTools: Tool[] = [
    {
      title: "Editar PDF",
      description: "Edita el contenido de tus documentos",
      icon: FileCog,
      to: "/tools/edit",
      category: "edicion"
    },
    {
      title: "OCR PDF",
      description: "Extrae texto de imágenes y escaneados",
      icon: FileSearch,
      to: "/tools/ocr",
      category: "edicion"
    },
    {
      title: "Ordenar PDF",
      description: "Reordena las páginas de tus documentos",
      icon: MoveVertical,
      to: "/tools/sort",
      category: "edicion"
    },
    {
      title: "Marca de Agua",
      description: "Añade texto como marca de agua a tu PDF",
      icon: Stamp,
      to: "/tools/watermark",
      category: "edicion"
    },
    {
      title: "Censurar PDF",
      description: "Oculta información sensible en tus documentos",
      icon: EyeOff,
      to: "/tools/censor",
      category: "edicion",
      maintenance: true,
      isNew: true
    },
    {
      title: "Extraer Imágenes",
      description: "Extrae todas las imágenes de un PDF",
      icon: ImagePlus,
      to: "/tools/extract-images",
      maintenance: true,
      isNew: true,
      category: "edicion"
    }
  ];

  const securityTools: Tool[] = [
    {
      title: "Desbloquear PDF",
      description: "Elimina contraseñas de PDFs protegidos",
      icon: Unlock,
      to: "/tools/unlock",
      category: "seguridad"
    },
    {
      title: "Proteger PDF",
      description: "Añade contraseñas a tus PDFs",
      icon: FileLock,
      to: "/tools/protect",
      category: "seguridad",
      maintenance: true
    }
  ];

  const advancedTools: Tool[] = [
    {
      title: "Traducir PDF",
      description: "Traduce PDF de español a inglés con IA",
      icon: Languages,
      to: "/tools/translate",
      category: "avanzadas",
      maintenance: true,
      isNew: true
    },
    {
      title: "Comparar PDFs",
      description: "Compara dos documentos PDF y encuentra diferencias",
      icon: Files,
      to: "/tools/compare",
      maintenance: true,
      isNew: true,
      category: "avanzadas"
    },
    {
      title: "Historial PDF",
      description: "Accede a tus PDFs procesados recientemente",
      icon: History,
      to: "/historial",
      isNew: true,
      category: "avanzadas",
      maintenance: true
    }
  ];

  const allTools: Tool[] = [...basicTools, ...editTools, ...securityTools, ...advancedTools];

  return (
    <>
      <motion.h2 
        className="text-xl font-bold text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Nuestras herramientas
      </motion.h2>

      <Tabs defaultValue="todas" className="mb-8">
        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5 mb-6">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="text-sm"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="todas">
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {allTools.map((tool, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <ToolCard
                  title={tool.title}
                  description={tool.description}
                  icon={tool.icon}
                  to={tool.to}
                  className="h-full"
                  maintenance={tool.maintenance}
                  isNew={tool.isNew}
                />
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {categories.slice(1).map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {allTools
                .filter(tool => tool.category === category.id)
                .map((tool, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <ToolCard
                      title={tool.title}
                      description={tool.description}
                      icon={tool.icon}
                      to={tool.to}
                      className="h-full"
                      maintenance={tool.maintenance}
                      isNew={tool.isNew}
                    />
                  </motion.div>
                ))
              }
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
};

export default ToolsGrid;
