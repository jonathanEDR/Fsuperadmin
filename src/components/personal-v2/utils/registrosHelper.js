/**
 * Utilidades para manejar registros de gestión personal
 * Sistema de registros independientes por tipo
 */

/**
 * Agrupar registros por fecha
 * Combina todos los registros del mismo día en un objeto con totales
 */
export const agruparRegistrosPorFecha = (registros) => {
  if (!registros || registros.length === 0) {
    return {};
  }

  const grupos = {};

  registros.forEach(registro => {
    // Obtener fecha en formato local con zona horaria de Perú
    const fecha = new Date(registro.fechaDeGestion);
    const fechaKey = fecha.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });

    // Inicializar grupo si no existe
    if (!grupos[fechaKey]) {
      grupos[fechaKey] = {
        fecha: fecha,
        fechaISO: registro.fechaDeGestion,
        pagoDiario: 0,
        bonificacion: 0,
        faltantes: 0,
        gastos: 0,
        adelantos: 0,
        registros: [],
        registrosPorTipo: {
          pago_diario: [],
          faltante_cobro: [],
          gasto_cobro: [],
          adelanto_manual: []
        }
      };
    }

    const grupo = grupos[fechaKey];

    // Acumular montos según el tipo de registro
    const tipo = registro.tipo || 'pago_diario'; // Retrocompatibilidad

    switch (tipo) {
      case 'pago_diario':
        grupo.pagoDiario += registro.pagodiario || 0;
        grupo.bonificacion += registro.bonificacion || 0;
        grupo.adelantos += registro.adelanto || 0;
        grupo.registrosPorTipo.pago_diario.push(registro);
        break;
      
      case 'faltante_cobro':
      case 'faltante_manual': // 🆕 Incluir faltantes manuales
      case 'descuento_tardanza': // 🆕 Incluir descuentos por tardanza
        grupo.faltantes += registro.faltante || 0;
        grupo.registrosPorTipo.faltante_cobro.push(registro);
        break;
      
      case 'gasto_cobro':
        grupo.gastos += registro.monto || 0;
        grupo.registrosPorTipo.gasto_cobro.push(registro);
        break;
      
      case 'adelanto_manual':
        grupo.adelantos += registro.adelanto || 0;
        grupo.registrosPorTipo.adelanto_manual.push(registro);
        break;
      
      case 'bonificacion_manual': // 🆕 Bonificaciones manuales
      case 'bonificacion_meta':   // 🆕 Bonificaciones por metas
        grupo.bonificacion += registro.bonificacion || 0;
        grupo.registrosPorTipo.pago_diario.push(registro); // Agrupa con pagos
        break;
      
      case 'ajuste_manual': // 🆕 Ajustes manuales (puede tener bonificación o adelanto)
        grupo.bonificacion += registro.bonificacion || 0;
        grupo.adelantos += registro.adelanto || 0;
        grupo.registrosPorTipo.pago_diario.push(registro);
        break;
      
      default:
        // Retrocompatibilidad: Registros antiguos sin tipo
        grupo.pagoDiario += registro.pagodiario || 0;
        grupo.bonificacion += registro.bonificacion || 0;
        grupo.faltantes += registro.faltante || 0;
        grupo.gastos += registro.monto || 0;
        grupo.adelantos += registro.adelanto || 0;
        grupo.registrosPorTipo.pago_diario.push(registro);
        break;
    }

    // Agregar al array de registros
    grupo.registros.push(registro);
  });

  // Calcular totales para cada grupo
  Object.keys(grupos).forEach(fechaKey => {
    const grupo = grupos[fechaKey];
    
    // ⚠️ NUEVA FÓRMULA: Gastos NO se restan (son solo referenciales)
    // Total a pagar = Pago Diario + Bonificación - Faltantes - Adelantos
    grupo.totalAPagar = grupo.pagoDiario + grupo.bonificacion - grupo.faltantes - grupo.adelantos;
    
    // Contadores
    grupo.totalRegistros = grupo.registros.length;
    grupo.tieneRegistrosAutomaticos = 
      grupo.registrosPorTipo.faltante_cobro.length > 0 || 
      grupo.registrosPorTipo.gasto_cobro.length > 0;
  });

  return grupos;
};

/**
 * Calcular totales generales de todos los registros
 */
