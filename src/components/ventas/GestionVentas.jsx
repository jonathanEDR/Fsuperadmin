import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VentasManager from './VentasManager';
import CobroList from '../cobros/CobroList';
import DevolucionList from '../devoluciones/DevolucionList';
import VentasFinalizadas from './VentasFinalizadas';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useVentasLimpias } from '../../hooks/useVentasLimpias';

function GestionVentas({ userRole }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('ventas');
  const [ventasFinalizadas, setVentasFinalizadas] = useState([]);
  const [loadingFinalizadas, setLoadingFinalizadas] = useState(false);
  
  // Limpiar ventas para evitar errores de productos null
  const ventasFinalizadasLimpias = useVentasLimpias(ventasFinalizadas);

  // Detectar el tab activo basado en la URL actual
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/cobros')) {
      setTab('cobros');
    } else if (path.includes('/devoluciones')) {
      setTab('devoluciones');
    } else {
      setTab('ventas');
    }
  }, [location.pathname]);

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
        console.warn('GestionVentas - No se pudieron cargar las devoluciones');
        return ventas;
      }

      const data = await response.json();
      const devoluciones = data.devoluciones || [];

      // Enriquecer cada venta con sus devoluciones
      const ventasEnriquecidas = ventas.map(venta => {
        const devolucionesVenta = devoluciones.filter(dev => 
          dev.ventaId === venta._id || dev.ventaId?._id === venta._id
        );
        
        return {
          ...venta,
          devoluciones: devolucionesVenta
        };
      });

      return ventasEnriquecidas;
    } catch (error) {
      console.warn('GestionVentas - Error al cargar devoluciones:', error);
      return ventas;
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
      
      // ENRIQUECER CON DEVOLUCIONES
      const ventasFinalizadasConDevoluciones = await enrichVentasWithDevoluciones(data.ventas || []);
      setVentasFinalizadas(ventasFinalizadasConDevoluciones);
      
      console.log('✅ GestionVentas - Ventas finalizadas cargadas y enriquecidas:', ventasFinalizadasConDevoluciones.length);
    } catch (error) {
      console.error('Error al cargar ventas finalizadas:', error);
    } finally {
      setLoadingFinalizadas(false);
    }
  };

  // Cargar ventas finalizadas cuando el tab sea devoluciones
  useEffect(() => {
    if (tab === 'devoluciones') {
      fetchVentasFinalizadas();
    }
  }, [tab]);

  // Función para navegar entre tabs
  const handleTabClick = (tabName) => {
    setTab(tabName);
    
    // Determinar la ruta base según el rol
    const baseRoute = userRole === 'super_admin' ? '/super-admin' : '/admin';
    
    // Navegar a la ruta correspondiente
    switch (tabName) {
      case 'cobros':
        navigate(`${baseRoute}/cobros`);
        break;
      case 'devoluciones':
        navigate(`${baseRoute}/devoluciones`);
        break;
      case 'ventas':
      default:
        navigate(`${baseRoute}/ventas`);
        break;
    }
  };

  // Solo super admin y admin pueden ver los tabs de navegación
  const canViewTabs = ['super_admin', 'admin'].includes(userRole);

  return (
    <div>
      {/* Solo mostrar tabs para super admin y admin */}
      {canViewTabs && (
        <div className="flex gap-2 sm:gap-4 mb-6 overflow-x-auto scrollbar-hide pb-1">
          <button
            className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors text-sm sm:text-base whitespace-nowrap ${
              tab === 'ventas' 
                ? 'border-purple-600 text-purple-700 bg-purple-50' 
                : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'
            }`}
            onClick={() => handleTabClick('ventas')}
          >
            Ventas
          </button>
          <button
            className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors text-sm sm:text-base whitespace-nowrap ${
              tab === 'cobros' 
                ? 'border-purple-600 text-purple-700 bg-purple-50' 
                : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'
            }`}
            onClick={() => handleTabClick('cobros')}
          >
            Cobros
          </button>
          <button
            className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-colors text-sm sm:text-base whitespace-nowrap ${
              tab === 'devoluciones' 
                ? 'border-purple-600 text-purple-700 bg-purple-50' 
                : 'border-transparent text-gray-600 bg-gray-100 hover:bg-purple-50'
            }`}
            onClick={() => handleTabClick('devoluciones')}
          >
            Devoluciones
          </button>
        </div>
      )}
      
      <div>
        {/* Para usuarios normales, solo mostrar ventas */}
        {!canViewTabs && <VentasManager userRole={userRole} />}
        
        {/* Para admin y super admin, mostrar según el tab seleccionado */}
        {canViewTabs && (
          <>
            {tab === 'ventas' && <VentasManager userRole={userRole} />}
            {tab === 'cobros' && <CobroList userRole={userRole} />}
            {tab === 'devoluciones' && (
              <div className="space-y-8">
                <div className="bg-white shadow-lg rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Gestión de Devoluciones</h3>
                  <DevolucionList userRole={userRole} />
                </div>
                <div className="bg-white shadow-lg rounded-xl p-6">
                  <VentasFinalizadas 
                    userRole={userRole} 
                    ventasFinalizadas={ventasFinalizadasLimpias} 
                    loading={loadingFinalizadas}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GestionVentas;
