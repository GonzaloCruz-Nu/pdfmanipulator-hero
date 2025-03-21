
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
      <Card className="shadow-md h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={30}
                  fill="#f68d2e"
                  dataKey="count"
                  nameKey="category"
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  paddingAngle={2}
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

export default CategoryPieChart;
