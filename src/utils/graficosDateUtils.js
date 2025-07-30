// Utilidades específicas para el manejo de fechas en gráficos
// Estas funciones están optimizadas para el procesamiento de datos en charts

/**
 * Convierte una fecha de cualquier formato a Date object para uso en gráficos
 * Maneja correctamente las fechas que vienen del backend con zona horaria de Perú
 * @param {string|Date} fechaString - Fecha en cualquier formato
 * @returns {Date|null} - Date object o null si la fecha es inválida
 */
export const procesarFechaParaGrafico = (fechaString) => {
  if (!fechaString) return null;
  
  try {
    // Si ya es un objeto Date, validarlo y devolverlo
    if (fechaString instanceof Date) {
      return isNaN(fechaString.getTime()) ? null : fechaString;
    }
    
    // Intentar con formato directo primero (ISO strings)
    let fecha = new Date(fechaString);
    
    // Si falla, intentar parseando formatos localizados (DD/MM/YYYY, HH:MM:SS a. m./p. m.)
    if (isNaN(fecha.getTime())) {
      // Formato típico: "10/07/2025, 01:00:00 a. m."
      const fechaLimpia = fechaString
        .replace(/,?\s*(a\.|p\.)\s*m\./gi, '') // Remover " a. m." o " p. m."
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
      
      // Intentar parseado con formato DD/MM/YYYY HH:MM:SS
      const partes = fechaLimpia.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2}):(\d{2})/);
      if (partes) {
        const [, dia, mes, año, hora, minuto, segundo] = partes;
        // Ajustar si era PM (aunque en este caso parece ser formato 24h)
        const esPM = fechaString.toLowerCase().includes('p. m.');
        let horaAjustada = parseInt(hora);
        if (esPM && horaAjustada < 12) horaAjustada += 12;
        if (!esPM && horaAjustada === 12) horaAjustada = 0;
        
        fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia), horaAjustada, parseInt(minuto), parseInt(segundo));
      }
    }
    
    if (isNaN(fecha.getTime())) {
      console.warn('🚫 Fecha no parseable:', fechaString);
      return null;
    }
    
    return fecha;
    
  } catch (error) {
    console.error('Error al procesar fecha para gráfico:', error, fechaString);
    return null;
  }
};

/**
 * Calcula el índice correcto para una fecha según el filtro de tiempo
 * @param {Date} fecha - Fecha a procesar
 * @param {string} filter - Filtro de tiempo ('hoy', 'semana', 'mes', 'anual')
 * @param {Date} startDate - Fecha de inicio del rango
 * @returns {number} - Índice para el array de datos
 */
export const calcularIndiceParaFecha = (fecha, filter, startDate) => {
  if (!fecha || !startDate) return -1;
  
  let indexPos = 0;
  
  switch (filter) {
    case 'hoy':
      // Para hoy: índice basado en horas transcurridas desde startDate
      indexPos = Math.floor((fecha - startDate) / (60 * 60 * 1000));
      break;
      
    case 'semana':
      // Para semana: índice basado en días transcurridos desde startDate
      indexPos = Math.floor((fecha - startDate) / (24 * 60 * 60 * 1000));
      break;
      
    case 'mes':
      // ✅ CORRECCIÓN: Para mes, calcular días transcurridos desde startDate
      // No usar getDate() porque ignora el startDate
      indexPos = Math.floor((fecha - startDate) / (24 * 60 * 60 * 1000));
      break;
      
    case 'anual':
      // Para año: índice basado en el mes (0-11)
      indexPos = fecha.getMonth();
      break;
      
    default:
      // Fallback: días transcurridos desde startDate
      indexPos = Math.floor((fecha - startDate) / (24 * 60 * 60 * 1000));
  }
  
  return indexPos;
};

/**
 * Valida si una fecha está dentro del rango especificado
 * @param {Date} fecha - Fecha a validar
 * @param {Date} startDate - Fecha de inicio del rango
 * @param {Date} endDate - Fecha de fin del rango
 * @returns {boolean} - true si la fecha está dentro del rango
 */
export const fechaEnRango = (fecha, startDate, endDate) => {
  if (!fecha || !startDate || !endDate) return false;
  return fecha >= startDate && fecha < endDate;
};

/**
 * Extrae la fecha válida de un objeto con múltiples campos de fecha
 * @param {Object} objeto - Objeto que puede tener varios campos de fecha
 * @param {Array} camposPrioridad - Array de nombres de campos en orden de prioridad
 * @returns {Date|null} - Primera fecha válida encontrada o null
 */
export const extraerFechaValida = (objeto, camposPrioridad = []) => {
  if (!objeto) return null;
  
  for (let campo of camposPrioridad) {
    if (objeto[campo]) {
      const fecha = procesarFechaParaGrafico(objeto[campo]);
      if (fecha) return fecha;
    }
  }
  
  return null;
};

/**
 * Genera etiquetas para el gráfico según el filtro de tiempo
 * @param {string} filter - Filtro de tiempo
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @returns {Array} - Array de etiquetas para el gráfico
 */
export const generarEtiquetasGrafico = (filter, startDate, endDate) => {
  const labels = [];
  const current = new Date(startDate);

  while (current < endDate) {
    switch (filter) {
      case 'hoy':
        labels.push(current.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
        current.setHours(current.getHours() + 1);
        break;
        
      case 'semana':
        labels.push(current.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          day: 'numeric' 
        }));
        current.setDate(current.getDate() + 1);
        break;
        
      case 'mes':
        labels.push(current.getDate().toString());
        current.setDate(current.getDate() + 1);
        break;
        
      case 'anual':
        labels.push(current.toLocaleDateString('es-ES', { 
          month: 'short' 
        }));
        current.setMonth(current.getMonth() + 1);
        break;
        
      default:
        labels.push(current.toLocaleDateString('es-ES'));
        current.setDate(current.getDate() + 1);
    }
  }

  return labels;
};

/**
 * Calcula el rango de fechas según el filtro seleccionado
 * @param {string} filter - Filtro de tiempo ('hoy', 'semana', 'mes', 'anual')
 * @returns {Object} - Objeto con startDate y endDate
 */
export const calcularRangoFechas = (filter) => {
  const now = new Date();
  let startDate, endDate;

  switch (filter) {
    case 'hoy':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
      
    case 'semana':
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(now.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
      
    case 'mes':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
      
    case 'anual':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      break;
      
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
  }

  return { startDate, endDate };
};
