/**
 * Servicio de API para Notificaciones
 * Cliente HTTP para interactuar con el backend de notificaciones
 */

// Usar VITE_BACKEND_URL (producción) o fallback a localhost
const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🔔 NotificationService - API_URL:', API_URL);

/**
 * Obtener token de autenticación
 */
async function getAuthHeaders(getToken) {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Obtener notificaciones del usuario
 * @param {Function} getToken - Función para obtener el token de Clerk
 * @param {Object} options - Opciones de filtrado
 */
export async function fetchNotifications(getToken, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false, type } = options;
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
    ...(unreadOnly && { unreadOnly: 'true' }),
    ...(type && { type })
  });
  
  const headers = await getAuthHeaders(getToken);
  
  const response = await fetch(`${API_URL}/api/notifications?${params}`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    throw new Error('Error obteniendo notificaciones');
  }
  
  return response.json();
}

/**
 * Obtener conteo de notificaciones no leídas
 * @param {Function} getToken - Función para obtener el token de Clerk
 */
export async function fetchUnreadCount(getToken) {
  const headers = await getAuthHeaders(getToken);
  
  const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    throw new Error('Error obteniendo conteo de notificaciones');
  }
  
  return response.json();
}

/**
 * Marcar una notificación como leída
 * @param {Function} getToken - Función para obtener el token de Clerk
 * @param {string} notificationId - ID de la notificación
 */
export async function markAsRead(getToken, notificationId) {
  const headers = await getAuthHeaders(getToken);
  
  const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers
  });
  
  if (!response.ok) {
    throw new Error('Error marcando notificación como leída');
  }
  
  return response.json();
}

/**
 * Marcar todas las notificaciones como leídas
 * @param {Function} getToken - Función para obtener el token de Clerk
 */
export async function markAllAsRead(getToken) {
  const headers = await getAuthHeaders(getToken);
  
  const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
    method: 'PATCH',
    headers
  });
  
  if (!response.ok) {
    throw new Error('Error marcando todas como leídas');
  }
  
  return response.json();
}

/**
 * Eliminar una notificación
 * @param {Function} getToken - Función para obtener el token de Clerk
 * @param {string} notificationId - ID de la notificación
 */
export async function deleteNotification(getToken, notificationId) {
  const headers = await getAuthHeaders(getToken);
  
  const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
    method: 'DELETE',
    headers
  });
  
  if (!response.ok) {
    throw new Error('Error eliminando notificación');
  }
  
  return response.json();
}

/**
 * Obtener estadísticas de notificaciones
 * @param {Function} getToken - Función para obtener el token de Clerk
 */
export async function fetchNotificationStats(getToken) {
  const headers = await getAuthHeaders(getToken);
  
  const response = await fetch(`${API_URL}/api/notifications/stats`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    throw new Error('Error obteniendo estadísticas');
  }
  
  return response.json();
}

/**
 * Eliminar TODAS las notificaciones (solo super_admin)
 * @param {Function} getToken - Función para obtener el token de Clerk
 */
export async function deleteAllNotifications(getToken) {
  const headers = await getAuthHeaders(getToken);
  
  const response = await fetch(`${API_URL}/api/notifications/all`, {
    method: 'DELETE',
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error eliminando notificaciones');
  }
  
  return response.json();
}

export default {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  fetchNotificationStats
};
