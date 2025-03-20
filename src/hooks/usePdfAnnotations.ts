
import { useState, useCallback } from 'react';

export interface Annotation {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'pen' | 'image';
  pageNum: number;
  properties: any;
  object: any;
}

export interface AnnotationsByPage {
  [pageNum: number]: Annotation[];
}

export const usePdfAnnotations = () => {
  const [annotations, setAnnotations] = useState<AnnotationsByPage>({});

  const addAnnotation = useCallback((annotation: Omit<Annotation, 'id'>) => {
    const id = `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setAnnotations(prevAnnotations => {
      const pageAnnotations = prevAnnotations[annotation.pageNum] || [];
      
      return {
        ...prevAnnotations,
        [annotation.pageNum]: [
          ...pageAnnotations,
          { ...annotation, id }
        ]
      };
    });
    
    return id;
  }, []);

  const removeAnnotation = useCallback((pageNum: number, annotationId: string) => {
    setAnnotations(prevAnnotations => {
      const pageAnnotations = prevAnnotations[pageNum] || [];
      
      return {
        ...prevAnnotations,
        [pageNum]: pageAnnotations.filter(anno => anno.id !== annotationId)
      };
    });
  }, []);

  const updateAnnotation = useCallback((pageNum: number, annotationId: string, updates: Partial<Annotation>) => {
    setAnnotations(prevAnnotations => {
      const pageAnnotations = prevAnnotations[pageNum] || [];
      
      return {
        ...prevAnnotations,
        [pageNum]: pageAnnotations.map(anno => 
          anno.id === annotationId ? { ...anno, ...updates } : anno
        )
      };
    });
  }, []);

  const getPageAnnotations = useCallback((pageNum: number) => {
    return annotations[pageNum] || [];
  }, [annotations]);

  return {
    annotations,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    getPageAnnotations
  };
};
