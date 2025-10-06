import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Grid3X3 } from 'lucide-react';
import VentaList from './VentaList';
import VentaCreationModal from './VentaCreationModal';
import { useRole } from '../../context/RoleContext';
import { useVentasLimpias } from '../../hooks/useVentasLimpias';

function VentasManager({ userRole: userRoleProp }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const contextUserRole = useRole();
  // Usar el prop si está disponible, sino usar el contexto como fallback
  const userRole = userRoleProp || contextUserRole;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Limpiar ventas para evitar errores de productos null
  const ventasLimpias = useVentasLimpias(ventas);

  // Admins, super_admins y usuarios pueden crear ventas
  const canShowAddButton = ['admin', 'super_admin', 'user'].includes(userRole);

  // Función para obtener la ruta del catálogo según el rol
  const getCatalogoRoute = () => {
    switch (userRole) {
      case 'super_admin':
        return '/super-admin/catalogo';
      case 'admin':
        return '/admin/catalogo';
      case 'user':
        return '/user/catalogo';
      default:
        return '/super-admin/catalogo'; // fallback
    }
  };

  // Función para enriquecer ventas con información de devoluciones
  const enrichVentasWithDevoluciones = async (ventas) => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/devoluciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('VentasManager - No se pudieron cargar las devoluciones');
        return ventas;
      }

      const data = await response.json();
      const devoluciones = data.devoluciones || [];

      // Enriquecer cada venta con sus devoluciones
      const ventasEnriquecidas = ventas.map(venta => {
        const devolucionesVenta = devoluciones.filter(dev => 
          dev.ventaId === venta._id || dev.ventaId?._id === venta._id
        );
        
        // Solo log si hay devoluciones para evitar spam
        if (devolucionesVenta.length > 0) {
          console.log(`� VentasManager - Venta ${venta._id.slice(-6)} tiene ${devolucionesVenta.length} devoluciones`);
        }
        
        const ventaEnriquecida = {
          ...venta,
          devoluciones: devolucionesVenta
        };

        return ventaEnriquecida;
      });

      return ventasEnriquecidas;
    } catch (error) {
      console.warn('VentasManager - Error al cargar devoluciones:', error);
      return ventas;
    }
  };

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
      
      // ENRIQUECER CON DEVOLUCIONES - Igual que los cobros
      const ventasConDevoluciones = await enrichVentasWithDevoluciones(ventasActivas);
      setVentas(ventasConDevoluciones);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };



  // Fetch devoluciones - REMOVIDO: ahora se maneja en GestionVentas

  useEffect(() => {
    fetchVentas();
  }, []);

  const handleVentaCreated = async (venta) => {
    try {
      setLoading(true);
      // Recargar las listas de ventas después de crear una venta
      await fetchVentas();
      setIsModalOpen(false);
      console.log('✅ Venta creada y listas actualizadas');
    } catch (error) {
      console.error('Error al refrescar las listas:', error);
      setError('Error al refrescar la lista de ventas');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar actualizaciones de ventas
  const handleVentaUpdated = useCallback(async () => {
    try {
      await fetchVentas();
    } catch (error) {
      console.error('Error al refrescar las listas después de actualización:', error);
      setError('Error al refrescar los datos');
    }
  }, []);

  // Función específica para cuando se procesa un pago
  const handlePagoProcessed = useCallback(async () => {
    try {
      await fetchVentas();
    } catch (error) {
      console.error('Error al refrescar después de pago:', error);
    }
  }, []);

  // Función específica para cuando se procesa una devolución
  const handleDevolucionProcessed = useCallback(async () => {
    try {
      await fetchVentas();
    } catch (error) {
      console.error('Error al refrescar después de devolución:', error);
    }
  }, []);

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(getCatalogoRoute())}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <Grid3X3 size={20} />
                Ver Catálogo
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Nueva Venta
              </button>
            </div>
          )}
        </div>

        <VentaList 
          ventas={ventasLimpias}
          userRole={userRole}
          currentUserId={user?.id}
          showHeader={false}
          onVentaUpdated={handleVentaUpdated}
          onPagoProcessed={handlePagoProcessed}
          onDevolucionProcessed={handleDevolucionProcessed}
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
    </div>
  );
};

export default VentasManager;
