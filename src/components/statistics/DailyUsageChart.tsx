
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyUsage } from '@/hooks/useStatistics';

interface DailyUsageChartProps {
  data: DailyUsage[];
  title?: string;
  className?: string;
}

const DailyUsageChart: React.FC<DailyUsageChartProps> = ({ 
  data, 
  title = "Uso diario",
  className 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`col-span-full ${className}`}
    >
      <Card className="shadow-md h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 30, right: 40, left: 30, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 16 }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  tick={{ fontSize: 16 }}
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} usos`, 'Total']}
                  labelFormatter={(day) => `Día: ${day}`}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--card-foreground)',
                    padding: '12px 16px',
                    fontSize: '16px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#f68d2e" 
                  fill="#f68d2e" 
                  fillOpacity={0.3}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DailyUsageChart;
