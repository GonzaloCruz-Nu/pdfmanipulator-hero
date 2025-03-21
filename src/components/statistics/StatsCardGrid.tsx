
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, LineChart, TrendingUp } from 'lucide-react';
import { MonthlyStatistics } from '@/hooks/useStatistics';

interface StatsCardGridProps {
  stats: MonthlyStatistics;
}

const StatsCardGrid: React.FC<StatsCardGridProps> = ({ stats }) => {
  // Encontrar la herramienta más usada
  const mostUsedTool = stats.toolUsage.reduce(
    (prev, current) => (prev.count > current.count ? prev : current),
    stats.toolUsage[0]
  );

  // Calcular el día con más usos
  const mostActiveDay = stats.dailyUsage.reduce(
    (prev, current) => (prev.count > current.count ? prev : current),
    stats.dailyUsage[0]
  );

  // Configuración de las animaciones para cada tarjeta
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Card className="bg-naranja/10 dark:bg-naranja/20 border border-naranja/20 h-full">
          <CardContent className="p-8 flex items-center">
            <div className="h-16 w-16 rounded-full bg-naranja/20 dark:bg-naranja/30 flex items-center justify-center mr-5">
              <BarChart3 className="h-8 w-8 text-naranja" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total de usos</p>
              <h3 className="text-3xl font-bold">{stats.totalUses.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="bg-azul/10 dark:bg-azul/20 border border-azul/20 h-full">
          <CardContent className="p-8 flex items-center">
            <div className="h-16 w-16 rounded-full bg-azul/20 dark:bg-azul/30 flex items-center justify-center mr-5">
              <TrendingUp className="h-8 w-8 text-azul dark:text-azul/90" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Herramienta más usada</p>
              <h3 className="text-3xl font-bold">{mostUsedTool.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{mostUsedTool.count} usos ({mostUsedTool.percentage.toFixed(1)}%)</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="bg-naranja/10 dark:bg-naranja/20 border border-naranja/20 h-full">
          <CardContent className="p-8 flex items-center">
            <div className="h-16 w-16 rounded-full bg-naranja/20 dark:bg-naranja/30 flex items-center justify-center mr-5">
              <LineChart className="h-8 w-8 text-naranja" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Día más activo</p>
              <h3 className="text-3xl font-bold">{mostActiveDay.day}</h3>
              <p className="text-sm text-muted-foreground mt-1">{mostActiveDay.count} usos</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StatsCardGrid;
