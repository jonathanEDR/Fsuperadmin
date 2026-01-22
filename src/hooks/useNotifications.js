/**
 * Hook personalizado para manejo de notificaciones
 * Proporciona estado y acciones para notificaciones en la app
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import * as notificationService from '../services/notificationService';

// Intervalo de polling en milisegundos (5 segundos para mayor responsividad)
const POLLING_INTERVAL = 5000;

// AudioContext persistente para mejor compatibilidad
let audioContextInstance = null;
let userHasInteracted = false;
let audioElement = null;

// Crear elemento de audio como fallback (sonido de notificación)
if (typeof window !== 'undefined') {
  // Crear un audio element con un sonido base64 embebido (pequeño beep)
  audioElement = new Audio();
  audioElement.volume = 0.5;
  
  // Sonido de notificación corto en base64 (beep simple)
  const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVIvbZzA0MCobEkzgbzQ0sCobEkzgbzQ0sCobEk7ia/H2Me1iFZIgrXL17iqZDpxlMDN0b2gaEhDa4m0x9K/qXNTZYCtwtPBoHJSZoKwyNe/p3FWaYSuyNa+p3FWaYSuyNa+p3FWaYSuyNa+p3FWaYSuyNa+p3FWaYSuyNa+p3FWaYSuyNa+p3JZbYexy9a+pW5Ua4WvytfApXFYa4WtydTCpXNabIety9XCpXNabIety9XCpXRcc4u00NXAonBXaIKsyNbDpnZedY641NbBn2xTZH6oxNfFqHhge5G51dTAmWdQYHuow9jJq31kf5W919TAmmhRYHynw9jJrH9mf5e819W/mGVOXXijwNnLr4JpgZq+2NW+lWFLWnWfvdnOsoVsg5291dO8kl5IVnGbvNvRtohtg5y71NK5jlpFU22Yu9zVuYtwg5u619K3ilZBT2mVut/Yu41xg5i41c+0hVI+TWaSuuDavJByhJW219CyhU47S2OQuuHcvpJyhZK019CvgEw4SWCOueHewJRyg4+y1MusfEk1RV2MueLfwpZzhI2v0cmnekc0Q1qJt+TixJlzhIqrzcaieEQyQFeGtebkyZx0gYaozMOfdkExP1SEteflzJ93f4OkysGcc0AwPVGBtefo0KF4fYCgyb6YcT4uOk5+s+fqz6R5fH2dx7uVbTwsN0t7sejr0qd6enqZxLiRajooNEh4r+jt1at7eHeVwLSNZzgmMUV1rejv2K59d3ORvLCIZDUkLkJyrOjx27F/dnCNuKyEYTIhK0Bvqujz3rSBdW2JtKiAXS8fKD1sp+n14LeDdGqFsaSAWiwdJTpppOn24riGc2eBr6B8ViocIjdmoer44byJcmV9q5x4UigaIDRjnur65L+LcWJ5qJh0TyUYHTFgl+r86MOOcF91pJRxSyMWGi5dler+6caQb1xxoZBtSCAUGCtakenA58qSblhtno1pRR4SGSlXh+nD6s2Ub1VqmodlQxsQFiZUhOnG7dCXb1JmloFhPxkOFCNQf+nK8NOabk9ilX1cPBcMEiBNe+nO89acbUxelXlYOhUKEB1JeOnS9tmgbEldknZUNxMJDhpGdOfW+dyjbEZZj3JQNBEHDBhCcebZ/N+nbEJVjW9MLw8FChU+buTc/+KqbD5RimtILA0ECxI6auHfAuWubDtOh2dEKQsCCRA3Zt/iBeixbTdKhGNAJgkBBw41Yt3lBeuzbjRGgWA9IwcABQwyXtroBeu2bjBCfVw5IAUAAwsvWdfqB+y5by49ellAHQMAAQosVdXsC+28cCo5dVU3GgEAAAgnUdLuD++/cSY1cVE0FwAAAAUjTc/wEvLCcyExbU0wFAAAAAMgScvyFPTFdR0taUktEQAAAAEdRcfzF/bId';
  audioElement.src = beepSound;
}

// Detectar interacción del usuario para habilitar audio
if (typeof window !== 'undefined') {
  const enableAudio = () => {
    userHasInteracted = true;
    console.log('🎵 Audio habilitado por interacción del usuario');
    
    // Crear o resumir el AudioContext cuando el usuario interactúa
    if (audioContextInstance && audioContextInstance.state === 'suspended') {
      audioContextInstance.resume().then(() => {
        console.log('🎵 AudioContext resumido');
      });
    }
    
    // Pre-cargar el audio element
    if (audioElement) {
      audioElement.load();
    }
  };
  
  // Escuchar eventos de interacción
  ['click', 'touchstart', 'keydown', 'scroll'].forEach(event => {
    document.addEventListener(event, enableAudio, { once: false, passive: true });
  });
}

// Función para obtener o crear AudioContext
const getAudioContext = () => {
  if (!audioContextInstance) {
    try {
      audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎵 AudioContext creado, estado:', audioContextInstance.state);
    } catch (e) {
      console.warn('⚠️ No se pudo crear AudioContext:', e.message);
      return null;
    }
  }
  return audioContextInstance;
};

// Función para reproducir sonido de notificación
const playNotificationSound = () => {
  console.log('🔔 Intentando reproducir sonido...', { userHasInteracted });
  
  // Método 1: Usar Audio Element (más compatible con móviles)
  if (audioElement && userHasInteracted) {
    try {
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔔 Sonido reproducido con Audio Element');
          })
          .catch((e) => {
            console.log('⚠️ Audio Element falló, intentando con AudioContext...', e.message);
            playWithAudioContext();
          });
        return;
      }
    } catch (e) {
      console.log('⚠️ Error con Audio Element:', e.message);
    }
  }
  
  // Método 2: Usar AudioContext como fallback
  playWithAudioContext();
};

// Función auxiliar para reproducir con AudioContext
const playWithAudioContext = () => {
  try {
    if (!userHasInteracted) {
      console.log('🔔 Notificación recibida (sonido pendiente de interacción del usuario)');
      return;
    }

    const audioContext = getAudioContext();
    if (!audioContext) return;
    
    // Si el contexto está suspendido, intentar resumirlo
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        generateBeep(audioContext);
      });
    } else {
      generateBeep(audioContext);
    }

  } catch (error) {
    console.warn('⚠️ No se pudo reproducir sonido de notificación:', error.message);
  }
};

// Generar el beep con oscilador
const generateBeep = (audioContext) => {
  try {
    // Crear un oscilador para generar el sonido
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar el sonido (tipo campana suave)
    oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
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
      try {
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
      } catch (e) {
        // Silenciar error del segundo tono
      }
    }, 150);

    console.log('🔔 Sonido reproducido con AudioContext');

  } catch (error) {
    console.warn('⚠️ Error generando beep:', error.message);
  }
};
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
          console.log(`🔔 Nueva notificación detectada: ${prevUnreadCountRef.current} → ${newUnreadCount}`);
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
