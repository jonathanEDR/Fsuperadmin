// Funciones utilitarias para manejo de fechas en zona horaria local

/**
 * Convierte una fecha UTC/ISO a fecha local
 * @param {string} dateString - Fecha en formato ISO o string
 * @returns {Date|null} - Fecha ajustada a zona horaria local o null si es inválida
 */
export const getLocalDate = (dateString) => {
  if (!dateString) return null;
  
  // Si viene como string ISO, convertir a fecha local
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  // Ajustar a zona horaria local (compensar offset UTC)
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + tzOffset);
};

/**
 * Convierte una fecha local a string ISO sin zona horaria
 * @param {Date} date - Fecha local
 * @returns {string} - Fecha en formato ISO sin zona horaria
 */
export const toLocalISOString = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzOffset).toISOString().slice(0, -1);
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD para inputs de tipo date
 * @returns {string} - Fecha actual en formato YYYY-MM-DD
 */
export const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha y hora actual en formato YYYY-MM-DDTHH:mm para inputs datetime-local
 * Ajustado para zona horaria de Perú (UTC-5)
 * @returns {string} - Fecha y hora actual en formato ISO local
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
 * Formatea una fecha para mostrar en zona horaria local
 * @param {string|Date} dateInput - Fecha a formatear
 * @param {Object} options - Opciones de formato (opcional)
 * @returns {string} - Fecha formateada
 */
export const formatLocalDate = (dateInput, options = {}) => {
  if (!dateInput) return 'N/A';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    // Ajustar a zona horaria local para mostrar
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - tzOffset);
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return localDate.toLocaleString('es-PE', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Fecha inválida';
  }
};

/**
 * Valida que una fecha no sea futura
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {boolean} - true si la fecha es válida (no futura)
 */
export const isValidDateNotFuture = (dateString) => {
  if (!dateString) return false;
  
  const fechaSeleccionada = new Date(dateString + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  
  return fechaSeleccionada <= hoy;
};

/**
 * Convierte una fecha y hora local a formato ISO para enviar al backend
 * Ajustado para zona horaria de Perú (UTC-5)
 * @param {string} localDateTime - Fecha en formato YYYY-MM-DDTHH:mm
 * @returns {string} - Fecha en formato ISO con zona horaria de Perú
 */
export const convertLocalDateTimeToISO = (localDateTime) => {
  if (!localDateTime) return '';
  
  // Interpretar la fecha como si fuera en zona horaria de Perú (UTC-5)
  // El usuario ve y selecciona la hora en formato de Perú
  const peruDate = new Date(localDateTime + ':00.000-05:00');
  
  return peruDate.toISOString();
};
