// 🌌 Exportaciones principales del Sistema Solar de Producción

// Componente principal MEJORADO
export { default as SistemaSolarProduccion } from './SistemaSolarProduccion';

// ✅ VERSIÓN COMPLETAMENTE PROFESIONAL
export { default as SistemaSolarProfesional } from './SistemaSolarProfesional';

// 🧪 COMPONENTES DE PRUEBA
export { default as TestPlanetasProfesionales } from './TestPlanetasProfesionales';
export { default as TestComponentesProfesionales } from './TestComponentesProfesionales';

// 🔧 COMPONENTE SELECTOR PROFESIONAL
export { default as PlanetaModuloProfesional } from './PlanetaModuloProfesional';

// Sol Central
export { default as SolCentral } from './components/SolCentral/SolCentral';

// 🌟 PLANETAS PROFESIONALES (NUEVOS)
export { default as PlanetaIngredientesPro } from './components/planetas/PlanetaIngredientes/PlanetaIngredientesPro';
export { default as PlanetaRecetasPro } from './components/planetas/PlanetaRecetas/PlanetaRecetasPro';
export { default as PlanetaProduccionPro } from './components/planetas/PlanetaProduccion/PlanetaProduccionPro';
export { default as PlanetaMovimientosPro } from './components/planetas/PlanetaMovimientos/PlanetaMovimientosPro';
export { default as PlanetaCatalogoPro } from './components/planetas/PlanetaCatalogo/PlanetaCatalogoPro';
export { default as PlanetaResiduosPro } from './components/planetas/PlanetaResiduos/PlanetaResiduosPro';

// Planetas originales (para compatibilidad)
export { default as PlanetaIngredientes } from './components/planetas/PlanetaIngredientes/PlanetaIngredientes';
export { default as PlanetaMateriales } from './components/planetas/PlanetaMateriales/PlanetaMateriales';
export { default as PlanetaRecetas } from './components/planetas/PlanetaRecetas/PlanetaRecetas';
export { default as PlanetaProduccion } from './components/planetas/PlanetaProduccion/PlanetaProduccion';
export { default as PlanetaResiduos } from './components/planetas/PlanetaResiduos/PlanetaResiduos';
export { default as PlanetaMovimientos } from './components/planetas/PlanetaMovimientos/PlanetaMovimientos';

// Componentes auxiliares
export { default as PlanetaModulo } from './PlanetaModulo';
export { default as OrbitaContainer } from './OrbitaContainer';

// Hooks especializados
export { 
  usePlanetEffects, 
  useOrbitalAnimation, 
  useParticleEffects, 
  useResponsiveLayout,
  useSystemStats,
  useInteractionEffects 
} from './hooks/usePlanetEffects';

// Configuraciones
export * from './data/planetasConfig';
export * from './data/efectosConfig';

// Configuración legacy (mantenida para compatibilidad)
export * from './sistemaSolarConfig';
