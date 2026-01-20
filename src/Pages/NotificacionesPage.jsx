/**
 * Página completa de Notificaciones
 * Muestra todas las notificaciones con filtros y acciones masivas
 */

import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  CheckCheck, 
  RefreshCw, 
  Trash2, 
  Filter, 
  Search,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Package,
  DollarSign,
  Clock,
  Check,
  X
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import useNotifications from '../hooks/useNotifications';
import PushNotificationToggle from '../components/notifications/PushNotificationToggle';

// Mapeo de tipos a iconos y colores
const typeConfig = {
  venta: {
    icon: ShoppingCart,
    color: 'bg-green-100 text-green-600',
    label: 'Venta'
  },
  inventario: {
    icon: Package,
    color: 'bg-blue-100 text-blue-600',
    label: 'Inventario'
  },
  cobro: {
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-600',
    label: 'Cobro'
  },
  default: {
    icon: Bell,
    color: 'bg-gray-100 text-gray-600',
    label: 'General'
  }
};

function NotificacionesPage() {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'super_admin';
  
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
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, venta, inventario, cobro
  const [filterStatus, setFilterStatus] = useState('all'); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  
  // Filtrar notificaciones
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtro por búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesTitle = notification.title?.toLowerCase().includes(searchLower);
        const matchesMessage = notification.message?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesMessage) return false;
      }
      
      // Filtro por tipo
      if (filterType !== 'all' && notification.type !== filterType) {
        return false;
      }
      
      // Filtro por estado
      if (filterStatus === 'unread' && notification.read) return false;
      if (filterStatus === 'read' && !notification.read) return false;
      
      return true;
    });
  }, [notifications, searchTerm, filterType, filterStatus]);
  
  // Handlers
  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const handleDeleteAll = async () => {
    if (!isSuperAdmin) return;
    
    if (window.confirm('¿Estás seguro de eliminar TODAS las notificaciones? Esta acción no se puede deshacer.')) {
      try {
        await deleteAllNotifications();
        setSelectedNotifications(new Set());
      } catch (error) {
        console.error('Error al eliminar todas:', error);
      }
    }
  };
  
  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return;
    
    if (window.confirm(`¿Eliminar ${selectedNotifications.size} notificaciones seleccionadas?`)) {
      try {
        for (const id of selectedNotifications) {
          await deleteNotification(id);
        }
        setSelectedNotifications(new Set());
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };
  
  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n._id)));
    }
  };
  
  const toggleSelect = (id) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };
  
  // Formatear fecha
  const formatDate = (dateString) => {
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
    
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };
  
  const getTypeConfig = (type) => typeConfig[type] || typeConfig.default;
  
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        {/* Título y acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notificaciones</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'} · {notifications.length} total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <PushNotificationToggle />
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <CheckCheck size={18} />
                <span className="hidden sm:inline">Marcar leídas</span>
              </button>
            )}
            
            {isSuperAdmin && notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Eliminar todas</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="venta">Ventas</option>
            <option value="inventario">Inventario</option>
            <option value="cobro">Cobros</option>
          </select>
          
          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos</option>
            <option value="unread">Sin leer</option>
            <option value="read">Leídas</option>
          </select>
        </div>
      </div>
      
      {/* Acciones de selección */}
      {selectedNotifications.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedNotifications.size} notificación(es) seleccionada(s)
          </span>
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Eliminar seleccionadas
          </button>
        </div>
      )}
      
      {/* Estado de carga */}
      {loading && notifications.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="animate-spin mx-auto mb-3 text-blue-600" size={32} />
          <p className="text-gray-500">Cargando notificaciones...</p>
        </div>
      )}
      
      {/* Error */}
      {error && !loading && (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <p className="text-gray-600 mb-4">Error al cargar las notificaciones</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}
      
      {/* Sin notificaciones */}
        {!loading && !error && notifications.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
            <p className="text-gray-500">Las notificaciones de ventas y otras actividades aparecerán aquí</p>
          </div>
        )}
        
        {/* Sin resultados de filtro */}
        {!loading && !error && notifications.length > 0 && filteredNotifications.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Filter size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">No se encontraron notificaciones con los filtros seleccionados</p>
            <button
              onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterStatus('all'); }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
        
        {/* Lista de notificaciones */}
        {filteredNotifications.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header de selección */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedNotifications.size === filteredNotifications.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                {filteredNotifications.length} notificaciones
              </span>
            </div>
            
            {/* Lista */}
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const config = getTypeConfig(notification.type);
                const IconComponent = config.icon;
                
                return (
                  <div
                    key={notification._id}
                    className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification._id)}
                      onChange={() => toggleSelect(notification._id)}
                      className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-blue-500"
                    />
                    
                    {/* Icono */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <IconComponent size={20} />
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        
                        {/* Estado y tiempo */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                      
                      {/* Datos adicionales */}
                      {notification.data && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {notification.data.vendedor && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                              Vendedor: {notification.data.vendedor}
                            </span>
                          )}
                          {notification.data.monto && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                              S/ {notification.data.monto.toLocaleString()}
                            </span>
                          )}
                          {notification.data.metadata?.productosCount && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                              {notification.data.metadata.productosCount} productos
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Acciones */}
                      <div className="mt-2 flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Check size={12} />
                            Marcar como leída
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1"
                        >
                          <X size={12} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}

export default NotificacionesPage;
