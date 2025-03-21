
import { useState, useEffect } from 'react';

export interface PdfHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  tool: string;
  timestamp: number;
  thumbnail?: string;
}

export function usePdfHistory() {
  const [history, setHistory] = useState<PdfHistoryItem[]>([]);
  
  // Cargar historial al iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('pdf-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error al cargar historial:', error);
        localStorage.removeItem('pdf-history');
      }
    }
  }, []);
  
  // Guardar historial cuando cambie
  useEffect(() => {
    localStorage.setItem('pdf-history', JSON.stringify(history));
  }, [history]);
  
  // Añadir un elemento al historial
  const addToHistory = (item: Omit<PdfHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: PdfHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setHistory(prev => {
      // Limitar a 50 elementos y evitar duplicados por nombre
      const filtered = prev.filter(i => i.fileName !== item.fileName);
      return [newItem, ...filtered].slice(0, 50);
    });
  };
  
  // Eliminar un elemento del historial
  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };
  
  // Limpiar todo el historial
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('pdf-history');
  };
  
  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}
