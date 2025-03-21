
import { useState, useEffect } from 'react';

// Tipos para nuestros datos de estadísticas
export interface ToolUsage {
  name: string;
  count: number;
  percentage: number;
}

export interface DailyUsage {
  day: string;
  count: number;
}

export interface CategoryUsage {
  category: string;
  count: number;
  percentage: number;
}

export interface MonthlyStatistics {
  month: string;
  totalUses: number;
  toolUsage: ToolUsage[];
  dailyUsage: DailyUsage[];
  categoryUsage: CategoryUsage[];
}

// Lista de archivos de estadísticas disponibles
const availableMonths = [
  { id: '2023-12', label: 'Diciembre 2023' },
  { id: '2024-01', label: 'Enero 2024' }
];

export function useStatistics() {
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[availableMonths.length - 1].id);
  const [statistics, setStatistics] = useState<MonthlyStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatistics() {
      setLoading(true);
      setError(null);
      
      try {
        // Importar dinámicamente el archivo JSON correspondiente al mes seleccionado
        const data = await import(`../data/statistics/usage-${selectedMonth}.json`);
        setStatistics(data);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas para el mes seleccionado');
      } finally {
        setLoading(false);
      }
    }

    fetchStatistics();
  }, [selectedMonth]);

  return {
    statistics,
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    availableMonths
  };
}
