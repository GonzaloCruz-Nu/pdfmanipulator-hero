
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
  const [isModified, setIsModified] = useState(false);

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
    
    setIsModified(true);
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
    
    setIsModified(true);
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
    
    setIsModified(true);
  }, []);

  const getPageAnnotations = useCallback((pageNum: number) => {
    return annotations[pageNum] || [];
  }, [annotations]);

  // Create annotations from Fabric objects
  const createAnnotationsFromCanvas = useCallback((pageNum: number, fabricObjects: any[]) => {
    console.log("Creating annotations from", fabricObjects.length, "Fabric objects");
    
    const newAnnotations: Omit<Annotation, 'id'>[] = fabricObjects.map(obj => {
      let type: Annotation['type'] = 'rectangle';
      
      if (obj.type === 'i-text' || obj.type === 'text') {
        type = 'text';
      } else if (obj.type === 'circle') {
        type = 'circle';
      } else if (obj.type === 'path') {
        type = 'pen';
      } else if (obj.type === 'image') {
        type = 'image';
      }
      
      return {
        type,
        pageNum,
        properties: {
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          text: obj.text,
          radius: obj.radius,
          path: obj.path
        },
        object: obj.toJSON()
      };
    });
    
    // Add all new annotations
    newAnnotations.forEach(annotation => {
      addAnnotation(annotation);
    });
    
    setIsModified(true);
  }, [addAnnotation]);

  // Clear all annotations from a page
  const clearPageAnnotations = useCallback((pageNum: number) => {
    setAnnotations(prevAnnotations => {
      const newAnnotations = { ...prevAnnotations };
      delete newAnnotations[pageNum];
      return newAnnotations;
    });
    
    setIsModified(true);
  }, []);

  // Check if annotations have been modified
  const resetModifiedState = useCallback(() => {
    setIsModified(false);
  }, []);

  return {
    annotations,
    isModified,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    getPageAnnotations,
    createAnnotationsFromCanvas,
    clearPageAnnotations,
    resetModifiedState
  };
};
