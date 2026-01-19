/**
 * Barrel export para módulo personal-v2
 */

// Layout principal con rutas anidadas
export { default as GestionPersonalLayout } from './GestionPersonalLayout';

// Componente legacy (mantener para compatibilidad)
export { default as GestionPersonalV2 } from './GestionPersonalV2';

// Hooks
export { default as useGestionPersonal } from './hooks/useGestionPersonal';
export { default as useAsistencias } from './hooks/useAsistencias';

// Páginas (para rutas anidadas)
export { 
  ColaboradoresPage,
  ColaboradorDetallePage,
  PagosPage,
  AsistenciasPage,
  PerfilesPage,
  MetasPage 
} from './pages';

// Componentes reutilizables
export { default as ColaboradoresTable } from './components/ColaboradoresTable';
export { default as ColaboradorDetalle } from './components/ColaboradorDetalle';
export { default as PagosRealizados } from './components/PagosRealizados';
export { default as RegistroModal } from './components/RegistroModal';
export { default as BonificacionAdelantoModal } from './components/BonificacionAdelantoModal';
export { default as DescuentoModal } from './components/DescuentoModal';
export { default as FiltrosFecha } from './components/FiltrosFecha';
export { default as EstadisticasCard } from './components/EstadisticasCard';
export { default as RegistrosTable } from './components/RegistrosTable';
export { default as CalendarioAsistencias } from './components/CalendarioAsistencias';
export { default as ListaAsistencias } from './components/ListaAsistencias';
export { default as ReporteAsistencias } from './components/ReporteAsistencias';
export { default as ModalAsistencia } from './components/ModalAsistencia';
export { default as ModalAsistenciasDia } from './components/ModalAsistenciasDia';
export { default as FiltrosAsistencia } from './components/FiltrosAsistencia';
export { default as AsistenciaResumenCard } from './components/AsistenciaResumenCard';
