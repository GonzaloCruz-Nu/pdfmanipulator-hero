
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
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#f68d2e"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                    color: 'var(--card-foreground)'
                  }}
                />
                <Legend formatter={(value) => <span style={{ color: 'var(--foreground)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ToolsPieChart;
