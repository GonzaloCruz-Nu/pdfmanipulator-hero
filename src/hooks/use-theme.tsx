
import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Intentar recuperar el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    // Si hay un tema guardado, usarlo; de lo contrario, usar la preferencia del sistema
    return savedTheme || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Eliminar las clases dark y light
    root.classList.remove('dark', 'light');
    
    // Guardar el tema en localStorage
    localStorage.setItem('theme', theme);
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);
  
  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
}
