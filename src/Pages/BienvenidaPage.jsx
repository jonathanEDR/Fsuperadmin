import React, { useState } from 'react';
import DashboardCard from '../components/common/DashboardCard';
import ProductosVendidosDashboard from '../components/Graphics/ProductosVendidosDashboardNew';
import VentasLineChart from '../components/Graphics/VentasLineChart';
import { useProductosVendidosHoy } from '../hooks/useProductosVendidosHoy';
import { useRole } from '../context/RoleContext';
import { Package, TrendingUp, BarChart3 } from 'lucide-react';

function BienvenidaPage() {
  const userRole = useRole();
  const { 
    totalProductosHoy, 
    productoMasVendido, 
    loading, 
    error 
  } = useProductosVendidosHoy();

  // Estado para controlar qué tarjeta está expandida
  const [expandedCard, setExpandedCard] = useState(null);

  // Función para manejar la expansión de tarjetas
  const handleCardExpand = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido al Panel Super Admin
        </h1>
        <p className="text-gray-600">
          Resumen ejecutivo de tu negocio y análisis de productos vendidos
        </p>
      </div>

      {/* Dashboard Cards Grid */}
      <div className={`grid gap-6 transition-all duration-500 ${
        expandedCard ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        
        {/* Card: Productos Vendidos Hoy */}
        <DashboardCard
          title="Productos Vendidos Hoy"
          value={totalProductosHoy}
          subtitle="unidades vendidas"
          icon="📦"
          color="green"
          loading={loading}
          error={error}
          expandable={true}
          isExpanded={expandedCard === 'productos-vendidos'}
          onExpandToggle={() => handleCardExpand('productos-vendidos')}
        >
          {/* Contenido expandible con el gráfico completo */}
          <div className="min-h-[600px]">
            <ProductosVendidosDashboard userRole={userRole} />
          </div>
        </DashboardCard>

        {/* Card: Evolución de Ventas - NUEVA TARJETA */}
        <DashboardCard
          title="Evolución de Ventas"
          value="📈"
          subtitle="Tendencias y Métricas"
          icon={<TrendingUp size={32} />}
          color="blue"
          loading={false}
          error={null}
          expandable={true}
          isExpanded={expandedCard === 'evolucion-ventas'}
          onExpandToggle={() => handleCardExpand('evolucion-ventas')}
        >
          {/* Contenido expandible con el gráfico de ventas */}
          <div className="min-h-[600px]">
            <VentasLineChart userRole={userRole} />
          </div>
        </DashboardCard>

        {/* Card: Producto Más Vendido Hoy - Solo mostrar si no hay tarjeta expandida */}
        {!expandedCard && (
          <DashboardCard
            title="Producto Más Vendido Hoy"
            value={productoMasVendido?.cantidad || 0}
            subtitle={productoMasVendido?.nombre || 'Sin ventas hoy'}
            icon="🏆"
            color="purple"
            loading={loading}
            error={error}
            expandable={false}
          />
        )}

        {/* Card: Análisis de Tendencias - Solo mostrar si no hay tarjeta expandida */}
        {!expandedCard && (
          <DashboardCard
            title="Análisis de Tendencias"
            value="📊"
            subtitle="Próximamente"
            icon={<TrendingUp size={32} />}
            color="blue"
            loading={false}
            error={null}
            expandable={false}
          />
        )}

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
                Haz clic en la tarjeta "Productos Vendidos Hoy" para ver el análisis completo 
                con gráficos detallados y tendencias de tus productos más vendidos.
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
