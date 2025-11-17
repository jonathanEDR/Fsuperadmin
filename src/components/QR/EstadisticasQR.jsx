/**
 * Componente EstadisticasQR
 * Muestra estadísticas detalladas del sistema de QR
 */

import React from 'react';
import { 
  QrCode, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const EstadisticasQR = ({ estadisticas, loading = false }) => {

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No hay estadísticas disponibles</p>
      </div>
    );
  }

  // Calcular porcentajes y tendencias
  const tasaUso = estadisticas.totalQRs > 0 
    ? ((estadisticas.totalActivos / estadisticas.totalQRs) * 100).toFixed(1)
    : 0;

  const promedioEscaneosPorQR = estadisticas.totalActivos > 0
    ? (estadisticas.totalEscaneos / estadisticas.totalActivos).toFixed(1)
    : 0;

  const tasaEntradas = estadisticas.totalEscaneos > 0
    ? ((estadisticas.totalEntradas / estadisticas.totalEscaneos) * 100).toFixed(1)
    : 0;

  const tasaSalidas = estadisticas.totalEscaneos > 0
    ? ((estadisticas.totalSalidas / estadisticas.totalEscaneos) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Resumen Principal */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Estadísticas Generales</h2>
          <QrCode size={32} />
        </div>
        <p className="text-blue-100">
          Vista general del sistema de códigos QR para asistencias
        </p>
      </div>

      {/* Grid de Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total QRs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <QrCode size={24} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{estadisticas.totalQRs}</p>
          <p className="text-sm text-gray-600 mt-1">Códigos QR creados</p>
        </div>

        {/* QRs Activos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-semibold uppercase tracking-wide">
              {tasaUso}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{estadisticas.totalActivos}</p>
          <p className="text-sm text-gray-600 mt-1">Códigos activos</p>
        </div>

        {/* Total Escaneos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-purple-600">
              <ArrowUpRight size={16} />
              <span className="text-xs font-semibold">{promedioEscaneosPorQR}/QR</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{estadisticas.totalEscaneos}</p>
          <p className="text-sm text-gray-600 mt-1">Escaneos totales</p>
        </div>

        {/* Promedio */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Promedio</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{promedioEscaneosPorQR}</p>
          <p className="text-sm text-gray-600 mt-1">Escaneos por QR</p>
        </div>
      </div>

      {/* Gráfico de Entradas vs Salidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Entradas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Entradas Registradas</h3>
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight size={20} />
              <span className="text-sm font-semibold">{tasaEntradas}%</span>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-4xl font-bold text-green-600">{estadisticas.totalEntradas}</p>
            <p className="text-sm text-gray-600 mt-1">Total de ingresos</p>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${tasaEntradas}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            {tasaEntradas}% del total de escaneos
          </p>
        </div>

        {/* Salidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Salidas Registradas</h3>
            <div className="flex items-center gap-1 text-orange-600">
              <ArrowDownRight size={20} />
              <span className="text-sm font-semibold">{tasaSalidas}%</span>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-4xl font-bold text-orange-600">{estadisticas.totalSalidas}</p>
            <p className="text-sm text-gray-600 mt-1">Total de egresos</p>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${tasaSalidas}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            {tasaSalidas}% del total de escaneos
          </p>
        </div>
      </div>

      {/* Comparativa */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Comparativa de Actividad
        </h3>
        
        <div className="space-y-4">
          {/* Entradas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Entradas</span>
              <span className="text-sm font-bold text-green-600">
                {estadisticas.totalEntradas}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full flex items-center justify-end pr-2"
                style={{ width: `${tasaEntradas}%` }}
              >
                <span className="text-xs text-white font-semibold">
                  {tasaEntradas}%
                </span>
              </div>
            </div>
          </div>

          {/* Salidas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Salidas</span>
              <span className="text-sm font-bold text-orange-600">
                {estadisticas.totalSalidas}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full flex items-center justify-end pr-2"
                style={{ width: `${tasaSalidas}%` }}
              >
                <span className="text-xs text-white font-semibold">
                  {tasaSalidas}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <QrCode size={20} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              💡 Análisis del Sistema
            </h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                • Tienes <strong>{estadisticas.totalActivos}</strong> códigos QR activos de un total de <strong>{estadisticas.totalQRs}</strong>
              </li>
              <li>
                • Cada código QR activo tiene un promedio de <strong>{promedioEscaneosPorQR}</strong> escaneos
              </li>
              <li>
                • El <strong>{tasaEntradas}%</strong> de los escaneos son entradas y el <strong>{tasaSalidas}%</strong> son salidas
              </li>
              {estadisticas.totalActivos === 0 && (
                <li className="text-orange-600 font-semibold">
                  ⚠️ No hay códigos QR activos. Genera uno nuevo para comenzar a registrar asistencias.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasQR;
