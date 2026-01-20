/**
 * Panel desplegable de Notificaciones
 * Muestra la lista de notificaciones del usuario
 */

import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck, RefreshCw, Loader2 } from 'lucide-react';
import NotificationItem from './NotificationItem';
import useNotifications from '../../hooks/useNotifications';

function NotificationPanel({ isOpen, onClose }) {
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
  
  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
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
  
  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[80vh] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} />
            <h3 className="font-semibold">
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
            <button
              onClick={handleRefresh}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              title="Actualizar"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {/* Estado de carga */}
        {loading && notifications.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            <p className="text-sm">Cargando notificaciones...</p>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="p-4 text-center text-red-500">
            <p className="text-sm">Error al cargar notificaciones</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Reintentar
            </button>
          </div>
        )}
        
        {/* Sin notificaciones */}
        {!loading && !error && notifications.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes notificaciones</p>
            <p className="text-xs mt-1">Las notificaciones de ventas aparecerán aquí</p>
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
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
