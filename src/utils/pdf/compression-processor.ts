
// Este archivo ahora actúa como un punto de entrada al sistema de compresión refactorizado
import { compressPDF } from './processors/compression-orchestrator';
import { CompressionLevel } from './compression-types';

// Re-exportar la funcionalidad principal para mantener la compatibilidad con el código existente
export { compressPDF };
export type { CompressionLevel };

// Re-exportar otros métodos utilizados externamente
export { compressPDFWithCanvas } from './processors/canvas-processor';
export { compressPDFAdvanced } from './processors/advanced-processor';
