import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import { 
  Check,
  X,
  Clock,
  ShoppingBag,
  Undo2
} from 'lucide-react';

function VentasFinalizadas({ userRole }) {
  const { getToken } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalVentas, setTotalVentas] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);  const { user } = useUser();

  useEffect(() => {
    loadVentasFinalizadas();
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadVentasFinalizadas(true);
    }
  };  const loadVentasFinalizadas = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const token = await getToken();
      const offset = isLoadMore ? ventas.length : 0;
      const currentLimit = 10; // Siempre cargar 10 elementos por vez
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ventas/finalizadas?limit=${currentLimit}&offset=${offset}`, 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar las ventas finalizadas');
      }      const data = await response.json();
      
      if (isLoadMore) {
        setVentas(prevVentas => [...prevVentas, ...data.ventas]);
      } else {
        setVentas(data.ventas);
      }
      
      setHasMore(data.hasMore);
      setTotalVentas(data.totalVentas);
      
      // Debug logs
      console.log('Ventas finalizadas cargadas:', {
        isLoadMore,
        ventasLength: data.ventas.length,
        totalVentas: data.totalVentas,
        hasMore: data.hasMore,
        currentOffset: data.currentOffset
      });
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las ventas finalizadas');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <Check className="w-4 h-4 text-green-800" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-800" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-800" />;
      default:
        return null;
    }
  };

  const canApproveReject = (venta) => {
    if (userRole === 'super_admin') {
      return true;
    }
    if (userRole === 'admin') {
      // Los admin no pueden revisar ventas de super_admin
      return !venta.creator_info?.role || venta.creator_info.role !== 'super_admin';
    }
    return false;
  };

  const handleApproveReject = async (ventaId, action) => {
    try {
      let completionNotes = '';
      if (action === 'rejected') {
        completionNotes = prompt('Por favor, ingresa una razón para el rechazo:');
        if (!completionNotes) return; // Si no hay notas para el rechazo, cancelar
      }

      setActionLoading(ventaId);
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completionStatus: action,
          completionDate: new Date().toISOString(),
          completionNotes: completionNotes || (action === 'approved' ? 'Venta aprobada' : 'Venta rechazada')
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al ${action === 'approved' ? 'aprobar' : 'rechazar'} la venta`);
      }      // Recargar la lista de ventas desde el principio
      await loadVentasFinalizadas(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevertVenta = async (ventaId) => {
    try {
      const confirmRevert = window.confirm(
        '¿Estás seguro de que quieres quitar esta venta de las finalizadas? Esto la volverá a poner en estado activo.'
      );
      
      if (!confirmRevert) return;

      setActionLoading(ventaId);
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/revert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al revertir la venta');
      }      // Recargar la lista de ventas desde el principio
      await loadVentasFinalizadas(false);
      
      // Mostrar mensaje de éxito
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrar ventas según el rol para mostrar pendientes a admin/super_admin
  const ventasFiltradas = ventas.filter(venta => {
    if (['admin', 'super_admin'].includes(userRole)) {
      // Mostrar todas las finalizadas y pendientes de aprobación
      return ['approved', 'pending', 'rejected'].includes(venta.completionStatus);
    }
    // Para otros roles, solo mostrar las aprobadas
    return venta.completionStatus === 'approved';
  });

  if (loading) {
    return <div className="text-center py-4">Cargando ventas finalizadas...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <ShoppingBag className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Ventas Finalizadas</h2>
            <p className="text-sm text-gray-600">
              Gestión de ventas completadas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Productos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Colaborador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha de Finalización
              </th>
              {['super_admin', 'admin'].includes(userRole) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventasFiltradas.map((venta) => (
              <tr key={venta._id}>
                <td className="px-6 py-4">{venta.productos.map((prod, idx) => (<div key={idx} className="text-sm text-gray-900">{prod.productoId.nombre} ({prod.cantidad})</div>))}</td><td className="px-6 py-4 text-sm text-gray-900"><div className="flex flex-col"><span className="font-medium">{venta.user_info?.nombre_negocio || 'No especificado'}</span><span className="text-xs text-gray-500">{venta.user_info?.email || ''}</span></div></td><td className="px-6 py-4 text-sm text-gray-900">S/ {venta.montoTotal.toFixed(2)}</td><td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(venta.completionStatus)}`}>{getStatusIcon(venta.completionStatus)}<span className="ml-1">{venta.completionStatus === 'approved' ? 'Aprobada' :venta.completionStatus === 'rejected' ? 'Rechazada' : 'Pendiente'}</span></span></td><td className="px-6 py-4 text-sm text-gray-900">{venta.completionDate ? new Date(venta.completionDate).toLocaleDateString() : '-'}</td>{['super_admin', 'admin'].includes(userRole) && (<td className="px-6 py-4 text-sm font-medium">{venta.completionStatus === 'pending' && canApproveReject(venta) && (<div className="flex space-x-2"><button onClick={() => handleApproveReject(venta._id, 'approved')} disabled={actionLoading === venta._id} className={`px-3 py-1 text-sm rounded-md ${actionLoading === venta._id? 'bg-gray-100 text-gray-500':'bg-green-100 text-green-700 hover:bg-green-200'}`}>{actionLoading === venta._id ? 'Procesando...' : 'Aprobar'}</button><button onClick={() => handleApproveReject(venta._id, 'rejected')} disabled={actionLoading === venta._id} className={`px-3 py-1 text-sm rounded-md ${actionLoading === venta._id? 'bg-gray-100 text-gray-500':'bg-red-100 text-red-700 hover:bg-red-200'}`}>{actionLoading === venta._id ? 'Procesando...' : 'Rechazar'}</button></div>)}{(venta.completionStatus === 'approved' || venta.completionStatus === 'rejected') && canApproveReject(venta) && (<button onClick={() => handleRevertVenta(venta._id)} disabled={actionLoading === venta._id} className={`px-3 py-1 text-sm rounded-md flex items-center gap-1 ${actionLoading === venta._id? 'bg-gray-100 text-gray-500':'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`} title="Quitar de ventas finalizadas y volver a estado activo"><Undo2 size={14} />{actionLoading === venta._id ? 'Procesando...' : 'Revertir'}</button>)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón Ver Más - Solo para super_admin */}
      {hasMore && userRole === 'super_admin' && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loadingMore
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {loadingMore ? 'Cargando...' : 'Ver más'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Mostrando {ventas.length} de {totalVentas} ventas finalizadas
          </p>
        </div>
      )}

      {/* Indicador para roles que no son super_admin */}
      {hasMore && userRole !== 'super_admin' && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Mostrando las {ventas.length} ventas finalizadas más recientes
            {totalVentas > ventas.length && (
              <span className="block mt-1 text-xs">
                ({totalVentas - ventas.length} ventas adicionales disponibles)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default VentasFinalizadas;
