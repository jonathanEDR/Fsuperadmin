/**
 * Servicio de Web Push Notifications
 * Maneja el registro del Service Worker y suscripciones push
 */

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Clave pública VAPID (se genera en el backend)
let vapidPublicKey = null;

/**
 * Verificar si el navegador soporta Push Notifications
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Obtener el estado actual del permiso de notificaciones
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'granted', 'denied', 'default'
}

/**
 * Solicitar permiso para notificaciones
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return 'unsupported';
  }
  
  const permission = await Notification.requestPermission();
  console.log('📬 Permiso de notificaciones:', permission);
  return permission;
}

/**
 * Registrar el Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker no soportado');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registrado:', registration.scope);
    
    // Esperar a que esté activo
    if (registration.installing) {
      await new Promise((resolve) => {
        registration.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            resolve();
          }
        });
      });
    }
    
    return registration;
  } catch (error) {
    console.error('❌ Error registrando Service Worker:', error);
    return null;
  }
}

/**
 * Obtener la clave pública VAPID del servidor
 */
async function getVapidPublicKey(getToken) {
  if (vapidPublicKey) return vapidPublicKey;
  
  try {
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/push/vapid-public-key`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      vapidPublicKey = data.publicKey;
      return vapidPublicKey;
    }
  } catch (error) {
    console.error('Error obteniendo VAPID key:', error);
  }
  
  return null;
}

/**
 * Convertir la clave VAPID de base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Suscribirse a notificaciones push
 */
export async function subscribeToPush(getToken) {
  if (!isPushSupported()) {
    console.warn('Push no soportado');
    return { success: false, error: 'Push no soportado' };
  }
  
  try {
    // Solicitar permiso
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso denegado' };
    }
    
    // Registrar Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: 'No se pudo registrar Service Worker' };
    }
    
    // Obtener clave VAPID
    const publicKey = await getVapidPublicKey(getToken);
    if (!publicKey) {
      return { success: false, error: 'No se pudo obtener clave VAPID' };
    }
    
    // Crear suscripción
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    console.log('✅ Suscripción push creada:', subscription);
    
    // Enviar suscripción al servidor
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    });
    
    if (response.ok) {
      console.log('✅ Suscripción guardada en servidor');
      return { success: true, subscription };
    } else {
      throw new Error('Error guardando suscripción');
    }
    
  } catch (error) {
    console.error('❌ Error suscribiéndose a push:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancelar suscripción push
 */
export async function unsubscribeFromPush(getToken) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      // Notificar al servidor
      const token = await getToken();
      await fetch(`${API_URL}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
      
      console.log('✅ Suscripción cancelada');
      return { success: true };
    }
    
    return { success: true, message: 'No había suscripción activa' };
    
  } catch (error) {
    console.error('❌ Error cancelando suscripción:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar si el usuario está suscrito
 */
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * Obtener la suscripción actual
 */
export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Verificar estado de Push en el servidor
 */
export async function getPushStatus(token) {
  try {
    const response = await fetch(`${API_URL}/api/push/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return { configured: false };
  } catch (error) {
    console.error('Error verificando push status:', error);
    return { configured: false };
  }
}

/**
 * Mostrar notificación local (sin push server)
 */
export function showLocalNotification(title, options = {}) {
  if (Notification.permission !== 'granted') {
    console.warn('No hay permiso para notificaciones');
    return;
  }
  
  const defaultOptions = {
    icon: '/roxi3.png',
    badge: '/roxi3.png',
    vibrate: [200, 100, 200],
    ...options
  };
  
  return new Notification(title, defaultOptions);
}

export default {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  getCurrentSubscription,
  getPushStatus,
  showLocalNotification
};
