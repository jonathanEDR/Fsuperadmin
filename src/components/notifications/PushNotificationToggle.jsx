/**
 * Componente para activar/desactivar notificaciones push
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Bell, BellOff, Smartphone, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  getPushStatus
} from '../../services/pushNotificationService';

export default function PushNotificationToggle({ compact = false }) {
  const { getToken } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState('default');
  const [pushStatus, setPushStatus] = useState({ configured: false });
  const [error, setError] = useState(null);

  // Verificar estado al montar
  useEffect(() => {
    checkPushStatus();
  }, []);

  async function checkPushStatus() {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar soporte
      if (!isPushSupported()) {
        setError('Tu navegador no soporta notificaciones push');
        setIsLoading(false);
        return;
      }

      // Verificar permiso
      const perm = getNotificationPermission();
      setPermission(perm);

      // Verificar si el servidor tiene Push configurado
      const token = await getToken();
      const status = await getPushStatus(token);
      setPushStatus(status);

      if (!status.configured) {
        setError('Push no configurado en el servidor');
        setIsLoading(false);
        return;
      }

      // Verificar suscripción actual
      const subscription = await getCurrentSubscription();
      setIsEnabled(!!subscription);

    } catch (err) {
      console.error('Error verificando push:', err);
      setError('Error verificando estado');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle() {
    setIsLoading(true);
    setError(null);

    try {
      if (isEnabled) {
        // Desuscribirse
        const result = await unsubscribeFromPush(getToken);
        if (result.success) {
          setIsEnabled(false);
        } else {
          setError(result.error || 'Error al desactivar');
        }
      } else {
        // Suscribirse
        const result = await subscribeToPush(getToken);
        if (result.success) {
          setIsEnabled(true);
          setPermission('granted');
        } else {
          setError(result.error || 'Error al activar');
        }
      }
    } catch (err) {
      console.error('Error toggle push:', err);
      setError('Error al cambiar estado');
    } finally {
      setIsLoading(false);
    }
  }

  // Si no está soportado
  if (!isPushSupported()) {
    if (compact) return null;
    return (
      <div className="text-gray-400 text-sm flex items-center gap-2">
        <BellOff className="w-4 h-4" />
        <span>Push no soportado</span>
      </div>
    );
  }

  // Si el servidor no tiene Push configurado
  if (!isLoading && !pushStatus.configured) {
    if (compact) return null;
    return (
      <div className="text-gray-400 text-sm flex items-center gap-2">
        <BellOff className="w-4 h-4" />
        <span>Push no disponible</span>
      </div>
    );
  }

  // Si el permiso fue denegado
  if (permission === 'denied') {
    if (compact) return null;
    return (
      <div className="text-yellow-500 text-sm flex items-center gap-2">
        <BellOff className="w-4 h-4" />
        <span>Notificaciones bloqueadas en el navegador</span>
      </div>
    );
  }

  // Versión compacta (solo icono)
  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-colors ${
          isEnabled 
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`}
        title={isEnabled ? 'Desactivar notificaciones móviles' : 'Activar notificaciones móviles'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isEnabled ? (
          <Smartphone className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </button>
    );
  }

  // Versión completa
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-500/20' : 'bg-gray-700'}`}>
            {isEnabled ? (
              <Smartphone className="w-5 h-5 text-green-400" />
            ) : (
              <Bell className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-white font-medium">Notificaciones Push</h3>
            <p className="text-gray-400 text-sm">
              {isEnabled 
                ? 'Recibirás notificaciones en tu dispositivo' 
                : 'Activa para recibir notificaciones push'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isEnabled ? 'bg-green-500' : 'bg-gray-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </span>
          ) : (
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
