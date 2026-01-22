import React from 'react';
import {
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Flag,
  TrendingUp,
  ListTodo,
  Loader
} from 'lucide-react';

/**
 * Componente para mostrar estadísticas de tareas
 */
export default function EstadisticasTareas({ estadisticas }) {
  if (!estadisticas) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const { porEstado = {}, vencidas = 0, urgentes = 0, enRevision = 0, total = 0 } = estadisticas;

  // Calcular porcentajes para el gráfico de barras
  const calcularPorcentaje = (valor) => {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  };

  const estadosData = [
    {
      key: 'pendiente',
      label: 'Pendientes',
      valor: porEstado.pendiente || 0,
      color: 'bg-gray-500',
      bgLight: 'bg-gray-100',
      textColor: 'text-gray-700'
    },
    {
      key: 'en_progreso',
      label: 'En Progreso',
      valor: porEstado.en_progreso || 0,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-100',
      textColor: 'text-blue-700'
    },
    {
      key: 'en_revision',
      label: 'En Revisión',
      valor: porEstado.en_revision || 0,
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-100',
      textColor: 'text-yellow-700'
    },
    {
      key: 'completada',
      label: 'Completadas',
      valor: porEstado.completada || 0,
      color: 'bg-green-500',
      bgLight: 'bg-green-100',
      textColor: 'text-green-700'
    },
    {
      key: 'cancelada',
      label: 'Canceladas',
      valor: porEstado.cancelada || 0,
      color: 'bg-red-500',
      bgLight: 'bg-red-100',
      textColor: 'text-red-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tareas</p>
              <p className="text-2xl font-bold text-gray-800">{total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ListTodo className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{porEstado.completada || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{vencidas}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Urgentes</p>
              <p className="text-2xl font-bold text-orange-600">{urgentes}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Flag className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de barras por estado */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          Distribución por Estado
        </h3>

        <div className="space-y-4">
          {estadosData.map((estado) => (
            <div key={estado.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${estado.textColor}`}>{estado.label}</span>
                <span className="text-gray-600">
                  {estado.valor} ({calcularPorcentaje(estado.valor)}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${estado.color}`}
                  style={{ width: `${calcularPorcentaje(estado.valor)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tasa de completado */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            Tasa de Completado
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-gray-200"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-green-500"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${calcularPorcentaje(porEstado.completada || 0) * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">
                  {calcularPorcentaje(porEstado.completada || 0)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-bold text-green-600">{porEstado.completada || 0}</span> de{' '}
                <span className="font-bold">{total}</span> tareas completadas
              </p>
            </div>
          </div>
        </div>

        {/* Tareas pendientes de revisión */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-yellow-600" />
            Pendientes de Revisión
          </h3>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-yellow-100 rounded-xl">
              <span className="text-3xl font-bold text-yellow-600">{enRevision}</span>
            </div>
            <p className="text-gray-600">
              Tareas esperando aprobación del administrador
            </p>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Resumen</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{porEstado.pendiente || 0}</p>
            <p className="text-blue-100 text-sm">Por hacer</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{porEstado.en_progreso || 0}</p>
            <p className="text-blue-100 text-sm">En curso</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{enRevision}</p>
            <p className="text-blue-100 text-sm">En revisión</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{vencidas}</p>
            <p className="text-blue-100 text-sm">Vencidas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
