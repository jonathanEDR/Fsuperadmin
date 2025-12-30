/**
 * Barrel exports para el módulo de Préstamos
 * Consolidado y limpio - Solo exportaciones activas
 */

// Configuración
export * from './prestamosConfig.jsx';

// Componente principal optimizado
export { PrestamosOptimizado } from './PrestamosOptimizado';

// Hooks modernos
export { usePrestamoForm } from './hooks/usePrestamoForm';
export { usePrestamosData } from './hooks/usePrestamosData';
export { usePrestamosModals } from './hooks/usePrestamosModals';

// Subcomponentes optimizados
export { PrestamosResumen } from './components/PrestamosResumen';
export { PrestamosFilters } from './components/PrestamosFilters';
export { PrestamosTable } from './components/PrestamosTable';

// Modales
export { default as ModalPrestamo } from './ModalPrestamo';
export { default as ModalPrestamoOtorgado } from './ModalPrestamoOtorgado';
export { default as ModalCalculadoraCuota } from './ModalCalculadoraCuota';
export { default as ModalTablaAmortizacion } from './ModalTablaAmortizacion';
export { default as ModalDetallesPrestamo } from './ModalDetallesPrestamo';

// Componentes auxiliares
export { default as TablaPrestamosEspecifica } from './TablaPrestamosEspecifica';
export { default as TablaAmortizacion } from './TablaAmortizacion';
export { default as CampoPrestamos } from './CampoPrestamos';