export const calcularTotalesGenerales = (registros) => {
  if (!registros || registros.length === 0) {
    return {
      totalPagosDiarios: 0,
      totalBonificaciones: 0,
      totalFaltantes: 0,
      totalGastos: 0,
      totalAdelantos: 0,
      totalAPagar: 0,
      totalRegistros: 0,
      porTipo: {
        pago_diario: 0,
        faltante_cobro: 0,
        gasto_cobro: 0,
        adelanto_manual: 0
      }
    };
  }

  const totales = registros.reduce((acc, registro) => {
    const tipo = registro.tipo || 'pago_diario';

    // Acumular por tipo
    acc.porTipo[tipo] = (acc.porTipo[tipo] || 0) + 1;

    switch (tipo) {
      case 'pago_diario':
        acc.totalPagosDiarios += registro.pagodiario || 0;
        acc.totalBonificaciones += registro.bonificacion || 0;
        acc.totalAdelantos += registro.adelanto || 0;
        break;
      
      case 'faltante_cobro':
      case 'faltante_manual': // 🆕 Incluir faltantes manuales
      case 'descuento_tardanza': // 🆕 Incluir descuentos por tardanza
        acc.totalFaltantes += registro.faltante || 0;
        break;
      
      case 'gasto_cobro':
        acc.totalGastos += registro.monto || 0;
        break;
      
      case 'adelanto_manual':
        acc.totalAdelantos += registro.adelanto || 0;
        break;
      
      case 'bonificacion_manual':
      case 'bonificacion_meta':
        acc.totalBonificaciones += registro.bonificacion || 0;
        break;
      
      case 'ajuste_manual':
        acc.totalBonificaciones += registro.bonificacion || 0;
        acc.totalAdelantos += registro.adelanto || 0;
        break;
      
      default:
        // Retrocompatibilidad
        acc.totalPagosDiarios += registro.pagodiario || 0;
        acc.totalFaltantes += registro.faltante || 0;
        acc.totalGastos += registro.monto || 0;
        acc.totalAdelantos += registro.adelanto || 0;
        break;
    }

    return acc;
  }, {
    totalPagosDiarios: 0,
    totalBonificaciones: 0,
    totalFaltantes: 0,
    totalGastos: 0,
    totalAdelantos: 0,
    totalRegistros: registros.length,
    porTipo: {
      pago_diario: 0,
      faltante_cobro: 0,
      gasto_cobro: 0,
      adelanto_manual: 0
    }
  });

  // ⚠️ NUEVA FÓRMULA: Gastos NO se restan (son solo referenciales)
  // Total a pagar = Pagos Diarios + Bonificaciones - Faltantes - Adelantos
  totales.totalAPagar = totales.totalPagosDiarios + totales.totalBonificaciones - totales.totalFaltantes - totales.totalAdelantos;

  return totales;
};

/**
 * Filtrar registros por tipo
 */
export const filtrarPorTipo = (registros, tipo) => {
  if (!registros || registros.length === 0) {
    return [];
  }

  return registros.filter(registro => {
    const registroTipo = registro.tipo || 'pago_diario';
    return registroTipo === tipo;
  });
};

/**
 * Obtener descripción amigable del tipo de registro
 * 🆕 Ahora detecta si es solo bonificación/adelanto (sin pago diario)
 */
export const obtenerDescripcionTipo = (tipo, registro = null) => {
  // Si es pago_diario, verificar si es solo bonificación o adelanto
  if (tipo === 'pago_diario' && registro) {
    const pagoDiario = registro.pagodiario || 0;
    const bonificacion = registro.bonificacion || 0;
    const adelanto = registro.adelanto || 0;
    
    // Si NO tiene pago diario pero SÍ tiene bonificación
    if (pagoDiario === 0 && bonificacion > 0) {
      return 'Bonificación';
    }
    // Si NO tiene pago diario pero SÍ tiene adelanto
    if (pagoDiario === 0 && adelanto > 0) {
      return 'Adelanto';
    }
    // Si tiene pago diario Y bonificación
    if (pagoDiario > 0 && bonificacion > 0) {
      return 'Pago Diario + Bonificación';
    }
  }
  
  const descripciones = {
    'pago_diario': 'Pago Diario',
    'faltante_cobro': 'Faltante de Cobro',
    'faltante_manual': 'Descuento Manual',
    'descuento_tardanza': 'Descuento por Tardanza', // 🆕 Descuento automático por tardanza
    'gasto_cobro': 'Gasto Imprevisto',
    'adelanto_manual': 'Adelanto Manual',
    'bonificacion_manual': 'Bonificación Especial',
    'bonificacion_meta': 'Bonificación por Meta' // 🆕 Bonificación automática
  };

  return descripciones[tipo] || 'Registro';
};

/**
 * Obtener color del badge según el tipo
 */
export const obtenerColorTipo = (tipo) => {
  const colores = {
    'pago_diario': 'bg-green-100 text-green-800',
    'faltante_cobro': 'bg-orange-100 text-orange-800',
    'faltante_manual': 'bg-red-100 text-red-800',
    'descuento_tardanza': 'bg-amber-100 text-amber-800', // 🆕 Ámbar para tardanzas
    'gasto_cobro': 'bg-red-100 text-red-800',
    'adelanto_manual': 'bg-blue-100 text-blue-800',
    'bonificacion_manual': 'bg-yellow-100 text-yellow-800',
    'bonificacion_meta': 'bg-purple-100 text-purple-800' // 🆕 Morado para metas
  };

  return colores[tipo] || 'bg-gray-100 text-gray-800';
};

/**
 * 🆕 Obtener color del texto del monto según el tipo de registro
 * Detecta si es bonificación, adelanto, etc.
 */
