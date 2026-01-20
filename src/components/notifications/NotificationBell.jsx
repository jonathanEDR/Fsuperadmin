/**
 * Botón de Campana de Notificaciones
 * Muestra el ícono con badge y controla la apertura del panel
 */

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import useNotifications from '../../hooks/useNotifications';

function NotificationBell({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();
  
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };
  
  const closePanel = () => {
    setIsOpen(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Botón de campana */}
      <button
        onClick={togglePanel}
        className={`
          relative p-2 rounded-lg transition-all duration-200
          ${isOpen 
            ? 'bg-blue-100 text-blue-600' 
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
          }
        `}
        title="Notificaciones"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
      >
        <Bell size={22} />
        
        {/* Badge de conteo */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Indicador de nuevas (dot animado) */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
        )}
      </button>
      
      {/* Panel desplegable */}
      <NotificationPanel 
        isOpen={isOpen} 
        onClose={closePanel} 
      />
    </div>
  );
}

export default NotificationBell;
