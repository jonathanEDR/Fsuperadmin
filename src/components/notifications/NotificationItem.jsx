/**
 * Item individual de notificación
 * Muestra una notificación con su icono, título, mensaje y acciones
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { X, Check, ExternalLink } from 'lucide-react';
import { useRole } from '../../context/RoleContext';

// Formatear tiempo relativo
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  
  return date.toLocaleDateString('es-PE', { 
    day: 'numeric', 
    month: 'short' 
  });
}

// Colores según prioridad
const priorityColors = {
  urgent: 'border-l-red-500 bg-red-50',
  high: 'border-l-orange-500 bg-orange-50',
  normal: 'border-l-blue-500 bg-blue-50',
  low: 'border-l-gray-300 bg-gray-50'
};

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onClose // Para cerrar el panel al navegar
}) {
  const navigate = useNavigate();
  const { user } = useUser();
  const roleFromContext = useRole();
  const userRole = roleFromContext || user?.publicMetadata?.role || 'user';
  
  const {
    _id,
    icon,
    title,
    message,
    type,
    priority,
    read,
    createdAt,
    actionUrl,
    data
  } = notification;
  
  // Determinar la URL de navegación según el tipo y rol
  const getNavigationUrl = () => {
    console.log('🔍 [FRONTEND-NAVIGATION] Procesando notificación:', {
      type,
      actionUrl,
      userRole,
      notificationId: _id,
      title
    });
    
    // Si el actionUrl ya tiene el prefijo del rol correcto, usarlo directamente
    if (actionUrl && (
      actionUrl.startsWith('/super-admin/') || 
      actionUrl.startsWith('/admin/') || 
      actionUrl.startsWith('/user/')
    )) {
      console.log('✅ Usando actionUrl con prefijo:', actionUrl);
      return actionUrl;
    }
    
    console.log('⚠️ ActionUrl sin prefijo de rol, aplicando lógica de fallback');
    
    // Si el actionUrl existe pero no tiene prefijo, agregar el prefijo según el rol actual
    if (actionUrl && actionUrl.startsWith('/') && !actionUrl.startsWith('/super-admin') && !actionUrl.startsWith('/admin') && !actionUrl.startsWith('/user')) {
      const routeWithPrefix = `${userRole === 'super_admin' ? '/super-admin' : userRole === 'admin' ? '/admin' : '/user'}${actionUrl}`;
      console.log('🔧 Agregando prefijo de rol a actionUrl:', routeWithPrefix);
      return routeWithPrefix;
    }
    
    // TAREAS: Redirigir según el rol (fallback para notificaciones sin actionUrl)
    if (type === 'tarea' || actionUrl?.includes('/tareas')) {
      if (userRole === 'super_admin') return '/super-admin/tareas';
      if (userRole === 'admin') return '/admin/tareas';
      return '/user/tareas';
    }

    // VENTAS: Redirigir a la página principal de ventas según el rol
    if (type === 'venta' || actionUrl?.includes('/ventas')) {
      if (userRole === 'super_admin') return '/super-admin/ventas';
      if (userRole === 'admin') return '/admin/ventas';
      return '/user/mis-ventas';
    }

    // PERSONAL/BONIFICACIONES/DESCUENTOS: Redirigir según el rol
    if (type === 'personal' || type === 'bonificacion' || type === 'descuento' || 
        actionUrl?.includes('/personal') || actionUrl?.includes('/perfil')) {
      // Para usuarios normales, ir a su perfil
      if (userRole === 'user') {
        return '/user/perfil';
      }
      // Para admin/super_admin, mantener la URL original (ver perfil del colaborador)
      if (actionUrl) {
        if (userRole === 'super_admin') {
          return actionUrl.replace('/personal-v2/', '/super-admin/personal/');
        }
        if (userRole === 'admin') {
          return actionUrl.replace('/personal-v2/', '/admin/personal/');
        }
      }
      // Default si no hay actionUrl específica
      if (userRole === 'super_admin') return '/super-admin/personal';
      if (userRole === 'admin') return '/admin/personal';
    }
    
    // SISTEMA: Redirigir a inicio o dashboard
    if (type === 'sistema') {
      if (userRole === 'super_admin') return '/super-admin';
      if (userRole === 'admin') return '/admin';
      return '/user';
    }
    
    // Si no hay actionUrl, usar default por rol
    if (!actionUrl) {
      console.log('⚠️ No actionUrl, usando default por rol');
      if (userRole === 'super_admin') return '/super-admin';
      if (userRole === 'admin') return '/admin';
      return '/user';
    }

    // URL predeterminada: ajustar según el rol si no tiene prefijo
    if (actionUrl.startsWith('/')) {
      if (!actionUrl.startsWith('/super-admin') && !actionUrl.startsWith('/admin') && !actionUrl.startsWith('/user')) {
        if (userRole === 'super_admin') return `/super-admin${actionUrl}`;
        if (userRole === 'admin') return `/admin${actionUrl}`;
        return `/user${actionUrl}`;
      }
    }

    return actionUrl;
  };
  
  // Manejar click en la notificación
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const navigationUrl = getNavigationUrl();
    
    console.log('🔔 [CLICK-NOTIFICATION] Navegando:', { 
      type, 
      actionUrl, 
      userRole,
      navigationUrl,
      notificationData: data
    });
    
    // Marcar como leída si no lo está
    if (!read && onMarkAsRead) {
      try {
        await onMarkAsRead(_id);
      } catch (error) {
        console.error('Error marcando como leída:', error);
      }
    }
    
    // Navegar a la URL de acción
    const navigationUrl = getNavigationUrl();
    console.log('🔔 Navegando a:', navigationUrl);
    
    if (navigationUrl) {
      // Cerrar el panel primero
      if (onClose) {
        onClose();
      }
      
      // Pequeño delay para asegurar que el panel se cierre
      setTimeout(() => {
        navigate(navigationUrl);
      }, 100);
    } else {
      console.log('⚠️ No hay URL de navegación');
    }
  };
  
  // Manejar eliminación
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      try {
        await onDelete(_id);
      } catch (error) {
        console.error('Error eliminando:', error);
      }
    }
  };
  
  // Marcar como leída sin navegar
  const handleMarkRead = async (e) => {
    e.stopPropagation();
    if (!read && onMarkAsRead) {
      try {
        await onMarkAsRead(_id);
      } catch (error) {
        console.error('Error marcando como leída:', error);
      }
    }
  };
  
  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
      className={`
        relative p-3 border-l-4 rounded-r-lg cursor-pointer
        transition-all duration-200 hover:shadow-md hover:scale-[1.01]
        active:scale-[0.99] select-none
        ${priorityColors[priority] || priorityColors.normal}
        ${read ? 'opacity-70' : 'opacity-100'}
      `}
      title="Click para ver detalles"
    >
      {/* Indicador de no leída */}
      {!read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
      
      {/* Contenido */}
      <div className="flex gap-3">
        {/* Icono */}
        <div className="flex-shrink-0 text-2xl">
          {icon || '🔔'}
        </div>
        
        {/* Texto */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold text-gray-900 truncate ${!read ? 'font-bold' : ''}`}>
            {title}
          </h4>
          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
            {/* Limpiar N/A residuales del mensaje */}
            {message?.replace(/\.?\s*N\/A\.?/gi, '').replace(/\s+/g, ' ').trim()}
          </p>
          
          {/* Datos adicionales */}
          {data?.monto && (
            <div className="mt-1 space-y-1">
              {/* Monto y método de pago */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-green-600">
                  S/ {typeof data.monto === 'number' ? data.monto.toFixed(2) : data.monto}
                </span>
                {data.metadata?.metodoPago && (
                  <span className="text-xs text-gray-500">
                    • {data.metadata.metodoPago}
                  </span>
                )}
              </div>
              
              {/* Productos asignados */}
              {data.productos && data.productos.length > 0 && (
                <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">
                  <span className="font-medium">Productos: </span>
                  {data.productos.slice(0, 3).map((p, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {p.cantidad}x {p.nombre}
                    </span>
                  ))}
                  {data.productos.length > 3 && (
                    <span className="text-gray-400"> +{data.productos.length - 3} más</span>
                  )}
                </div>
              )}
              
              {/* Vendedor (quien asignó) */}
              {data.vendedor && data.isAssignment && (
                <span className="text-xs text-purple-600">
                  Asignado por: {data.vendedor}
                </span>
              )}
            </div>
          )}
          
          {/* Tiempo */}
          <span className="text-xs text-gray-400 mt-1 block">
            {getRelativeTime(createdAt)}
          </span>
        </div>
        
        {/* Acciones */}
        <div className="flex flex-col gap-1">
          {!read && (
            <button
              onClick={handleMarkRead}
              className="p-1 hover:bg-white rounded-full transition-colors"
              title="Marcar como leída"
            >
              <Check size={14} className="text-green-600" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-white rounded-full transition-colors"
            title="Eliminar"
          >
            <X size={14} className="text-red-500" />
          </button>
        </div>
      </div>
      
      {/* Indicador de link */}
      {actionUrl && (
        <div className="absolute bottom-1 right-1">
          <ExternalLink size={10} className="text-gray-400" />
        </div>
      )}
    </div>
  );
}

export default NotificationItem;
