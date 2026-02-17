import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/common/DashboardCard';
import ProductosVendidosDashboard from '../components/Graphics/ProductosVendidosDashboardNew';
import VentasLineChart from '../components/Graphics/VentasLineChart';
import CajaLineChart from '../components/Graphics/CajaLineChart';
import CobrosLineChart from '../components/Graphics/CobrosLineChart';
import RegistrosDiariosLineChart from '../components/Graphics/RegistrosDiariosLineChart';
import ProduccionLineChart from '../components/Produccion/Graficos/ProduccionLineChart';
import { useProductosVendidosHoy } from '../hooks/useProductosVendidosHoy';
import { useDashboardResumenHoy } from '../hooks/useDashboardResumenHoy';
import { useRole } from '../context/RoleContext';
import { Package, TrendingUp, BarChart3, DollarSign, Factory, ClipboardList, Wallet, AlertTriangle } from 'lucide-react';

/**
 * Dashboard Principal - SOLO PARA SUPER_ADMIN
 * Incluye gráficos avanzados, métricas y análisis detallados
 */
function BienvenidaPage() {
  const userRole = useRole();
  const navigate = useNavigate();

  // Protección: Solo super_admin puede acceder a esta página
  useEffect(() => {
    if (userRole && userRole !== 'super_admin') {
      console.warn('⚠️ Acceso denegado: Solo super_admin puede ver esta página');
      navigate('/dashboard', { replace: true });
    }
  }, [userRole, navigate]);

  // Si no es super_admin, mostrar mensaje mientras redirige
  if (userRole && userRole !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            Esta página es exclusiva para Super Administradores.
          </p>
          <p className="text-sm text-gray-500">
            Redirigiendo...
          </p>
        </div>
      </div>
    );
  }

  // Estado para el período de visualización: 'hoy' | 'mes'
  const [periodo, setPeriodo] = useState('mes'); // Por defecto mostrar el mes

  // Estado para controlar qué tarjeta está expandida
  const [expandedCard, setExpandedCard] = useState(null);

  const { 
    totalProductosHoy, 
    loading: loadingProductos, 
    error: errorProductos 
  } = useProductosVendidosHoy(periodo);

  // Hook para obtener resumen del día (ventas, cobros, producción, registros)
  const {
    ventasNetas,
    totalCobros,
    costoProduccion,
    registrosDiarios,
    totalEgresos,
    loading: loadingResumen,
    error: errorResumen
  } = useDashboardResumenHoy(periodo);

  // Función para manejar la expansión de tarjetas
  const handleCardExpand = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  // Función para formatear montos
  const formatMonto = (monto) => {
    return `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calcular Utilidad Bruta según el período
  const calcularUtilidadBruta = () => {
    if (periodo === 'hoy') {
      // Fórmula para HOY: Cobros - Producción - Registros de pagos
      return totalCobros - costoProduccion - registrosDiarios;
    } else {
      // Fórmula para MES: Cobros - Producción - Egresos totales
      return totalCobros - costoProduccion - totalEgresos;
    }
  };

  const utilidadBruta = calcularUtilidadBruta();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenido al Panel Super Admin
            </h1>
            <p className="text-gray-600">
              Resumen ejecutivo de tu negocio - {periodo === 'hoy' ? 'Datos del día de hoy' : 'Datos del mes actual'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Tarjeta de Utilidad Bruta */}
            <div className={`px-6 py-3 rounded-lg shadow-md border-2 ${
              utilidadBruta >= 0 
                ? 'bg-green-50 border-green-500' 
                : 'bg-red-50 border-red-500'
            }`}>
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {periodo === 'hoy' ? 'Utilidad Bruta del Día' : 'Utilidad Bruta del Mes'}
              </div>
              <div className={`text-2xl font-bold ${
                utilidadBruta >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatMonto(utilidadBruta)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {periodo === 'hoy' 
                  ? 'Cobros - Producción - Pagos' 
                  : 'Cobros - Producción - Egresos'}
              </div>
            </div>

            {/* Selector de Período */}
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setPeriodo('hoy')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  periodo === 'hoy'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📅 Hoy
              </button>
              <button
                onClick={() => setPeriodo('mes')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  periodo === 'mes'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📆 Este Mes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className={`grid gap-6 transition-all duration-500 ${
        expandedCard ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
      }`}>
        
        {/* Card: Productos Vendidos Hoy */}
        <DashboardCard
          title={periodo === 'hoy' ? 'Productos Vendidos Hoy' : 'Productos del Mes'}
          value={totalProductosHoy}
          subtitle={periodo === 'hoy' ? 'unidades vendidas' : 'unidades este mes'}
          icon="📦"
          color="green"
          loading={loadingProductos}
          error={errorProductos}
          expandable={true}
          isExpanded={expandedCard === 'productos-vendidos'}
          onExpandToggle={() => handleCardExpand('productos-vendidos')}
        >
          {/* Contenido expandible con el gráfico completo */}
          <div className="min-h-[600px]">
            <ProductosVendidosDashboard userRole={userRole} />
          </div>
        </DashboardCard>

        {/* Card: Ventas Netas del Día */}
        <DashboardCard
          title={periodo === 'hoy' ? 'Ventas del Día' : 'Ventas del Mes'}
          value={formatMonto(ventasNetas)}
          subtitle={periodo === 'hoy' ? 'ventas netas hoy' : 'ventas netas este mes'}
          icon={<TrendingUp size={32} />}
          color="blue"
          loading={loadingResumen}
          error={errorResumen}
          expandable={true}
          isExpanded={expandedCard === 'evolucion-ventas'}
          onExpandToggle={() => handleCardExpand('evolucion-ventas')}
        >
          {/* Contenido expandible con el gráfico de ventas */}
          <div className="min-h-[600px]">
            <VentasLineChart userRole={userRole} />
          </div>
        </DashboardCard>

        {/* Card: Cobros del Día */}
        <DashboardCard
          title={periodo === 'hoy' ? 'Cobros del Día' : 'Cobros del Mes'}
          value={formatMonto(totalCobros)}
          subtitle={periodo === 'hoy' ? 'recaudación hoy' : 'recaudación este mes'}
          icon={<DollarSign size={32} />}
          color="emerald"
          loading={loadingResumen}
          error={errorResumen}
          expandable={true}
          isExpanded={expandedCard === 'control-cobros'}
          onExpandToggle={() => handleCardExpand('control-cobros')}
        >
          {/* Contenido expandible con el gráfico de cobros */}
          <div className="min-h-[600px]">
            <CobrosLineChart userRole={userRole} />
          </div>
        </DashboardCard>

        {/* Card: Egresos de Caja del Día */}
        <DashboardCard
          title={periodo === 'hoy' ? 'Egresos del Día' : 'Egresos del Mes'}
          value={formatMonto(totalEgresos)}
          subtitle={periodo === 'hoy' ? 'salidas de caja hoy' : 'salidas de caja este mes'}
          icon={<Wallet size={32} />}
          color="red"
          loading={loadingResumen}
          error={errorResumen}
          expandable={true}
          isExpanded={expandedCard === 'evolucion-caja'}
          onExpandToggle={() => handleCardExpand('evolucion-caja')}
        >
          {/* Contenido expandible con el gráfico de caja */}
          <div className="min-h-[600px]">
            <CajaLineChart userRole={userRole} />
          </div>
        </DashboardCard>

        {/* Card: Producción del Día */}
        <DashboardCard
          title={periodo === 'hoy' ? 'Producción del Día' : 'Producción del Mes'}
          value={formatMonto(costoProduccion)}
          subtitle={periodo === 'hoy' ? 'costo de producción hoy' : 'costo de producción este mes'}
          icon={<Factory size={32} />}
          color="purple"
          loading={loadingResumen}
          error={errorResumen}
          expandable={true}
          isExpanded={expandedCard === 'produccion-diaria'}
          onExpandToggle={() => handleCardExpand('produccion-diaria')}
        >
          {/* Contenido expandible con el gráfico de producción */}
          <div className="min-h-[600px]">
            <ProduccionLineChart userRole={userRole} />
          </div>
        </DashboardCard>

        {/* Card: Registros y Pagos del Personal */}
        <DashboardCard
          title={periodo === 'hoy' ? 'Personal del Día' : 'Personal del Mes'}
          value={formatMonto(registrosDiarios)}
          subtitle={periodo === 'hoy' ? 'devengado + pagos' : 'devengado + pagos este mes'}
          icon={<ClipboardList size={32} />}
          color="orange"
          loading={loadingResumen}
          error={errorResumen}
          expandable={true}
          isExpanded={expandedCard === 'registros-diarios'}
          onExpandToggle={() => handleCardExpand('registros-diarios')}
        >
          {/* Contenido expandible con tabs de registros diarios y pagos realizados */}
          <div className="min-h-[600px]">
            <RegistrosDiariosLineChart userRole={userRole} />
          </div>
        </DashboardCard>

      </div>

      {/* Sección de acceso rápido - Solo mostrar si no hay tarjeta expandida */}
      {!expandedCard && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-blue-500" size={24} />
            Acceso Rápido a Módulos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div className="text-2xl mb-2">💼</div>
              <span className="text-sm font-medium text-gray-700">Ventas</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div className="text-2xl mb-2">📋</div>
              <span className="text-sm font-medium text-gray-700">Inventario</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div className="text-2xl mb-2">👥</div>
              <span className="text-sm font-medium text-gray-700">Usuarios</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div className="text-2xl mb-2">📊</div>
              <span className="text-sm font-medium text-gray-700">Reportes</span>
            </button>
          </div>
        </div>
      )}

      {/* Información adicional - Solo mostrar si no hay tarjeta expandida */}
      {!expandedCard && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-500 mr-3 mt-1">💡</div>
            <div>
              <h3 className="text-blue-800 font-medium">Consejo del día</h3>
              <p className="text-blue-700 text-sm mt-1">
                Haz clic en cualquier tarjeta para ver el análisis completo 
                con gráficos detallados y tendencias históricas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botón para cerrar vista expandida */}
      {expandedCard && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setExpandedCard(null)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <span>←</span>
            <span>Volver al Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default BienvenidaPage;
