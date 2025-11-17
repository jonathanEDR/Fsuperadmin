/**
 * Reducer centralizado para gestión de asistencias
 * Consolida el estado y reduce re-renders innecesarios
 * Sigue el patrón del módulo personal-v2
 */

export const initialAsistenciaState = {
  // ========== DATOS ==========
  asistencias: [],
  asistenciaSeleccionada: null,
  reporteMensual: null,
  estadisticasAsistencia: null,
  
  // ========== UI ESTADO ==========
  loading: false,
  error: null,
  
  // ========== MODAL ESTADO ==========
  modalAsistencia: {
    isOpen: false,
    modo: 'crear', // 'crear' | 'editar' | 'ver'
    asistencia: null,
    colaboradorPreseleccionado: null // Para abrir modal con colaborador ya seleccionado
  },
  
  // ========== FILTROS ==========
  filtrosAsistencia: {
    colaboradorId: null, // null = todos
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1, // 1-12
    estado: 'todos', // 'todos' | 'presente' | 'ausente' | etc.
    fechaInicio: null,
    fechaFin: null
  },
  
  // ========== VISTA ==========
  vistaAsistencia: 'calendario', // 'calendario' | 'lista' | 'reporte'
  
  // ========== PAGINACIÓN (para vista lista) ==========
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  }
};

export function asistenciaReducer(state, action) {
  switch (action.type) {
    
    // ========== CARGA DE DATOS ==========
    
    case 'ASISTENCIA_LOAD_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'ASISTENCIA_LOAD_SUCCESS':
      return {
        ...state,
        asistencias: action.payload.data || action.payload,
        pagination: action.payload.pagination || state.pagination,
        loading: false,
        error: null
      };
    
    case 'ASISTENCIA_LOAD_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'SET_REPORTE_MENSUAL':
      return {
        ...state,
        reporteMensual: action.payload,
        loading: false,
        error: null
      };
    
    case 'SET_ESTADISTICAS_ASISTENCIA':
      return {
        ...state,
        estadisticasAsistencia: action.payload,
        loading: false,
        error: null
      };
    
    // ========== CRUD ASISTENCIAS ==========
    
    case 'ADD_ASISTENCIA':
      return {
        ...state,
        asistencias: [action.payload, ...state.asistencias],
        loading: false,
        error: null
      };
    
    case 'UPDATE_ASISTENCIA':
      return {
        ...state,
        asistencias: state.asistencias.map(a =>
          a._id === action.payload._id ? action.payload : a
        ),
        asistenciaSeleccionada: state.asistenciaSeleccionada?._id === action.payload._id 
          ? action.payload 
          : state.asistenciaSeleccionada,
        loading: false,
        error: null
      };
    
    case 'DELETE_ASISTENCIA':
      return {
        ...state,
        asistencias: state.asistencias.filter(a => a._id !== action.payload),
        asistenciaSeleccionada: state.asistenciaSeleccionada?._id === action.payload
          ? null
          : state.asistenciaSeleccionada,
        loading: false,
        error: null
      };
    
    case 'SELECT_ASISTENCIA':
      return {
        ...state,
        asistenciaSeleccionada: action.payload
      };
    
    // ========== FILTROS ==========
    
    case 'SET_FILTROS_ASISTENCIA':
      return {
        ...state,
        filtrosAsistencia: {
          ...state.filtrosAsistencia,
          ...action.payload
        }
      };
    
    case 'SET_FILTRO_COLABORADOR':
      return {
        ...state,
        filtrosAsistencia: {
          ...state.filtrosAsistencia,
          colaboradorId: action.payload
        }
      };
    
    case 'SET_FILTRO_MES':
      return {
        ...state,
        filtrosAsistencia: {
          ...state.filtrosAsistencia,
          año: action.payload.año,
          mes: action.payload.mes
        }
      };
    
    case 'SET_FILTRO_ESTADO':
      return {
        ...state,
        filtrosAsistencia: {
          ...state.filtrosAsistencia,
          estado: action.payload
        }
      };
    
    case 'RESET_FILTROS':
      return {
        ...state,
        filtrosAsistencia: {
          colaboradorId: null,
          año: new Date().getFullYear(),
          mes: new Date().getMonth() + 1,
          estado: 'todos',
          fechaInicio: null,
          fechaFin: null
        }
      };
    
    // ========== VISTA ==========
    
    case 'SET_VISTA_ASISTENCIA':
      return {
        ...state,
        vistaAsistencia: action.payload
      };
    
    // ========== MODAL ==========
    
    case 'OPEN_MODAL_ASISTENCIA':
      return {
        ...state,
        modalAsistencia: {
          isOpen: true,
          modo: action.payload.modo || 'crear',
          asistencia: action.payload.asistencia || null,
          colaboradorPreseleccionado: action.payload.colaborador || null
        }
      };
    
    case 'CLOSE_MODAL_ASISTENCIA':
      return {
        ...state,
        modalAsistencia: {
          isOpen: false,
          modo: 'crear',
          asistencia: null,
          colaboradorPreseleccionado: null
        }
      };
    
    // ========== PAGINACIÓN ==========
    
    case 'SET_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload
        }
      };
    
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload
        }
      };
    
    case 'RESET_PAGINATION':
      return {
        ...state,
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false
        }
      };
    
    // ========== LIMPIAR ESTADO ==========
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'RESET_STATE':
      return initialAsistenciaState;
    
    default:
      return state;
  }
}

