// Utilidades de fecha unificadas para el frontend - Compatible con backend fechaHoraUtils.js

/**
 * Obtiene la fecha y hora actual en formato ISO
 * @returns {string} - Fecha en formato ISO
 */
export const getFechaHoraActual = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export const obtenerFechaActual = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Valida formato de fecha
 * @param {string} fecha - Fecha a validar
 * @returns {boolean} - true si la fecha es válida
 */
export const validarFormatoFecha = (fecha) => {
  if (!fecha) return false;
  const fechaObj = new Date(fecha);
  return fechaObj instanceof Date && !isNaN(fechaObj);
};

/**
 * Formatea una fecha para mostrar - Compatible con backend
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  
  try {
    // Si ya viene formateada desde el backend, devolverla directamente
    if (typeof fecha === 'string' && (fecha.includes('/') || fecha.includes(':'))) {
      return fecha;
    }
    
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) return 'Fecha inválida';
    
    // Usar el mismo formato que el backend
    return fechaObj.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Fecha inválida';
  }
};

/**
 * Obtiene la fecha y hora actual para input datetime-local
 * Ajustado para zona horaria de Perú (UTC-5)
 * @returns {string} - Fecha en formato YYYY-MM-DDTHH:mm
 */
export const getLocalDateTimeString = () => {
  const now = new Date();
  // Ajustar para zona horaria de Perú (UTC-5)
  const peruOffset = -5 * 60; // UTC-5 en minutos
  const localOffset = now.getTimezoneOffset(); // Offset local en minutos
  const peruTime = new Date(now.getTime() + (localOffset + peruOffset) * 60000);
  
  const year = peruTime.getFullYear();
  const month = String(peruTime.getMonth() + 1).padStart(2, '0');
  const day = String(peruTime.getDate()).padStart(2, '0');
  const hours = String(peruTime.getHours()).padStart(2, '0');
  const minutes = String(peruTime.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convierte fecha/hora local a ISO para enviar al backend
 * @param {string} localDateTime - Fecha en formato YYYY-MM-DDTHH:mm
 * @returns {string} - Fecha en formato ISO
 */
export const convertLocalDateTimeToISO = (localDateTime) => {
  if (!localDateTime) return '';
  
  try {
    // Crear fecha interpretándola como hora local de Perú
    const peruDate = new Date(localDateTime + ':00.000-05:00');
    return peruDate.toISOString();
  } catch (error) {
    console.error('Error al convertir fecha local a ISO:', error);
    return '';
  }
};

/**
 * Valida que una fecha no sea futura
 * @param {string} dateString - Fecha en formato YYYY-MM-DDTHH:mm
 * @returns {boolean} - true si la fecha es válida (no futura)
 */
export const isValidDateNotFuture = (dateString) => {
  if (!dateString) return false;
  
  try {
    const fechaSeleccionada = new Date(dateString);
    const hoy = new Date();
    
    return fechaSeleccionada <= hoy;
  } catch (error) {
    return false;
  }
};

/**
 * Convierte una fecha UTC a fecha local para visualización
 * @param {string} utcDateString - Fecha en formato UTC/ISO
 * @returns {string} - Fecha formateada para mostrar
 */
export const formatLocalDate = (utcDateString) => {
  if (!utcDateString) return 'N/A';
  
  try {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return formatearFecha(date);
  } catch (error) {
    console.error('Error al formatear fecha local:', error);
    return 'Fecha inválida';
  }
};

/**
 * Convierte una fecha UTC/ISO a fecha local (Date object) 
 * Compatible con el comportamiento de getLocalDate de dateUtils
 * @param {string} dateString - Fecha en formato ISO o string
 * @returns {Date|null} - Fecha ajustada a zona horaria local o null si es inválida
 */
export const getLocalDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Si la fecha viene formateada desde el backend, intentar parsearlo
    if (typeof dateString === 'string' && (dateString.includes('/') || dateString.includes(':'))) {
      // Si ya viene formateada, intentar convertirla a Date
      // Formato esperado del backend: DD/MM/YYYY, HH:mm:ss
      const parts = dateString.split(', ');
      if (parts.length === 2) {
        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');
        
        // Crear fecha en zona local
        const localDate = new Date(year, month - 1, day, hour, minute, second || 0);
        if (!isNaN(localDate.getTime())) {
          return localDate;
        }
      }
    }
    
    // Si viene como string ISO, convertir a fecha local
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    // Para fechas ISO, la Date object ya maneja la zona horaria correctamente
    return date;
  } catch (error) {
    console.error('Error al convertir fecha a local:', error);
    return null;
  }
};

// Exportación adicional para compatibilidad con Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFechaHoraActual,
    obtenerFechaActual,
    validarFormatoFecha,
    formatearFecha,
    getLocalDateTimeString,
    convertLocalDateTimeToISO,
    isValidDateNotFuture,
    formatLocalDate,
    getLocalDate
  };
}
