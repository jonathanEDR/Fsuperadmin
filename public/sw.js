/**
 * Service Worker para Web Push Notifications
 * Este archivo debe estar en la raíz de public/
 */

// Versión del cache
const CACHE_VERSION = 'v1';
const CACHE_NAME = `roxi-pizzas-${CACHE_VERSION}`;

// Evento de instalación
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
  event.waitUntil(clients.claim());
});

// Recibir notificación push
self.addEventListener('push', (event) => {
  console.log('📬 Push recibido:', event);
  
  let data = {
    title: 'Nueva Notificación',
    body: 'Tienes una nueva notificación',
    icon: '/roxi3.png',
    badge: '/roxi3.png',
    tag: 'notification',
    data: {}
  };
  
  // Intentar parsear los datos del push
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || payload.type || data.tag,
        data: payload.data || {},
        actions: payload.actions || [
          { action: 'view', title: 'Ver' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      };
    } catch (e) {
      console.error('Error parseando push data:', e);
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: data.actions
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Click en notificación:', event.action);
  
  event.notification.close();
  
  // Si tiene URL de acción, navegar a ella
  const urlToOpen = event.notification.data?.actionUrl || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Si no hay ventana, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Cerrar notificación
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificación cerrada');
});
