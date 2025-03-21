
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { useStatistics } from '@/hooks/useStatistics';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCardGrid from '@/components/statistics/StatsCardGrid';
import DailyUsageChart from '@/components/statistics/DailyUsageChart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

const Statistics = () => {
  const { 
    statistics, 
    loading, 
    error, 
    selectedMonth, 
    setSelectedMonth,
    availableMonths 
  } = useStatistics();

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Layout>
      <Header />
      
      <div className="py-12 container max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-10"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-azul dark:text-white">Estadísticas de Uso</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Análisis detallado sobre el uso de nuestras herramientas PDF
          </p>
        </motion.div>

        <div className="mb-8 flex justify-end">
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month.id} value={month.id}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-naranja" />
            <span className="ml-2 text-lg">Cargando estadísticas...</span>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 border border-red-200 dark:border-red-800">
            <p className="text-lg font-medium">Error al cargar estadísticas</p>
            <p>{error}</p>
          </div>
        ) : statistics ? (
          <>
            <StatsCardGrid stats={statistics} />

            <Tabs defaultValue="charts" className="mb-10">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-background border">
                <TabsTrigger value="charts" className="data-[state=active]:bg-naranja data-[state=active]:text-white">Gráficos</TabsTrigger>
                <TabsTrigger value="tendencies" className="data-[state=active]:bg-naranja data-[state=active]:text-white">Tendencias</TabsTrigger>
              </TabsList>
              
              <TabsContent value="charts">
                <div className="grid grid-cols-1 gap-10">
                  <DailyUsageChart data={statistics.dailyUsage} title={`Uso diario - ${statistics.month}`} className="h-[650px]" />
                </div>
              </TabsContent>
              
              <TabsContent value="tendencies">
                <div className="bg-card p-8 rounded-lg shadow-md border border-border">
                  <h3 className="text-xl font-semibold mb-6">Tendencia de uso en el tiempo</h3>
                  <p className="text-muted-foreground mb-8">
                    Este gráfico muestra la tendencia de uso de las herramientas más populares.
                  </p>
                  
                  <ChartContainer 
                    className="h-[500px]"
                    config={{
                      "Unir PDFs": { color: "#f68d2e" },
                      "Comprimir PDF": { color: "#1f2a44" },
                      "Dividir PDF": { color: "#10b981" },
                      "Desbloquear PDF": { color: "#8b5cf6" }
                    }}
                  >
                    <LineChart margin={{ top: 30, right: 40, left: 30, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <ChartTooltipContent
                                style={{
                                  backgroundColor: "var(--card)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "var(--radius)",
                                }}
                                label={`Día ${label}`}
                              />
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#f68d2e"
                        name="Unir PDFs"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        data={statistics.dailyUsage}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default Statistics;
