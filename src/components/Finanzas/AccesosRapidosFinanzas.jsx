import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Importar servicios para estadísticas
import { finanzasService, cuentasBancariasService } from '../../services/finanzasService';

const accesos = [
  {
    label: 'Dashboard Financiero',
    to: '',
    icon: '📊',
    color: 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 border-blue-200',
    description: 'Resumen financiero general'
  },
  {
    label: 'Movimientos de Caja',
    to: 'movimientos-caja',
    icon: '💸',
    color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-800 border-emerald-200',
    description: 'Control de ingresos y egresos'
  },
  {
    label: 'Cuentas Bancarias',
    to: 'cuentas-bancarias',
    icon: '🏦',
    color: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border-green-200',
    description: 'Gestionar cuentas bancarias'
  },
  {
    label: 'Gestión de Préstamos',
    to: 'prestamos',
    icon: '💰',
    color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-800 border-yellow-200',
    description: 'Administrar préstamos'
  },
  {
    label: 'Garantías',
    to: 'garantias',
    icon: '🛡️',
    color: 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-800 border-purple-200',
    description: 'Gestionar garantías'
  },
  {
    label: 'Pagos Financiamiento',
    to: 'pagos-financiamiento',
    icon: '💳',
    color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-800 border-indigo-200',
    description: 'Pagos y financiamiento'
  }
];

const AccesosRapidosFinanzas = () => {
  const location = useLocation();
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalCuentas: '-',
    prestamosActivos: '-',
    garantiasVigentes: '-',
    saldoTotal: 'S/ 0.00'
  });
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Construir la ruta base para super-admin
  const basePath = '/super-admin';

  // Cargar estadísticas reales
  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoadingStats(true);
        
        // Cargar estadísticas de cuentas bancarias
        const responseCuentas = await cuentasBancariasService.obtenerTodos({});
        const resumenFinanzas = await finanzasService.obtenerResumen();
        
        const cuentasData = responseCuentas.data.cuentas || [];
        const resumenData = resumenFinanzas.data || {};
        
        setEstadisticas({
          totalCuentas: cuentasData.length,
          prestamosActivos: 0, // Módulo por implementar
          garantiasVigentes: 0, // Módulo por implementar  
          saldoTotal: `S/ ${(resumenData.saldoTotalPEN || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
        });

      } catch (error) {
        console.error('Error al cargar estadísticas financieras:', error);
        // En caso de error, mostrar valores por defecto
        setEstadisticas({
          totalCuentas: 0,
          prestamosActivos: 0,
          garantiasVigentes: 0,
          saldoTotal: 'S/ 0.00'
        });
      } finally {
        setLoadingStats(false);
      }
    };

    cargarEstadisticas();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Sistema de Finanzas
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Gestiona todos los aspectos financieros desde un solo lugar
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-lg sm:text-xl">🏦</span>
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Cuentas</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                {loadingStats ? '...' : estadisticas.totalCuentas}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-lg sm:text-xl">💰</span>
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Préstamos Activos</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                {loadingStats ? '...' : estadisticas.prestamosActivos}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-lg sm:text-xl">🛡️</span>
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Garantías Vigentes</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                {loadingStats ? '...' : estadisticas.garantiasVigentes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-lg sm:text-xl">💵</span>
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Saldo Total</p>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-green-600 truncate">
                {loadingStats ? '...' : estadisticas.saldoTotal}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accesos.map((acceso, index) => {
          // Construir la ruta correcta para finanzas
          const fullPath = acceso.to === '' 
            ? `${basePath}/finanzas`
            : `${basePath}/finanzas/${acceso.to}`;
          const isActive = location.pathname === fullPath;
          
          // Debug: console.log para ver las rutas generadas
          console.log(`Acceso: ${acceso.label}, Ruta: ${fullPath}`);
          
          return (
            <Link
              key={index}
              to={fullPath}
              className={`
                group relative overflow-hidden rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                ${acceso.color}
                ${isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {acceso.icon}
                  </span>
                  {isActive && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold mb-2 group-hover:text-opacity-80 transition-colors">
                  {acceso.label}
                </h3>
                
                <p className="text-sm opacity-75 group-hover:opacity-90 transition-opacity">
                  {acceso.description}
                </p>
              </div>
              
              {/* Efecto de hover */}
              <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
            </Link>
          );
        })}
      </div>

      {/* Alertas o información adicional */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-blue-500 text-xl">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Consejo Financiero
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Mantén un seguimiento regular de tus flujos de caja y revisa periódicamente 
                el estado de tus préstamos y garantías para una gestión financiera eficiente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccesosRapidosFinanzas;
