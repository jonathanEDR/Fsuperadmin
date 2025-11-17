/**
 * Componente FiltrosAsistencia
 * Panel de filtros para el módulo de asistencias
 * 
 * Features:
 * - Filtro por colaborador
 * - Filtro por mes/año
 * - Filtro por estado
 * - Selector de vista (calendario/lista/reporte)
 * - Botón para nueva asistencia
 * - Reset de filtros
 */

import React from 'react';
import { Plus, Calendar, Filter, RotateCcw, LayoutGrid, List, BarChart } from 'lucide-react';

const FiltrosAsistencia = React.memo(({
  filtros = {},
  colaboradores = [],
  onFiltrosChange,
  onVistaChange,
  vistaActual = 'calendario',
  onNuevaAsistencia,
  onResetFiltros
}) => {
  
  const { colaboradorId, año, mes, estado } = filtros;
  
  // Manejar cambio de colaborador
  const handleColaboradorChange = (e) => {
    const valor = e.target.value;
    onFiltrosChange({ 
      ...filtros, 
      colaboradorId: valor === '' ? null : valor 
    });
  };
  
  // Manejar cambio de mes
  const handleMesChange = (e) => {
    onFiltrosChange({ 
      ...filtros, 
      mes: parseInt(e.target.value) 
    });
  };
  
  // Manejar cambio de año
  const handleAñoChange = (e) => {
    onFiltrosChange({ 
      ...filtros, 
      año: parseInt(e.target.value) 
    });
  };
  
  // Manejar cambio de estado
  const handleEstadoChange = (e) => {
    onFiltrosChange({ 
      ...filtros, 
      estado: e.target.value 
    });
  };
  
  // Generar array de años (últimos 5 años y próximos 2)
  const obtenerAños = () => {
    const añoActual = new Date().getFullYear();
    const años = [];
    for (let i = añoActual - 5; i <= añoActual + 2; i++) {
      años.push(i);
    }
    return años;
  };
  
  // Meses del año
  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6 space-y-4">
        
        {/* Header con botón de nueva asistencia */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
          </div>
          
          <button
            onClick={onNuevaAsistencia}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nueva Asistencia</span>
          </button>
        </div>
        
        {/* Filtros principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Colaborador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colaborador
            </label>
            <select
              value={colaboradorId || ''}
              onChange={handleColaboradorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los colaboradores</option>
              {colaboradores.map(colaborador => (
                <option key={colaborador.clerk_id} value={colaborador.clerk_id}>
                  {colaborador.nombre_negocio}
                </option>
              ))}
            </select>
          </div>
          
          {/* Mes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <select
              value={mes}
              onChange={handleMesChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {meses.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Año */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              value={año}
              onChange={handleAñoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {obtenerAños().map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={estado}
              onChange={handleEstadoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="presente">Presente</option>
              <option value="ausente">Ausente</option>
              <option value="tardanza">Tardanza</option>
              <option value="permiso">Permiso</option>
              <option value="falta_justificada">Falta Justificada</option>
              <option value="falta_injustificada">Falta Injustificada</option>
            </select>
          </div>
        </div>
        
        {/* Selector de vista y reset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t">
          
          {/* Selector de vista */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Vista:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onVistaChange('calendario')}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${vistaActual === 'calendario'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Calendar size={16} />
                <span className="hidden sm:inline">Calendario</span>
              </button>
              
              <button
                onClick={() => onVistaChange('lista')}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${vistaActual === 'lista'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <List size={16} />
                <span className="hidden sm:inline">Lista</span>
              </button>
              
              <button
                onClick={() => onVistaChange('reporte')}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${vistaActual === 'reporte'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <BarChart size={16} />
                <span className="hidden sm:inline">Reporte</span>
              </button>
            </div>
          </div>
          
          {/* Botón reset */}
          <button
            onClick={onResetFiltros}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={16} />
            <span>Limpiar Filtros</span>
          </button>
        </div>
        
        {/* Indicadores de filtros activos */}
        {(colaboradorId || estado !== 'todos') && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            
            {colaboradorId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Colaborador específico
              </span>
            )}
            
            {estado !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Estado: {estado}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

FiltrosAsistencia.displayName = 'FiltrosAsistencia';

export default FiltrosAsistencia;
