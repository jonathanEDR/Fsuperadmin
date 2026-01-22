/**
 * Servicios del módulo de Tareas
 *
 * Exporta todos los servicios relacionados con el sistema de tareas:
 * - tareasService: CRUD y operaciones de tareas
 * - categoriasService: Gestión de categorías
 * - plantillasService: Gestión de plantillas
 * - etiquetasService: Gestión de etiquetas
 *
 * Uso:
 * import { tareasService, categoriasService, plantillasService, etiquetasService } from '@/services/tareas';
 *
 * O importar individualmente:
 * import tareasService from '@/services/tareas/tareasService';
 */

import tareasService from './tareasService';
import categoriasService from './categoriasService';
import plantillasService from './plantillasService';
import etiquetasService from './etiquetasService';

export {
  tareasService,
  categoriasService,
  plantillasService,
  etiquetasService
};

// Export default para compatibilidad
export default {
  tareas: tareasService,
  categorias: categoriasService,
  plantillas: plantillasService,
  etiquetas: etiquetasService
};
