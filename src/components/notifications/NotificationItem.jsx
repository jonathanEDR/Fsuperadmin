/**
 * Item individual de notificación
 * Muestra una notificación con su icono, título, mensaje y acciones
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, ExternalLink } from 'lucide-react';

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
  
  const {
    _id,
    icon,
    title,
    message,
    priority,
    read,
    createdAt,
    actionUrl,
    data
  } = notification;
  
  // Manejar click en la notificación
  const handleClick = async () => {
    // Marcar como leída si no lo está
    if (!read && onMarkAsRead) {
      try {
        await onMarkAsRead(_id);
      } catch (error) {
        console.error('Error marcando como leída:', error);
      }
    }
    
    // Navegar a la URL de acción si existe
    if (actionUrl) {
      // Cerrar el panel
      if (onClose) onClose();
      
      // Navegar - determinar la ruta correcta según el contexto
      const fullPath = actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`;
      navigate(fullPath);
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
      className={`
        relative p-3 border-l-4 rounded-r-lg cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${priorityColors[priority] || priorityColors.normal}
        ${read ? 'opacity-70' : 'opacity-100'}
      `}
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
