import React from 'react';
import { useNavigate } from 'react-router-dom';
import IngredientesBarChart from './IngredientesBarChart';
import RecetasStockBarChart from './RecetasStockBarChart';
import MaterialesBarChart from './MaterialesBarChart';
import ResiduosLineChart from './ResiduosLineChart';

/**
 * GraficosProduccionPage
 * 
 * Página principal para visualizar gráficos y estadísticas de inventario de producción.
 * El gráfico de Producción Diaria ahora está en el Dashboard principal.
 * Utiliza la zona horaria de Perú (America/Lima) para todas las operaciones de fecha.
 */
const GraficosProduccionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/sistema/produccion')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl">←</span>
                <span className="text-sm font-medium">Volver</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Gráficos de Inventario</h1>
                  <p className="text-sm text-gray-500">Control de stock de ingredientes, recetas y materiales</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Gráfico de Stock de Ingredientes */}
        <div className="mb-6">
          <IngredientesBarChart />
        </div>

        {/* Gráfico de Stock de Recetas */}
        <div className="mb-6">
          <RecetasStockBarChart />
        </div>

        {/* Gráfico de Stock de Materiales */}
        <div className="mb-6">
          <MaterialesBarChart />
        </div>

        {/* Gráfico de Residuos y Malogrados */}
        <div className="mb-6">
          <ResiduosLineChart />
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Acerca de los gráficos</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Los datos se muestran en hora de Perú (America/Lima, UTC-5)</li>
                <li>• <strong>Producción Diaria:</strong> Disponible en el Dashboard principal</li>
                <li>• <strong>Stock de Ingredientes:</strong> Visualice el inventario actual con colores según nivel de stock</li>
                <li>• <strong>Stock de Recetas:</strong> Vea el inventario por receta y por fase (preparado, intermedio, terminado)</li>
                <li>• <strong>Stock de Materiales:</strong> Control de materiales con alertas de bajo stock y valor de inventario</li>
                <li>• <strong>Residuos y Malogrados:</strong> Evolución temporal de pérdidas con filtros por tipo y motivo</li>
                <li>• Pase el mouse sobre los elementos para ver detalles (nombre, cantidad, costo)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraficosProduccionPage;
