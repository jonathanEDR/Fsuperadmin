/**
 * Hook personalizado para manejo de notificaciones
 * Proporciona estado y acciones para notificaciones en la app
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import * as notificationService from '../services/notificationService';

// Intervalo de polling en milisegundos (30 segundos)
const POLLING_INTERVAL = 30000;

export function useNotifications() {
  const { getToken, isSignedIn } = useAuth();
  
  // Estados
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Ref para el polling interval
  const pollingRef = useRef(null);
  
  /**
   * Cargar notificaciones
   */
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!isSignedIn) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await notificationService.fetchNotifications(getToken, options);
      
      if (result.success) {
        setNotifications(result.data);
        setUnreadCount(result.unreadCount);
        setHasMore(result.pagination?.hasMore || false);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);
  
  /**
   * Actualizar solo el conteo de no leídas (más ligero)
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const result = await notificationService.fetchUnreadCount(getToken);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (err) {
      console.error('Error actualizando conteo:', err);
    }
  }, [getToken, isSignedIn]);
  
  /**
   * Marcar una notificación como leída
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!isSignedIn) return;
    
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
  }, [getToken, isSignedIn]);
  
  /**
   * Marcar todas como leídas
   */
  const markAllAsRead = useCallback(async () => {
    if (!isSignedIn) return;
    
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
  }, [getToken, isSignedIn]);
  
  /**
   * Eliminar una notificación
   */
  const deleteNotification = useCallback(async (notificationId) => {
    if (!isSignedIn) return;
    
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
  }, [getToken, isSignedIn, notifications]);
  
  /**
   * Refrescar todas las notificaciones
   */
  const refresh = useCallback(() => {
    return fetchNotifications({ limit: 20, skip: 0 });
  }, [fetchNotifications]);
  
  // Efecto para cargar notificaciones iniciales
  useEffect(() => {
    if (isSignedIn) {
      fetchNotifications({ limit: 20, skip: 0 });
    }
  }, [isSignedIn, fetchNotifications]);
  
  // Efecto para polling (actualización periódica)
  useEffect(() => {
    if (!isSignedIn) return;
    
    // Iniciar polling
    pollingRef.current = setInterval(() => {
      refreshUnreadCount();
    }, POLLING_INTERVAL);
    
    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isSignedIn, refreshUnreadCount]);
  
  return {
    // Estado
    notifications,
    unreadCount,
    loading,
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
