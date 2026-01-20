/**
 * Banner para solicitar permiso de notificaciones push
 * Aparece cuando el usuario no ha dado permiso aún
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Bell, X, Smartphone } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  getPushStatus
} from '../../services/pushNotificationService';

export default function NotificationPermissionBanner() {
  const { getToken, isSignedIn } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkShouldShowBanner();
  }, [isSignedIn]);

  async function checkShouldShowBanner() {
    // No mostrar si no está logueado
    if (!isSignedIn) return;
    
    // No mostrar si ya fue descartado en esta sesión
    const wasDismissed = sessionStorage.getItem('notif_banner_dismissed');
    if (wasDismissed) return;

    // No mostrar si el navegador no soporta push
    if (!isPushSupported()) return;

    // No mostrar si ya tiene permiso granted o denied
    const permission = getNotificationPermission();
    if (permission === 'granted' || permission === 'denied') return;

    // Verificar si el servidor tiene push configurado
    try {
      const token = await getToken();
      const status = await getPushStatus(token);
      if (!status.configured) return;
    } catch {
      return;
    }

    // Mostrar banner después de 3 segundos
    setTimeout(() => {
      setShowBanner(true);
    }, 3000);
  }

  async function handleEnable() {
    setIsLoading(true);
    try {
      const result = await subscribeToPush(getToken);
      if (result.success) {
        setShowBanner(false);
        // Mostrar mensaje de éxito
        alert('✅ ¡Notificaciones activadas! Recibirás alertas cuando haya nuevas ventas.');
      } else {
        alert('❌ ' + (result.error || 'No se pudieron activar las notificaciones'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al activar notificaciones');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem('notif_banner_dismissed', 'true');
  }

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-2xl p-4 text-white">
        {/* Botón cerrar */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
            <Bell className="w-6 h-6" />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base">
              🔔 Activa las notificaciones
            </h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              Recibe alertas instantáneas cuando se registren nuevas ventas, incluso con la app cerrada.
            </p>

            {/* Botones */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <Smartphone size={16} />
                {isLoading ? 'Activando...' : 'Activar'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-white/80 hover:text-white text-sm transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animación CSS */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
