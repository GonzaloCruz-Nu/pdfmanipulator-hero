
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolUsage } from '@/hooks/useStatistics';

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#f0f9ff', '#eff6ff'];

interface ToolsBarChartProps {
  data: ToolUsage[];
  title?: string;
}

const ToolsBarChart: React.FC<ToolsBarChartProps> = ({ data, title = "Herramientas más utilizadas" }) => {
  // Ordenar los datos por count de mayor a menor
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }} 
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value} usos`, 'Total']}
                  labelFormatter={(name) => `Herramienta: ${name}`}
                />
                <Bar dataKey="count" name="Usos" radius={[4, 4, 0, 0]}>
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
