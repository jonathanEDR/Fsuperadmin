/**
 * Botón de Campana de Notificaciones
 * Muestra el ícono con badge y controla la apertura del panel
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, CheckCheck, RefreshCw, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import useNotifications from '../../hooks/useNotifications';

function NotificationBell({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'super_admin';
  const userRole = user?.publicMetadata?.role || 'user';
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications();
  
  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Calcular posición del panel
  useEffect(() => {
    if (isOpen && buttonRef.current && !isMobile) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 320;
      
      // Calcular posición - preferir a la derecha del botón
      let left = rect.right + 8;
      
      // Si no cabe a la derecha, posicionar debajo
      if (left + panelWidth > window.innerWidth - 16) {
        left = Math.max(16, rect.left - panelWidth + rect.width);
      }
      
      setPanelPosition({
        top: rect.top,
        left: left
      });
    }
  }, [isOpen, isMobile]);
  
  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      const isClickOnButton = buttonRef.current?.contains(event.target);
      const isClickOnPanel = panelRef.current?.contains(event.target);
      
      if (!isClickOnButton && !isClickOnPanel) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      // Usar timeout para evitar cerrar inmediatamente al abrir
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Bloquear scroll del body cuando el modal está abierto en móvil
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);
  
  const togglePanel = async () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Al abrir el panel, marcar todas como leídas
    if (newIsOpen && unreadCount > 0) {
      try {
        await markAllAsRead();
      } catch (err) {
        console.error('Error al marcar como leídas:', err);
      }
    }
  };
  
  const closePanel = () => {
    setIsOpen(false);
  };
  
  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  const handleDeleteAll = async () => {
    if (!isSuperAdmin) return;
    
    if (window.confirm('¿Estás seguro de eliminar TODAS las notificaciones? Esta acción no se puede deshacer.')) {
      try {
        await deleteAllNotifications();
      } catch (err) {
        console.error('Error al eliminar todas:', err);
      }
    }
  };
  
  // Formatear tiempo relativo
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  // Determinar URL de navegación según tipo y rol
  const getNavigationUrl = (notification) => {
    const { type, actionUrl } = notification;
    
    // Si el actionUrl ya tiene el prefijo del rol correcto, usarlo directamente
    if (actionUrl && (
      actionUrl.startsWith('/super-admin/') || 
      actionUrl.startsWith('/admin/') || 
      actionUrl.startsWith('/user/')
    )) {
      return actionUrl;
    }
    
    // Si el actionUrl existe pero no tiene prefijo, agregar el prefijo según el rol actual
    if (actionUrl && actionUrl.startsWith('/') && !actionUrl.startsWith('/super-admin') && !actionUrl.startsWith('/admin') && !actionUrl.startsWith('/user')) {
      return `${userRole === 'super_admin' ? '/super-admin' : userRole === 'admin' ? '/admin' : '/user'}${actionUrl}`;
    }
    
    // TAREAS (fallback para notificaciones sin actionUrl)
    if (type === 'tarea' || actionUrl?.includes('/tareas')) {
      if (userRole === 'super_admin') return '/super-admin/tareas';
      if (userRole === 'admin') return '/admin/tareas';
      return '/user/tareas';
    }

    // VENTAS
    if (type === 'venta' || actionUrl?.includes('/ventas')) {
      if (userRole === 'super_admin') return '/super-admin/ventas';
      if (userRole === 'admin') return '/admin/ventas';
      return '/user/mis-ventas';
    }

    // PERSONAL/BONIFICACIONES/DESCUENTOS
    if (type === 'personal' || type === 'bonificacion' || type === 'descuento' || 
        actionUrl?.includes('/personal') || actionUrl?.includes('/perfil')) {
      if (userRole === 'user') return '/user/perfil';
      if (userRole === 'super_admin') return '/super-admin/personal';
      if (userRole === 'admin') return '/admin/personal';
    }
    
    // SISTEMA
    if (type === 'sistema') {
      if (userRole === 'super_admin') return '/super-admin';
      if (userRole === 'admin') return '/admin';
      return '/user';
    }
    
    // Default por rol
    if (userRole === 'super_admin') return '/super-admin';
    if (userRole === 'admin') return '/admin';
    return '/user';
  };

  // Manejar click en notificación
  const handleNotificationClick = async (notification) => {
    // Marcar como leída
    if (!notification.read) {
      try {
        await markAsRead(notification._id);
      } catch (err) {
        console.error('Error marcando como leída:', err);
      }
    }
    
    // Cerrar panel
    closePanel();
    
    // Navegar
    const url = getNavigationUrl(notification);
    setTimeout(() => {
      navigate(url);
    }, 100);
  };

  return (
    <>
      {/* Botón de campana */}
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={togglePanel}
          className={`
            relative p-2.5 rounded-xl transition-all duration-200
            ${isOpen 
              ? 'bg-blue-100 text-blue-600 shadow-md' 
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }
          `}
          title="Notificaciones"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell size={20} strokeWidth={2} />
          
          {/* Badge de conteo */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Portal para el panel - renderizado fuera del sidebar */}
      {isOpen && createPortal(
        <>
          {/* Overlay */}
          <div 
            className={`fixed inset-0 z-[9998] ${isMobile ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={closePanel}
          />
          
          {/* Panel de notificaciones */}
          <div
            ref={panelRef}
            style={!isMobile ? { top: panelPosition.top, left: panelPosition.left } : {}}
            className={`
              fixed z-[9999]
              ${isMobile 
                ? 'inset-x-3 top-1/2 -translate-y-1/2' 
                : 'w-80'
              }
              bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden
              max-h-[75vh] flex flex-col animate-fadeIn
            `}
          >
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-blue-600">{unreadCount} sin leer</p>
                  )}
                </div>
              </div>
              
              {/* Acciones del header */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleRefresh}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  title="Actualizar"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                
                {/* Botón eliminar todas - solo super_admin */}
                {isSuperAdmin && notifications.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                    title="Eliminar todas las notificaciones"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <button
                  onClick={closePanel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  title="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Contenido */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Estado de carga */}
            {loading && notifications.length === 0 && (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin mx-auto mb-3 text-blue-500" size={28} />
                <p className="text-sm text-gray-500">Cargando...</p>
              </div>
            )}
            
            {/* Error */}
            {error && !loading && (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell size={20} className="text-red-400" />
                </div>
                <p className="text-sm text-gray-600 mb-3">No se pudieron cargar</p>
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
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">No tienes notificaciones</p>
                <p className="text-xs mt-1 text-gray-400">Las notificaciones de ventas aparecerán aquí</p>
              </div>
            )}
            
            {/* Lista de notificaciones - máximo 10 */}
            {notifications.length > 0 && (
              <div className="divide-y divide-gray-50">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification._id}
                    role="button"
                    tabIndex={0}
                    className={`
                      px-4 py-3 hover:bg-gray-50 transition-all cursor-pointer
                      hover:scale-[1.01] active:scale-[0.99] select-none
                      ${!notification.read ? 'bg-blue-50/50' : ''}
                    `}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
                    title="Click para ver detalles"
                  >
                    <div className="flex gap-3">
                      {/* Indicador de no leída */}
                      <div className="flex-shrink-0 pt-1">
                        <div className={`w-2 h-2 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-gray-400">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          {notification.data?.sucursal && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                              {notification.data.sucursal}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Monto si existe */}
                      {notification.data?.monto && (
                        <div className="flex-shrink-0 text-right">
                          <span className="text-sm font-semibold text-green-600">
                            S/ {notification.data.monto.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Link
                  to="/super-admin/notificaciones"
                  onClick={closePanel}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  <ExternalLink size={12} />
                  Ver todas {notifications.length > 10 && `(${notifications.length})`}
                </Link>
                <button
                  onClick={closePanel}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
        </>,
        document.body
      )}
    </>
  );
}

export default NotificationBell;
