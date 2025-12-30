// ==================== BARREL EXPORTS PARA GARANTÍAS ====================

// Componente principal
export { default as GarantiasCore } from './GarantiasCore';

// Componentes de UI legados (compatibilidad)
export { default as TablaGarantias } from './TablaGarantias';
export { default as CampoGarantia } from './CampoGarantia';

// Modales
export { default as ModalGarantia } from './ModalGarantia';
export { default as ModalDetallesGarantia } from './ModalDetallesGarantia';

// Componentes de tabla optimizados
export { GarantiasTable, GarantiasFilters, GarantiasResumen } from './components';

// Hooks
export { useFormularioGarantias } from './useFormularioGarantias';
export { useGarantiasData, useGarantiaForm, useGarantiasModals } from './hooks';

// Configuración
export * from './garantiasConfig';

// Export por defecto
export { default } from './GarantiasCore';
