
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyUsage } from '@/hooks/useStatistics';

interface DailyUsageChartProps {
  data: DailyUsage[];
  title?: string;
}

const DailyUsageChart: React.FC<DailyUsageChartProps> = ({ data, title = "Uso diario" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="col-span-full"
    >
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 14 }}
                  padding={{ left: 15, right: 15 }}
                />
                <YAxis 
                  tick={{ fontSize: 14 }}
                  width={40}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} usos`, 'Total']}
                  labelFormatter={(day) => `Día: ${day}`}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--card-foreground)',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#f68d2e" 
                  fill="#f68d2e" 
                  fillOpacity={0.3}
                  strokeWidth={2}
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