// ========== SELECTORES ==========

/**
 * Selectores memoizados para acceso eficiente al estado
 */
export const selectors = {
  
  /**
   * Verificar si está cargando
   */
  isLoading: (state) => state.loading,
  
  /**
   * Verificar si hay error
   */
  hasError: (state) => state.error !== null,
  
  /**
   * Obtener asistencias filtradas por colaborador
   */
  getAsistenciasPorColaborador: (state, colaboradorId) => {
    if (!colaboradorId) return state.asistencias;
    
    return state.asistencias.filter(
      a => a.colaboradorUserId === colaboradorId
    );
  },
  
  /**
   * Obtener asistencias filtradas por fecha
   */
  getAsistenciasPorFecha: (state, fecha) => {
    const fechaNormalizada = new Date(fecha).toDateString();
    
    return state.asistencias.filter(a => {
      const fechaAsistencia = new Date(a.fecha).toDateString();
      return fechaAsistencia === fechaNormalizada;
    });
  },
  
  /**
   * Obtener asistencias filtradas por estado
   */
  getAsistenciasPorEstado: (state, estado) => {
    if (estado === 'todos') return state.asistencias;
    
    return state.asistencias.filter(a => a.estado === estado);
  },
  
  /**
   * Obtener asistencias del mes actual según filtros
   */
  getAsistenciasMesActual: (state) => {
    const { año, mes, colaboradorId, estado } = state.filtrosAsistencia;
    
    return state.asistencias.filter(asistencia => {
      const fecha = new Date(asistencia.fecha);
      const cumpleMes = fecha.getFullYear() === año && fecha.getMonth() + 1 === mes;
      const cumpleColaborador = !colaboradorId || asistencia.colaboradorUserId === colaboradorId;
      const cumpleEstado = estado === 'todos' || asistencia.estado === estado;
      
      return cumpleMes && cumpleColaborador && cumpleEstado;
    });
  },
  
  /**
   * Obtener estadísticas rápidas
   */
  getEstadisticasRapidas: (state) => {
    const asistencias = state.asistencias;
    
    return {
      total: asistencias.length,
      presentes: asistencias.filter(a => a.estado === 'presente').length,
      ausentes: asistencias.filter(a => a.estado === 'ausente').length,
      tardanzas: asistencias.filter(a => a.estado === 'tardanza').length,
      permisos: asistencias.filter(a => a.estado === 'permiso').length
    };
  },
  
  /**
   * Verificar si el modal está abierto
   */
  isModalOpen: (state) => state.modalAsistencia.isOpen,
  
  /**
   * Obtener modo del modal
   */
  getModalMode: (state) => state.modalAsistencia.modo,
  
  /**
   * Verificar si hay asistencia seleccionada
   */
  hasAsistenciaSeleccionada: (state) => state.asistenciaSeleccionada !== null,
  
  /**
   * Obtener vista actual
   */
  getVistaActual: (state) => state.vistaAsistencia,
  
  /**
   * Verificar si hay más páginas
   */
  hasMorePages: (state) => state.pagination.hasMore,
  
  /**
   * Obtener total de registros
   */
  getTotalRegistros: (state) => state.pagination.total
};

export default asistenciaReducer;
