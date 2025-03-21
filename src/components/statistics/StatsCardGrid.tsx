
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, PieChart, LineChart, TrendingUp } from 'lucide-react';
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

  // Encontrar la categoría más usada
  const mostUsedCategory = stats.categoryUsage.reduce(
    (prev, current) => (prev.count > current.count ? prev : current),
    stats.categoryUsage[0]
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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-6 flex items-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center mr-4">
              <BarChart3 className="h-6 w-6 text-blue-500 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de usos</p>
              <h3 className="text-2xl font-bold">{stats.totalUses.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="bg-indigo-50 dark:bg-indigo-900/20">
          <CardContent className="p-6 flex items-center">
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center mr-4">
              <PieChart className="h-6 w-6 text-indigo-500 dark:text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Herramienta más usada</p>
              <h3 className="text-2xl font-bold">{mostUsedTool.name}</h3>
              <p className="text-sm text-muted-foreground">{mostUsedTool.count} usos</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="bg-cyan-50 dark:bg-cyan-900/20">
          <CardContent className="p-6 flex items-center">
            <div className="h-12 w-12 rounded-full bg-cyan-100 dark:bg-cyan-800/50 flex items-center justify-center mr-4">
              <LineChart className="h-6 w-6 text-cyan-500 dark:text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Día más activo</p>
              <h3 className="text-2xl font-bold">{mostActiveDay.day}</h3>
              <p className="text-sm text-muted-foreground">{mostActiveDay.count} usos</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <CardContent className="p-6 flex items-center">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center mr-4">
              <TrendingUp className="h-6 w-6 text-purple-500 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categoría más usada</p>
              <h3 className="text-2xl font-bold">{mostUsedCategory.category}</h3>
              <p className="text-sm text-muted-foreground">{mostUsedCategory.percentage.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StatsCardGrid;
