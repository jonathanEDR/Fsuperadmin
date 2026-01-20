/**
 * Hook personalizado para manejo de notificaciones
 * Proporciona estado y acciones para notificaciones en la app
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import * as notificationService from '../services/notificationService';

// Intervalo de polling en milisegundos (5 segundos para mayor responsividad)
const POLLING_INTERVAL = 5000;

export function useNotifications() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  
  // Estados
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Ref para el polling interval
  const pollingRef = useRef(null);
  
  /**
   * Cargar notificaciones
   */
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!isSignedIn || !isLoaded) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await notificationService.fetchNotifications(getToken, options);
      
      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.unreadCount || 0);
        setHasMore(result.pagination?.hasMore || false);
      } else {
        // API respondió pero sin success
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError(err.message || 'Error de conexión');
      // No limpiar notificaciones existentes en caso de error de red
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  }, [getToken, isSignedIn, isLoaded]);
  
  /**
   * Actualizar solo el conteo de no leídas (más ligero)
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;
    
    try {
      const result = await notificationService.fetchUnreadCount(getToken);
      if (result.success) {
        setUnreadCount(result.count || 0);
      }
    } catch (err) {
      // Silenciar errores de polling para no molestar al usuario
      console.warn('Error actualizando conteo:', err);
    }
  }, [getToken, isSignedIn, isLoaded]);
  
  /**
   * Marcar una notificación como leída
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!isSignedIn || !isLoaded) return;
    
    try {
      await notificationService.markAsRead(getToken, notificationId);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      );
      
      // Decrementar conteo
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Error marcando como leída:', err);
      throw err;
    }
  }, [getToken, isSignedIn, isLoaded]);
  
  /**
   * Marcar todas como leídas
   */
  const markAllAsRead = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;
    
    try {
      await notificationService.markAllAsRead(getToken);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      
      // Resetear conteo
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
      throw err;
    }
  }, [getToken, isSignedIn, isLoaded]);
  
  /**
   * Eliminar una notificación
   */
  const deleteNotification = useCallback(async (notificationId) => {
    if (!isSignedIn || !isLoaded) return;
    
    try {
      await notificationService.deleteNotification(getToken, notificationId);
      
      // Actualizar estado local
      const deletedNotification = notifications.find(n => n._id === notificationId);
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Actualizar conteo si era no leída
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      console.error('Error eliminando notificación:', err);
      throw err;
    }
  }, [getToken, isSignedIn, isLoaded, notifications]);
  
  /**
   * Refrescar todas las notificaciones
   */
  const refresh = useCallback(() => {
    return fetchNotifications({ limit: 20, skip: 0 });
  }, [fetchNotifications]);
  
  // Efecto para cargar notificaciones iniciales
  useEffect(() => {
    if (isLoaded && isSignedIn && !initialLoadDone) {
      fetchNotifications({ limit: 20, skip: 0 });
    }
  }, [isLoaded, isSignedIn, initialLoadDone, fetchNotifications]);
  
  // Efecto para polling (actualización periódica)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    
    // Iniciar polling - actualiza toda la lista de notificaciones
    pollingRef.current = setInterval(() => {
      // Actualizar notificaciones completas (silencioso, sin loading)
      fetchNotificationsQuiet();
    }, POLLING_INTERVAL);
    
    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isLoaded, isSignedIn]);
  
  /**
   * Fetch silencioso para polling (no muestra loading)
   */
  const fetchNotificationsQuiet = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;
    
    try {
      const result = await notificationService.fetchNotifications(getToken, { limit: 20, skip: 0 });
      
      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.unreadCount || 0);
        setHasMore(result.pagination?.hasMore || false);
      }
    } catch (err) {
      // Silenciar errores de polling
      console.warn('Error en polling:', err);
    }
  }, [getToken, isSignedIn, isLoaded]);
  
  return {
    // Estado
    notifications,
    unreadCount,
    loading: loading || (!isLoaded),
    error,
    hasMore,
    
    // Acciones
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount
  };
}

export default useNotifications;
