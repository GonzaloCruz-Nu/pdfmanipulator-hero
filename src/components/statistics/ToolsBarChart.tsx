
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolUsage } from '@/hooks/useStatistics';

// Colores corporativos y complementarios
const COLORS = ['#f68d2e', '#1f2a44', '#60a5fa', '#a855f7', '#f97316', '#10b981', '#3b82f6'];

interface ToolsBarChartProps {
  data: ToolUsage[];
  title?: string;
  className?: string;
}

const ToolsBarChart: React.FC<ToolsBarChartProps> = ({ 
  data, 
  title = "Herramientas más utilizadas", 
  className 
}) => {
  // Ordenar los datos por count de mayor a menor
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="shadow-md h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-full w-full" style={{ minHeight: "500px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                margin={{ top: 30, right: 40, left: 30, bottom: 100 }}
                barSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100} 
                  tick={{ fontSize: 16 }} 
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  tick={{ fontSize: 16 }}
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} usos`, 'Total']}
                  labelFormatter={(name) => `Herramienta: ${name}`}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--card-foreground)',
                    padding: '12px 16px',
                    fontSize: '16px'
                  }}
                />
                <Bar dataKey="count" name="Usos" radius={[8, 8, 0, 0]} maxBarSize={80}>
                  {sortedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ToolsBarChart;