export const obtenerColorMontoTexto = (tipo, registro = null) => {
  // Si es pago_diario, verificar si es solo bonificación o adelanto
  if (tipo === 'pago_diario' && registro) {
    const pagoDiario = registro.pagodiario || 0;
    const bonificacion = registro.bonificacion || 0;
    const adelanto = registro.adelanto || 0;
    
    // Si NO tiene pago diario pero SÍ tiene bonificación (solo bonificación)
    if (pagoDiario === 0 && bonificacion > 0) {
      return 'text-yellow-600'; // Amarillo/dorado para bonificaciones
    }
    // Si NO tiene pago diario pero SÍ tiene adelanto
    if (pagoDiario === 0 && adelanto > 0) {
      return 'text-orange-600'; // Naranja para adelantos
    }
    // Si tiene pago diario Y bonificación
    if (pagoDiario > 0 && bonificacion > 0) {
      return 'text-green-600'; // Verde (pago diario + bonificación)
    }
  }
  
  const colores = {
    'pago_diario': 'text-green-600',
    'faltante_cobro': 'text-orange-600',
    'faltante_manual': 'text-orange-600',
    'descuento_tardanza': 'text-orange-600',
    'gasto_cobro': 'text-red-600',
    'adelanto_manual': 'text-blue-600',
    'bonificacion_manual': 'text-yellow-600',
    'bonificacion_meta': 'text-purple-600' // 🆕 Morado para metas
  };

  return colores[tipo] || 'text-gray-600';
};

/**
 * Obtener icono según el tipo
 * 🆕 Ahora detecta si es solo bonificación/adelanto
 */
export const obtenerIconoTipo = (tipo, registro = null) => {
  // Si es pago_diario, verificar si es solo bonificación o adelanto
  if (tipo === 'pago_diario' && registro) {
    const pagoDiario = registro.pagodiario || 0;
    const bonificacion = registro.bonificacion || 0;
    const adelanto = registro.adelanto || 0;
    
    // Si NO tiene pago diario pero SÍ tiene bonificación
    if (pagoDiario === 0 && bonificacion > 0) {
      return '🎁';
    }
    // Si NO tiene pago diario pero SÍ tiene adelanto
    if (pagoDiario === 0 && adelanto > 0) {
      return '💸';
    }
    // Si tiene pago diario Y bonificación
    if (pagoDiario > 0 && bonificacion > 0) {
      return '🎁';
    }
  }
  
  const iconos = {
    'pago_diario': '💵',
    'faltante_cobro': '⚠️',
    'faltante_manual': '⚠️',
    'descuento_tardanza': '⏰',
    'gasto_cobro': '💸',
    'adelanto_manual': '🔵',
    'bonificacion_manual': '🎁',
    'bonificacion_meta': '🎯' // 🆕 Bonificación automática por meta
  };

  return iconos[tipo] || '📋';
};

/**
 * Formatear monto con signo según el tipo
 * Ahora incluye bonificaciones en el cálculo
 */
export const formatearMontoConSigno = (registro) => {
  const tipo = registro.tipo || 'pago_diario';
  let monto = 0;
  let signo = '';

  switch (tipo) {
    case 'pago_diario':
      // 🆕 Incluir tanto pagodiario como bonificación
      const pagoDiario = registro.pagodiario || 0;
      const bonificacion = registro.bonificacion || 0;
      monto = pagoDiario + bonificacion;
      signo = '+';
      break;
    
    case 'bonificacion_manual':
    case 'bonificacion_meta':
      // 🆕 Bonificaciones independientes (manuales y por metas)
      monto = registro.bonificacion || 0;
      signo = '+';
      break;
    
    case 'faltante_cobro':
    case 'faltante_manual':
    case 'descuento_tardanza':
      // 🆕 Todos los tipos de faltantes/descuentos
      monto = registro.faltante || 0;
      signo = '-';
      break;
    
    case 'gasto_cobro':
      monto = registro.monto || 0;
      signo = '-';
      break;
    
    case 'adelanto_manual':
      monto = registro.adelanto || 0;
      signo = '-';
      break;
    
    default:
      monto = (registro.pagodiario || 0) + (registro.bonificacion || 0);
      signo = '+';
      break;
  }

  return `${signo} S/ ${monto.toFixed(2)}`;
};

/**
 * Verificar si un registro es automático (de cobros, metas o tardanza)
 */
export const esRegistroAutomatico = (registro) => {
  return registro.origenDatos === 'cobro_automatico' || 
         registro.origenDatos === 'automatico_metas' ||
         registro.origenDatos === 'asistencia_tardanza' ||
         registro.tipo === 'bonificacion_meta' ||
         registro.tipo === 'descuento_tardanza';
};

/**
 * Ordenar registros por fecha (más reciente primero)
 */
export const ordenarPorFecha = (registros, orden = 'desc') => {
  if (!registros || registros.length === 0) {
    return [];
  }

  return [...registros].sort((a, b) => {
    const fechaA = new Date(a.fechaDeGestion);
    const fechaB = new Date(b.fechaDeGestion);
    
    return orden === 'desc' ? fechaB - fechaA : fechaA - fechaB;
  });
};
