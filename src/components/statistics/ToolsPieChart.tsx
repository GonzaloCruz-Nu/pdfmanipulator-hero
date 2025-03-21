
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolUsage } from '@/hooks/useStatistics';

// Colores corporativos y complementarios
const COLORS = ['#f68d2e', '#1f2a44', '#3b82f6', '#a855f7', '#10b981'];

interface ToolsPieChartProps {
  data: ToolUsage[];
  title?: string;
}

const ToolsPieChart: React.FC<ToolsPieChartProps> = ({ data, title = "Distribución de uso" }) => {
  // Tomamos solo los primeros 5 para el gráfico de pastel
  const topData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="shadow-md h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <Pie
                  data={topData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={30}
                  fill="#f68d2e"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  paddingAngle={2}
                >
                  {topData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value} usos (${topData.find(item => item.name === name)?.percentage.toFixed(1)}%)`, 
                    name
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--card-foreground)',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                />
                <Legend 
                  formatter={(value) => <span style={{ color: 'var(--foreground)', fontSize: '14px', paddingLeft: '4px' }}>{value}</span>}
                  layout="vertical"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ToolsPieChart;
