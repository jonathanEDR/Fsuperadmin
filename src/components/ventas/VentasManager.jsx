import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ShoppingCart, Plus } from 'lucide-react';
import VentaList from './VentaList';
import VentasFinalizadas from './VentasFinalizadas';
import VentaCreationModal from './VentaCreationModal';

const VentasManager = ({ userRole }) => {  const { getToken, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Asegurarse de que el userRole esté definido
  const [currentUserRole, setCurrentUserRole] = useState(userRole || 'user');
  
  useEffect(() => {
    if (userRole) {
      setCurrentUserRole(userRole);
      console.log('Role set in VentasManager:', userRole);
    }
  }, [userRole]);
  
  // Todos los usuarios pueden crear ventas
  const canShowAddButton = true; // Los permisos específicos se manejan en VentaCreationModal

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
      setVentas(data.ventas || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);  const handleVentaCreated = async (venta) => {
    // La venta ya fue creada en el modal, solo necesitamos:
    // 1. Actualizar la lista de ventas
    // 2. Cerrar el modal
    console.log('Venta recibida del modal (ya creada):', venta);
    try {
      setLoading(true);
      await fetchVentas(); // Refrescar la lista de ventas
      setIsModalOpen(false); // Cerrar el modal
      console.log('Lista de ventas actualizada correctamente');
    } catch (error) {
      console.error('Error al refrescar ventas:', error);
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
          userRole={userRole}
          showHeader={false}
          onVentaUpdated={fetchVentas}
          loading={loading}
        />

        {isModalOpen && (
          <VentaCreationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}            onVentaCreated={handleVentaCreated}
            userRole={currentUserRole}
          />
        )}
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6">
        <VentasFinalizadas userRole={userRole} />
      </div>
    </div>
  );
};

export default VentasManager;
