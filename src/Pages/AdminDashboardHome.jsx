import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  DollarSign, 
  Wallet,
  Factory, 
  ClipboardList, 
  BarChart3
} from 'lucide-react';

/**
 * Dashboard Home para el rol ADMIN
 * Página simple con accesos rápidos a los módulos principales
 * Sin gráficos complejos ni métricas avanzadas
 */
function AdminDashboardHome() {
  const navigate = useNavigate();

  // Definir los accesos rápidos disponibles para admin (solo los módulos principales)
  const accesoRapido = [
    {
      id: 'ventas',
      titulo: 'Ventas',
      descripcion: 'Registrar y consultar ventas',
      icono: ShoppingCart,
      ruta: '/admin/ventas',
      color: 'bg-blue-500',
      hover: 'hover:bg-blue-600'
    },
    {
      id: 'cobros',
      titulo: 'Cobros',
      descripcion: 'Registro de pagos y cobros',
      icono: DollarSign,
      ruta: '/admin/cobros',
      color: 'bg-yellow-500',
      hover: 'hover:bg-yellow-600'
    },
    {
      id: 'caja',
      titulo: 'Caja',
      descripcion: 'Movimientos de caja',
      icono: Wallet,
      ruta: '/admin/caja',
      color: 'bg-red-500',
      hover: 'hover:bg-red-600'
    },
    {
      id: 'produccion',
      titulo: 'Producción',
      descripcion: 'Gestión de producción',
      icono: Factory,
      ruta: '/admin/produccion',
      color: 'bg-purple-500',
      hover: 'hover:bg-purple-600'
    },
    {
      id: 'tareas',
      titulo: 'Tareas',
      descripcion: 'Lista de tareas pendientes',
      icono: ClipboardList,
      ruta: '/admin/tareas',
      color: 'bg-pink-500',
      hover: 'hover:bg-pink-600'
    },
    {
      id: 'escaner',
      titulo: 'Escáner QR',
      descripcion: 'Escanear asistencias',
      icono: BarChart3,
      ruta: '/admin/escaner-qr',
      color: 'bg-lime-500',
      hover: 'hover:bg-lime-600'
    }
  ];

  const handleNavegar = (ruta) => {
    navigate(ruta);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Accede rápidamente a los módulos principales del sistema
        </p>
      </div>

      {/* Grid de Accesos Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {accesoRapido.map((acceso) => {
          const IconoComponente = acceso.icono;
          
          return (
            <button
              key={acceso.id}
              onClick={() => handleNavegar(acceso.ruta)}
              className={`
                ${acceso.color} ${acceso.hover}
                text-white rounded-xl shadow-lg p-6 
                transform transition-all duration-200
                hover:scale-105 hover:shadow-xl
                focus:outline-none focus:ring-4 focus:ring-opacity-50
                flex flex-col items-center justify-center
                min-h-[180px]
              `}
            >
              <div className="bg-white bg-opacity-20 rounded-full p-4 mb-4">
                <IconoComponente className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold mb-2 text-center">
                {acceso.titulo}
              </h3>
              
              <p className="text-sm text-white text-opacity-90 text-center">
                {acceso.descripcion}
              </p>
            </button>
          );
        })}
      </div>

      {/* Mensaje informativo */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 text-white rounded-full p-2">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              💡 Consejo del día
            </h4>
            <p className="text-blue-700 text-sm">
              Haz clic en cualquier tarjeta para acceder al módulo correspondiente. 
              Mantén tu sistema actualizado registrando las operaciones diarias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardHome;
