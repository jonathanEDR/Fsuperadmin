/**
 * Componentes del módulo de Tareas
 *
 * Sistema completo de gestión de tareas con:
 * - Prioridades (urgente, alta, media, baja)
 * - Estados (pendiente, en_progreso, en_revision, completada, cancelada)
 * - Categorías y etiquetas
 * - Subtareas (checklist)
 * - Comentarios
 * - Flujo de revisión/aprobación
 */

export { default as Tareas } from './Tareas';
export { default as TarjetaTarea } from './TarjetaTarea';
export { default as CrearTareaModal } from './CrearTareaModal';
export { default as DetalleTareaModal } from './DetalleTareaModal';
export { default as FiltrosTareas } from './FiltrosTareas';
export { default as SubtareasChecklist } from './SubtareasChecklist';
export { default as EstadisticasTareas } from './EstadisticasTareas';
export { default as TablaTareasAprobadas } from './TablaTareasAprobadas';
export { default as GestionCategoriasModal } from './GestionCategoriasModal';
export { default as GestionPlantillasModal } from './GestionPlantillasModal';
