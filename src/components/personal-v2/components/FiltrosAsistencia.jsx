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
 * - Colapsable (inicia cerrado en móvil)
 */

import React, { useState } from 'react';
import { Plus, Calendar, Filter, RotateCcw, LayoutGrid, List, BarChart, ChevronDown, ChevronUp } from 'lucide-react';

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
  
  // Estado para controlar si los filtros están expandidos (inicia cerrado)
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Contar filtros activos
  const filtrosActivos = [
    colaboradorId ? 1 : 0,
    estado !== 'todos' ? 1 : 0
  ].reduce((a, b) => a + b, 0);
  
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
      {/* Header colapsable */}
      <div 
        className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Filtros</h3>
          {/* Badge de filtros activos */}
          {filtrosActivos > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {filtrosActivos} activo{filtrosActivos > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botón Nueva Asistencia - siempre visible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNuevaAsistencia();
            }}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">Nueva Asistencia</span>
          </button>
          
          {/* Indicador de expandir/colapsar */}
          <div className="p-1 text-gray-500">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>
      
      {/* Contenido colapsable */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-3 sm:p-4 pt-0 sm:pt-0 space-y-4 border-t">
        
        {/* Filtros principales */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-3">
          
          {/* Colaborador */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Colaborador
            </label>
            <select
              value={colaboradorId || ''}
              onChange={handleColaboradorChange}
              className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Mes
            </label>
            <select
              value={mes}
              onChange={handleMesChange}
              className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Año
            </label>
            <select
              value={año}
              onChange={handleAñoChange}
              className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {obtenerAños().map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          
          {/* Estado */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Estado
            </label>
            <select
              value={estado}
              onChange={handleEstadoChange}
              className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t">
          
          {/* Selector de vista */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Vista:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onVistaChange('calendario')}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors
                  ${vistaActual === 'calendario'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Calendar size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Calendario</span>
              </button>
              
              <button
                onClick={() => onVistaChange('lista')}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors
                  ${vistaActual === 'lista'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <List size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              
              <button
                onClick={() => onVistaChange('reporte')}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors
                  ${vistaActual === 'reporte'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <BarChart size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Reporte</span>
              </button>
            </div>
          </div>
          
          {/* Botón reset */}
          <button
            onClick={onResetFiltros}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <RotateCcw size={14} className="sm:w-4 sm:h-4" />
            <span>Limpiar</span>
          </button>
        </div>
        
        {/* Indicadores de filtros activos */}
        {(colaboradorId || estado !== 'todos') && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-xs sm:text-sm text-gray-600">Filtros activos:</span>
            
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
    </div>
  );
});

FiltrosAsistencia.displayName = 'FiltrosAsistencia';

export default FiltrosAsistencia;
