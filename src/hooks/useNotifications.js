/**
 * Hook personalizado para manejo de notificaciones
 * Proporciona estado y acciones para notificaciones en la app
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import * as notificationService from '../services/notificationService';

// Intervalo de polling en milisegundos (5 segundos para mayor responsividad)
const POLLING_INTERVAL = 5000;

// Función para reproducir sonido de notificación
const playNotificationSound = () => {
  try {
    // Crear contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Crear un oscilador para generar el sonido
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar el sonido (tipo campana suave)
    oscillator.frequency.setValueAtTime(830, audioContext.currentTime); // Frecuencia inicial
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';

    // Configurar volumen con fade out
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Reproducir
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Segundo tono (efecto de campana)
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.setValueAtTime(1050, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.25);
    }, 150);

  } catch (error) {
    // Silenciar errores de audio (puede fallar si el usuario no ha interactuado con la página)
  }
};

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

  // Ref para el conteo anterior de no leídas (para detectar nuevas notificaciones)
  const prevUnreadCountRef = useRef(0);
  
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
        const newUnreadCount = result.unreadCount || 0;
        setNotifications(result.data || []);
        setUnreadCount(newUnreadCount);
        setHasMore(result.pagination?.hasMore || false);

        // Inicializar el ref del conteo anterior (sin sonido en carga inicial)
        if (!initialLoadDone) {
          prevUnreadCountRef.current = newUnreadCount;
        }
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

      // Resetear conteo y actualizar ref para evitar sonido falso
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
      
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
   * Eliminar TODAS las notificaciones (solo super_admin)
   */
  const deleteAllNotifications = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;
    
    try {
      const result = await notificationService.deleteAllNotifications(getToken);
      
      // Limpiar estado local
      setNotifications([]);
      setUnreadCount(0);
      
      return result;
    } catch (err) {
      console.error('Error eliminando todas las notificaciones:', err);
      throw err;
    }
  }, [getToken, isSignedIn, isLoaded]);
  
  /**
   * Refrescar todas las notificaciones
   */
  const refresh = useCallback((limit = 20) => {
    return fetchNotifications({ limit, skip: 0 });
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
        const newUnreadCount = result.unreadCount || 0;

        // Reproducir sonido si hay nuevas notificaciones no leídas
        if (newUnreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current >= 0) {
          playNotificationSound();
        }

        // Actualizar el ref del conteo anterior
        prevUnreadCountRef.current = newUnreadCount;

        setNotifications(result.data || []);
        setUnreadCount(newUnreadCount);
        setHasMore(result.pagination?.hasMore || false);
      }
    } catch (err) {
      // Silenciar errores de polling
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
    deleteAllNotifications,
    refreshUnreadCount
  };
}

export default useNotifications;
