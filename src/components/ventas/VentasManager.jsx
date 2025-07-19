import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ShoppingCart, Plus } from 'lucide-react';
import VentaList from './VentaList';
import VentasFinalizadas from './VentasFinalizadas';
import VentaCreationModal from './VentaCreationModal';
import { useRole } from '../../context/RoleContext';
import DevolucionList from '../devoluciones/DevolucionList';

const VentasManager = ({ userRole: userRoleProp }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const contextUserRole = useRole();
  // Usar el prop si está disponible, sino usar el contexto como fallback
  const userRole = userRoleProp || contextUserRole;
  
  // DEBUG: Verificar el rol del usuario
  console.log('🔍 VentasManager - userRole:', userRole, 'canShowAddButton:', ['admin', 'super_admin', 'user'].includes(userRole));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [ventasFinalizadas, setVentasFinalizadas] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]); // <-- Nuevo estado para devoluciones
  const [loading, setLoading] = useState(false);
  const [loadingFinalizadas, setLoadingFinalizadas] = useState(false);
  const [error, setError] = useState(null);

  // Admins, super_admins y usuarios pueden crear ventas
  const canShowAddButton = ['admin', 'super_admin', 'user'].includes(userRole);

  // Fetch solo ventas activas (no finalizadas)
  const fetchVentas = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al cargar ventas');
      }
      const data = await response.json();
      // Filtrar ventas activas (no finalizadas)
      const ventasActivas = (data.ventas || []).filter(v => v.completionStatus !== 'approved');
      setVentas(ventasActivas);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ventas finalizadas
  const fetchVentasFinalizadas = async () => {
    try {
      setLoadingFinalizadas(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/finalizadas?limit=1000&offset=0`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Error al cargar ventas finalizadas');
      }
      const data = await response.json();
      setVentasFinalizadas(data.ventas || []);
    } catch (error) {
      setError('Error al cargar ventas finalizadas');
    } finally {
      setLoadingFinalizadas(false);
    }
  };

  // Fetch devoluciones
  const fetchDevoluciones = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/devoluciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar devoluciones');
      const data = await response.json();
      setDevoluciones(data.devoluciones || []);
    } catch (error) {
      console.error('Error al cargar devoluciones:', error);
      setDevoluciones([]);
    }
  };

  useEffect(() => {
    fetchVentas();
    fetchVentasFinalizadas();
    fetchDevoluciones(); // <-- Cargar devoluciones al montar
  }, []);

  const handleVentaCreated = async (venta) => {
    try {
      setLoading(true);
      // Recargar todas las listas después de crear una venta
      await Promise.all([
        fetchVentas(),
        fetchVentasFinalizadas(),
        fetchDevoluciones()
      ]);
      setIsModalOpen(false);
      console.log('✅ Venta creada y listas actualizadas');
    } catch (error) {
      console.error('Error al refrescar las listas:', error);
      setError('Error al refrescar la lista de ventas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Gestión de Ventas</h3>
              <p className="text-sm text-gray-600">
                Administra las ventas del sistema {userRole && `(${userRole})`}
              </p>
            </div>
          </div>
          {canShowAddButton && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Venta
            </button>
          )}
        </div>

        <VentaList 
          ventas={ventas}
          devoluciones={devoluciones}
          userRole={userRole}
          currentUserId={user?.id}
          showHeader={false}
          onVentaUpdated={fetchVentas}
          loading={loading}
        />

        {isModalOpen && (
          <VentaCreationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onVentaCreated={handleVentaCreated}
            userRole={userRole}
          />
        )}
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6">
        <VentasFinalizadas 
          userRole={userRole} 
          ventasFinalizadas={ventasFinalizadas} 
          loading={loadingFinalizadas}
        />
      </div>

      {/* Nueva sección para Devoluciones - Solo para admin y super_admin */}
      {['admin', 'super_admin'].includes(userRole) && (
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Devoluciones</h3>
          <DevolucionList userRole={userRole} />
        </div>
      )}
    </div>
  );
};

export default VentasManager;
