import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import { 
  Check,
  X,
  Clock,
  ShoppingBag
} from 'lucide-react';

function VentasFinalizadas({ userRole }) {
  const { getToken } = useAuth();  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const { user } = useUser();
  useEffect(() => {
    loadVentasFinalizadas();
  }, []);

  const loadVentasFinalizadas = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/finalizadas`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar las ventas finalizadas');
      }

      const data = await response.json();
      setVentas(data.ventas);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las ventas finalizadas');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentasFinalizadas();
  }, []);  const getStatusColor = (status) => {
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
      }

      // Recargar la lista de ventas
      await loadVentasFinalizadas();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

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
            {ventas.map((venta) => (
              <tr key={venta._id}>
                <td className="px-6 py-4">
                  {venta.productos.map((prod, idx) => (
                    <div key={idx} className="text-sm text-gray-900">
                      {prod.productoId.nombre} ({prod.cantidad})
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  S/ {venta.montoTotal.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(venta.completionStatus)}`}>
                    {getStatusIcon(venta.completionStatus)}
                    <span className="ml-1">
                      {venta.completionStatus === 'approved' ? 'Aprobada' :
                       venta.completionStatus === 'rejected' ? 'Rechazada' : 'Pendiente'}
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {venta.completionDate ? new Date(venta.completionDate).toLocaleDateString() : '-'}
                </td>
                {['super_admin', 'admin'].includes(userRole) && (
                  <td className="px-6 py-4 text-sm font-medium">                    {venta.completionStatus === 'pending' && canApproveReject(venta) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveReject(venta._id, 'approved')}
                          disabled={actionLoading === venta._id}
                          className={`px-3 py-1 text-sm rounded-md ${
                            actionLoading === venta._id
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {actionLoading === venta._id ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                          onClick={() => handleApproveReject(venta._id, 'rejected')}
                          disabled={actionLoading === venta._id}
                          className={`px-3 py-1 text-sm rounded-md ${
                            actionLoading === venta._id
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {actionLoading === venta._id ? 'Procesando...' : 'Rechazar'}
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VentasFinalizadas;
