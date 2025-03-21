
import { useState, useEffect } from 'react';

export interface RecentFile {
  id: string;
  name: string;
  date: string;
  type: string;
  path?: string;
  size?: number;
}

const useRecentFiles = () => {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    // Load recent files from localStorage
    const loadRecentFiles = () => {
      try {
        const storedFiles = localStorage.getItem('recentPdfFiles');
        if (storedFiles) {
          setRecentFiles(JSON.parse(storedFiles));
        }
      } catch (error) {
        console.error('Error loading recent files:', error);
      }
    };

    loadRecentFiles();
  }, []);

  const addRecentFile = (file: File, type: string) => {
    // Create a new recent file entry
    const newFile: RecentFile = {
      id: crypto.randomUUID(),
      name: file.name,
      date: new Date().toISOString(),
      type: type,
      size: file.size
    };

    // Update the recent files list (up to 10 files)
    setRecentFiles(prev => {
      const updatedFiles = [newFile, ...prev.filter(f => f.name !== file.name)].slice(0, 10);
      
      // Save to localStorage
      localStorage.setItem('recentPdfFiles', JSON.stringify(updatedFiles));
      
      return updatedFiles;
    });
  };

  const clearRecentFiles = () => {
    setRecentFiles([]);
    localStorage.removeItem('recentPdfFiles');
  };

  return {
    recentFiles,
    addRecentFile,
    clearRecentFiles
  };
};

export default useRecentFiles;
