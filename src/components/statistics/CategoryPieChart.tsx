
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryUsage } from '@/hooks/useStatistics';

// Colores corporativos y complementarios
const COLORS = ['#f68d2e', '#1f2a44', '#3b82f6', '#10b981'];

interface CategoryPieChartProps {
  data: CategoryUsage[];
  title?: string;
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, title = "Uso por categoría" }) => {
  // Filtrar categorías con 0 usos
  const filteredData = data.filter(item => item.count > 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
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
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#f68d2e"
                  dataKey="count"
                  nameKey="category"
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, category: string) => [
                    `${value} usos (${filteredData.find(item => item.category === category)?.percentage.toFixed(1)}%)`, 
                    category
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

export default CategoryPieChart;
