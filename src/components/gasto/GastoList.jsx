import React, { useState, useEffect } from 'react';
import useGastos from './useGastos';
import GastoForm from './GastoForm';
import GastoTable from './GastoTable';

export default function GastoList() {
  const {
    gastos,
    loading,
    error,
    isSubmitting,
    addGasto,
    updateGasto,
    deleteGasto,
    // filtros y helpers si los necesitas
  } = useGastos();

  // Estado para el formulario
  const initialGasto = {
    _id: null,
    descripcion: '',
    costoUnidad: '',
    cantidad: '',
    tipoDeGasto: '',
    gasto: '',
    fechaGasto: new Date().toISOString().slice(0, 16),
  };
  const [showForm, setShowForm] = useState(false);
  const [gastoActual, setGastoActual] = useState(initialGasto);

  // Estados y funciones para la vista de gastos por categoría
  const [showGastosList, setShowGastosList] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '', active: false });
  const [dateFilter, setDateFilter] = useState('all');

  // Handlers para formulario
  const handleFormChange = (field, value) => {
    setGastoActual(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (gastoActual._id) {
      await updateGasto(gastoActual);
    } else {
      await addGasto(gastoActual);
    }
    setShowForm(false);
    setGastoActual(initialGasto);
  };

  const handleEdit = (gasto) => {
    setGastoActual({ ...gasto, costoUnidad: gasto.costoUnidad.toString(), cantidad: gasto.cantidad.toString() });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
      await deleteGasto(id);
    }
  };

  const handleAdd = () => {
    setGastoActual(initialGasto);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setGastoActual(initialGasto);
  };

  // Función para mostrar la lista de gastos de una sección/categoría
  const handleSectionChange = (key, name) => {
    setSelectedCategory(name);
    setShowGastosList(true);
  };

  // Función para cerrar la lista de gastos
  const handleCloseGastosList = () => {
    setShowGastosList(false);
    setSelectedCategory('');
  };

  // Función para agregar gasto por categoría
  const handleAddGastoByCategory = (category) => {
    setGastoActual({ ...initialGasto, tipoDeGasto: category });
    setShowForm(true);
  };

  // Función para aplicar filtro de fecha rápido
  const handleDateFilterChange = (key, days) => {
    setDateFilter(key);
    setCustomDateRange({ start: '', end: '', active: false });
  };

  // Función para aplicar filtro de rango personalizado
  const handleCustomDateRange = () => {
    setDateFilter('custom');
    setCustomDateRange(prev => ({ ...prev, active: true }));
  };

  // Dummy helpers para evitar errores (puedes reemplazar por tus implementaciones reales)
  const getDateRangeText = () => 'filtro activo';
  const getGastosByCategory = (cat) => gastos.filter(g => g.gasto === cat);
  const filterGastosByDateRange = (arr) => arr; // Devuelve todos, puedes filtrar por fecha si lo necesitas
  const getTotalByType = (arr) => arr.reduce((sum, g) => sum + (parseFloat(g.costoUnidad) * parseFloat(g.cantidad)), 0);
  const formatCurrency = (num) => `$${Number(num).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const groupGastosByProduct = (arr) => {
    const groups = {};
    arr.forEach(g => {
      if (!groups[g.descripcion]) {
        groups[g.descripcion] = { gastos: [], totalCantidad: 0, totalMonto: 0, tiposDeGasto: new Set() };
      }
      groups[g.descripcion].gastos.push(g);
      groups[g.descripcion].totalCantidad += parseFloat(g.cantidad);
      groups[g.descripcion].totalMonto += parseFloat(g.costoUnidad) * parseFloat(g.cantidad);
      groups[g.descripcion].tiposDeGasto.add(g.tipoDeGasto);
    });
    return groups;
  };
  const getProductStats = (arr) => ({ totalCompras: arr.length, costoPromedio: arr.reduce((sum, g) => sum + parseFloat(g.costoUnidad), 0) / (arr.length || 1) });
  const handleEditGasto = handleEdit;
  const handleDeleteGasto = handleDelete;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Control de Gastos</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      {/* Tarjetas de secciones */}
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Control de Secciones</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tarjeta de Finanzas */}
          <div 
            onClick={() => handleSectionChange('finanzas', 'Finanzas')}
            className="bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <div className="aspect-square p-6 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fa fa-dollar-sign text-4xl text-blue-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Finanzas</h3>
                <p className="text-gray-600 text-center text-sm">
                  Gestión de ingresos y egresos, control de presupuesto y más.
                </p>
              </div>
              <div className="mt-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddGastoByCategory('Financiero');
                  }}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <i className="fa fa-plus"></i>
                  <span>Agregar Gasto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta de Producción */}
          <div 
            onClick={() => handleSectionChange('produccion', 'Producción')}
            className="bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <div className="aspect-square p-6 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fa fa-cogs text-4xl text-green-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Producción</h3>
                <p className="text-gray-600 text-center text-sm">
                  Control de inventarios, planificación de producción y más.
                </p>
              </div>
              <div className="mt-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddGastoByCategory('Producción');
                  }}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <i className="fa fa-plus"></i>
                  <span>Agregar Gasto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta de Ventas */}
          <div 
            onClick={() => handleSectionChange('ventas', 'Ventas')}
            className="bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <div className="aspect-square p-6 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="fa fa-chart-line text-4xl text-yellow-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Ventas</h3>
                <p className="text-gray-600 text-center text-sm">
                  Gestión de ventas, estrategias y análisis de mercado.
                </p>
              </div>
              <div className="mt-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddGastoByCategory('Ventas');
                  }}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <i className="fa fa-plus"></i>
                  <span>Agregar Gasto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta Administrativa */}
          <div 
            onClick={() => handleSectionChange('administrativo', 'Administración')}
            className="bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <div className="aspect-square p-6 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="fa fa-building text-4xl text-purple-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Administrativo</h3>
                <p className="text-gray-600 text-center text-sm">
                  Gestión administrativa, organización de recursos y más.
                </p>
              </div>
              <div className="mt-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddGastoByCategory('Administración');
                  }}
                  className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <i className="fa fa-plus"></i>
                  <span>Agregar Gasto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de gastos por categoría - VISTA UNIFICADA */}
      {showGastosList && (
        <div className="bg-white shadow-xl rounded-lg border-2 border-gray-200 mb-8 animate-fadeIn">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                📊 Gastos de {selectedCategory}
              </h3>
              <button
                onClick={handleCloseGastosList}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                ✕ Cerrar
              </button>
            </div>
            
            {/* Filtros de fecha */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Filtros rápidos */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-2">📅 Período:</span>
                  {[
                    { key: 'today', label: '🔸 Hoy', days: 0 },
                    { key: 'week', label: '📅 Esta Semana', days: 7 },
                    { key: 'month', label: '🗓️ Este Mes', days: 30 },
                    { key: 'year', label: '🗓️ Este Año', days: 365 },
                    { key: 'all', label: '🌍 Todo', days: null }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => handleDateFilterChange(filter.key, filter.days)}
                      className={`px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                        dateFilter === filter.key
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                {/* Selector de rango personalizado */}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm font-medium text-gray-700">🎯 Personalizado:</span>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">hasta</span>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleCustomDateRange()}
                    disabled={!customDateRange.start || !customDateRange.end}
                    className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    📊 Aplicar
                  </button>
                </div>
              </div>
              
              {/* Información del filtro activo */}
              {(dateFilter !== 'all' || customDateRange.active) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      📊 Mostrando gastos: <span className="font-semibold text-blue-600">{getDateRangeText()}</span>
                    </span>
                    <button
                      onClick={() => {
                        setDateFilter('all');
                        setCustomDateRange({ start: '', end: '', active: false });
                      }}
                      className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                      🗑️ Limpiar filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {(() => {
              // Obtener gastos y aplicar filtros de fecha
              const allCategoryGastos = getGastosByCategory(selectedCategory);
              const categoryGastos = filterGastosByDateRange(allCategoryGastos);
              const totalCategory = getTotalByType(categoryGastos);

              if (categoryGastos.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-500 text-xl mb-6">No hay gastos registrados en esta categoría</p>
                    <button
                      onClick={() => {
                        handleCloseGastosList();
                        handleAddGastoByCategory(selectedCategory);
                      }}
                      className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
                    >
                      + Agregar Primer Gasto
                    </button>
                  </div>
                );
              }

              // Agrupar gastos por producto y calcular totales por tipo de gasto
              const productGroups = groupGastosByProduct(categoryGastos);
              const tiposDeGastoUnicos = [...new Set(categoryGastos.map(g => g.tipoDeGasto))].sort();

              return (
                <div className="space-y-6">
                  {/* Resumen total */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-lg font-semibold text-gray-700">Total en {selectedCategory}</span>
                        <div className="text-sm text-gray-600">
                          {categoryGastos.length} registro(s) filtrado(s) de {allCategoryGastos.length} total(es) - {Object.keys(productGroups).length} producto(s) diferentes
                        </div>
                        {categoryGastos.length !== allCategoryGastos.length && (
                          <div className="text-xs text-blue-600 mt-1">
                            📊 Filtro activo: {getDateRangeText()}
                          </div>
                        )}
                      </div>
                      <span className="text-3xl font-bold text-blue-600">{formatCurrency(totalCategory)}</span>
                    </div>
                    
                    {/* Resumen por tipo de gasto */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tiposDeGastoUnicos.map(tipo => {
                          const gastosPorTipo = categoryGastos.filter(g => g.tipoDeGasto === tipo);
                          const totalPorTipo = getTotalByType(gastosPorTipo);
                          return (
                            <div key={tipo} className="text-center">
                              <div className="text-sm font-medium text-gray-600">{tipo}</div>
                              <div className="text-lg font-bold text-green-600">{formatCurrency(totalPorTipo)}</div>
                              <div className="text-xs text-gray-500">{gastosPorTipo.length} item(s)</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Tabla unificada */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-xl font-bold text-gray-800">📋 Detalle por Producto</h4>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="text-left p-4 font-semibold text-gray-700">Producto</th>
                            <th className="text-center p-4 font-semibold text-gray-700">Cantidad Total</th>
                            <th className="text-center p-4 font-semibold text-gray-700">Costo Promedio</th>
                            {tiposDeGastoUnicos.map(tipo => (
                              <th key={tipo} className="text-center p-4 font-semibold text-gray-700 bg-blue-50">
                                {tipo}
                              </th>
                            ))}
                            <th className="text-center p-4 font-semibold text-gray-700 bg-green-50">Costo Total</th>
                            <th className="text-center p-4 font-semibold text-gray-700">Última Compra</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.entries(productGroups)
                            .sort(([,a], [,b]) => b.totalMonto - a.totalMonto)
                            .map(([descripcion, data]) => {
                              const stats = getProductStats(data.gastos);
                              
                              // Calcular totales por tipo de gasto para este producto
                              const totalesPorTipo = {};
                              tiposDeGastoUnicos.forEach(tipo => {
                                const gastosTipo = data.gastos.filter(g => g.tipoDeGasto === tipo);
                                totalesPorTipo[tipo] = getTotalByType(gastosTipo);
                              });

                              return (
                                <tr key={descripcion} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-4">
                                    <div className="font-semibold text-gray-900">{descripcion}</div>
                                    <div className="text-xs text-gray-500">
                                      {stats.totalCompras} compra(s) - Tipos: {Array.from(data.tiposDeGasto).join(', ')}
                                    </div>
                                  </td>
                                  <td className="text-center p-4 font-semibold">
                                    {data.totalCantidad}
                                  </td>
                                  <td className="text-center p-4 font-semibold">
                                    {formatCurrency(stats.costoPromedio)}
                                  </td>
                                  {tiposDeGastoUnicos.map(tipo => (
                                    <td key={tipo} className="text-center p-4 bg-blue-50">
                                      <span className={`font-bold ${totalesPorTipo[tipo] > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {totalesPorTipo[tipo] > 0 ? formatCurrency(totalesPorTipo[tipo]) : '-'}
                                      </span>
                                    </td>
                                  ))}
                                  <td className="text-center p-4 bg-green-50">
                                    <span className="text-lg font-bold text-green-600">
                                      {formatCurrency(data.totalMonto)}
                                    </span>
                                  </td>
                              <td className="text-center p-4">
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => handleEditGasto(data.gastos[0])} // Usar el primer gasto del grupo
                                        className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        title="Editar"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => {
                                          // Confirmar y eliminar todos los gastos del producto
                                          if (window.confirm(`¿Estás seguro de eliminar todos los gastos de "${descripcion}"?`)) {
                                            data.gastos.forEach(gasto => handleDeleteGasto(gasto._id));
                                          }
                                        }}
                                        className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                        title="Eliminar"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                        
                        {/* Fila de totales */}
                        <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                          <tr className="font-bold">
                            <td className="p-4 text-gray-800">TOTALES</td>
                            <td className="text-center p-4 text-gray-800">
                              {categoryGastos.reduce((sum, g) => sum + g.cantidad, 0)}
                            </td>
                            <td className="text-center p-4 text-gray-600">-</td>
                            {tiposDeGastoUnicos.map(tipo => {
                              const gastosTipo = categoryGastos.filter(g => g.tipoDeGasto === tipo);
                              const totalTipo = getTotalByType(gastosTipo);
                              return (
                                <td key={tipo} className="text-center p-4 bg-blue-100">
                                  <span className="text-blue-700 font-bold">
                                    {formatCurrency(totalTipo)}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="text-center p-4 bg-green-100">
                              <span className="text-xl font-bold text-green-700">
                                {formatCurrency(totalCategory)}
                              </span>
                            </td>
                            <td className="text-center p-4 text-gray-600">-</td>
                            <td className="text-center p-4">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  {/* Botón para agregar nuevo gasto */}
                  <div className="text-center pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleCloseGastosList();
                        handleAddGastoByCategory(selectedCategory);
                      }}
                      className="bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 transition-colors font-bold text-lg shadow-lg"
                    >
                      ➕ Agregar Nuevo Gasto en {selectedCategory}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* Botón para agregar nuevo gasto (fuera del bloque de gastos por categoría) */}
      <button 
        onClick={() => setShowForm(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg mb-6 transition-colors"
      >
        Agregar Nuevo Gasto
      </button>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {gastoActual._id ? 'Actualizar Gasto' : 'Agregar Nuevo Gasto'}
              </h3>
              <GastoForm
                gasto={gastoActual}
                onChange={handleFormChange}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}