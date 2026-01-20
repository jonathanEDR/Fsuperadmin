/**
 * Panel desplegable de Notificaciones
 * Muestra la lista de notificaciones del usuario
 */

import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck, RefreshCw, Loader2, X } from 'lucide-react';
import NotificationItem from './NotificationItem';
import PushNotificationToggle from './PushNotificationToggle';
import useNotifications from '../../hooks/useNotifications';

function NotificationPanel({ isOpen, onClose, isMobile = false }) {
  const panelRef = useRef(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  // Cerrar al hacer click fuera (solo desktop)
  useEffect(() => {
    function handleClickOutside(event) {
      if (!isMobile && panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isMobile]);
  
  // Manejar marcar todas como leídas
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // Manejar refresh
  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  if (!isOpen) return null;
  
  // Clases para móvil (modal centrado) vs desktop (dropdown)
  const panelClasses = isMobile
    ? "fixed inset-x-4 top-1/2 -translate-y-1/2 max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col"
    : "fixed sm:absolute right-4 sm:right-0 top-20 sm:top-full sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[80vh] flex flex-col";
  
  return (
    <div
      ref={panelRef}
      className={panelClasses}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} />
            <h3 className="font-semibold text-sm sm:text-base">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} nuevas
                </span>
              )}
            </h3>
          </div>
          
          {/* Acciones del header */}
          <div className="flex items-center gap-1">
            {/* Toggle de Push Notifications */}
            <PushNotificationToggle compact />
            
            <button
              onClick={handleRefresh}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              title="Actualizar"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={16} />
              </button>
            )}
            
            {/* Botón cerrar en móvil */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors ml-1"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Estado de carga */}
        {loading && notifications.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            <p className="text-sm">Cargando notificaciones...</p>
          </div>
        )}
        
        {/* Error */}
        {error && !loading && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell size={24} className="text-red-500" />
            </div>
            <p className="text-sm text-gray-600 mb-3">No se pudieron cargar las notificaciones</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}
        
        {/* Sin notificaciones */}
        {!loading && !error && notifications.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell size={32} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No tienes notificaciones</p>
            <p className="text-xs mt-1 text-gray-400">Las notificaciones de ventas aparecerán aquí</p>
          </div>
        )}
        
        {/* Lista de notificaciones */}
        {notifications.length > 0 && (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
