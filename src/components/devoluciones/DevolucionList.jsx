import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import DevolucionModal from './DevolucionModal';
import { formatearFecha } from '../../utils/fechaHoraUtils';

const DevolucionList = ({ userRole = 'user' }) => {
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState({ show: false, message: '', type: '' });
  const { getToken } = useAuth();

  // Función de utilidad para formatear fechas - usar utilidad unificada
  const formatearFechaLocal = (fecha) => {
    return formatearFecha(fecha);
  };
  // Función para mostrar mensajes de estado
  const showStatusMessage = (message, type) => {
    setDeleteStatus({ show: true, message, type });
    setTimeout(() => setDeleteStatus({ show: false, message: '', type: '' }), 3000);
  };  // Función para verificar si una devolución puede ser eliminada
  const canDeleteDevolucion = (devolucion) => {
    // No permitir eliminar si la venta está finalizada o pagada
    return devolucion.ventaFinalizada !== true && devolucion.ventaEstadoPago !== 'Pagado';
  };

  useEffect(() => {
    fetchDevoluciones();
  }, []);

  // Efecto para cargar más elementos cuando cambia el limit
  useEffect(() => {
    if (limit > 10) {
      fetchDevoluciones(true);
    }
  }, [limit]);

  const handleLoadMore = () => {
    // Solo permitir cargar más si es super admin
    if (userRole === 'super_admin') {
      setLimit(prev => prev + 10);
    }
  };

  const fetchDevoluciones = async (isLoadingMore = false) => {
    try {
      if (!isLoadingMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/devoluciones?page=1&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar devoluciones');
      }
      const data = await response.json();
      
      // Siempre establecer las devoluciones (la API devuelve todos los elementos hasta el límite)
      setDevoluciones(data.devoluciones || []);
      // Verificar si hay más elementos disponibles usando el total del backend
      const totalDevoluciones = data.totalDevoluciones || 0;
      const hasMoreElements = totalDevoluciones > limit;
      setHasMore(hasMoreElements);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las devoluciones');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  const handleDeleteDevolucion = async (id, producto, cantidad) => {
    const confirmMessage = `¿Estás seguro de que deseas eliminar la devolución?\n\nDetalles:\nProducto: ${producto}\nCantidad: ${cantidad}`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true); // Agregar loading para prevenir múltiples clicks
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/devoluciones/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          showStatusMessage(errorData.message || 'Error al eliminar la devolución', 'error');
          return;
        }

        // Actualizar el estado local directamente sin recargar todo
        setDevoluciones(prevDevoluciones => 
          prevDevoluciones.filter(dev => dev._id !== id)
        );
        
        showStatusMessage('Devolución eliminada correctamente', 'success');
        
      } catch (error) {
        console.error('Error:', error);
        showStatusMessage(error.message || 'Error al eliminar la devolución', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {deleteStatus.show && (
        <div className={`p-4 mb-4 text-sm rounded-lg ${
          deleteStatus.type === 'success' 
            ? 'text-green-700 bg-green-100' 
            : 'text-red-700 bg-red-100'
        }`}>
          {deleteStatus.message}
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Colaborador</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Estado</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Venta</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {devoluciones.map((devolucion) => (
            <tr
              key={devolucion._id}
              className={`hover:bg-gray-50 transition-colors duration-200 ${
                !canDeleteDevolucion(devolucion)
                  ? 'bg-gray-50 border-l-4 border-orange-400'
                  : ''
              }`}
              title={!canDeleteDevolucion(devolucion) ? 'Esta devolución está asociada a una venta finalizada' : ''}
            >
              <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{formatearFechaLocal(devolucion.fechaDevolucion)}</td>
              <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-900">{devolucion.colaborador?.nombre || 'N/A'}</span>
                  <span className="text-xs text-gray-500">{devolucion.colaborador?.email || 'N/A'}</span>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{devolucion.producto || 'N/A'}</td>
              <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{devolucion.cantidad || 0}</td>
              <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">S/ {(devolucion.monto || 0).toFixed(2)}</td>
              <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{devolucion.motivo || 'Sin motivo'}</td>
              <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  devolucion.estado === 'aprobada'
                    ? 'bg-green-100 text-green-800'
                    : devolucion.estado === 'rechazada'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {devolucion.estado?.charAt(0).toUpperCase() + devolucion.estado?.slice(1) || 'Pendiente'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  devolucion.ventaFinalizada
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {devolucion.ventaFinalizada ? 'Finalizada' : 'Activa'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-center">
                {canDeleteDevolucion(devolucion) ? (
                  <button
                    onClick={() => handleDeleteDevolucion(devolucion._id, devolucion.producto, devolucion.cantidad)}
                    disabled={loading} // Deshabilitar durante loading
                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {loading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">No disponible</span>
                    <span className="text-xs text-gray-400 mt-1">Venta finalizada</span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Información adicional para usuarios no super admin */}
      {hasMore && userRole !== 'super_admin' && (
        <div className="text-center mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Nota:</span> Solo se muestran las primeras 10 devoluciones. 
            Contacta a un Super Administrador para ver el historial completo.
          </p>
        </div>
      )}
      {/* Botón Ver más - Solo para Super Admin */}
      {(() => {
        const shouldShowButton = hasMore && userRole === 'super_admin';
        return shouldShowButton;
      })() && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cargando...
              </>
            ) : (
              <>
                Ver más ({limit + 10} elementos)
              </>
            )}
          </button>
        </div>
      )}
      {/* Mostrar total de elementos cargados */}
      <div className="text-center mt-4 text-sm text-gray-600">
        Mostrando {devoluciones.length} devoluciones
        {(!hasMore || userRole !== 'super_admin') && devoluciones.length > 0 && (
          <span className="ml-2 text-blue-600 font-medium">
            {userRole === 'super_admin' 
              ? '(Todas las devoluciones cargadas)' 
              : '(Mostrando primeras 10 devoluciones)'
            }
          </span>
        )}
      </div>
    </div>
  );
};

export default DevolucionList;
