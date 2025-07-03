import React, { useState, useEffect } from 'react';
import { movimientoService } from '../../../services/movimientoService';
import { ingredienteService } from '../../../services/ingredienteService';

const GestionMovimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    ingrediente: '',
    tipoMovimiento: '',
    fechaDesde: '',
    fechaHasta: '',
    page: 1,
    limit: 50
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarMovimientos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar ingredientes usando el método correcto
      const ingredientesResponse = await ingredienteService.obtenerIngredientes();
      const ingredientesData = ingredientesResponse.data || ingredientesResponse;
      
      // Cargar movimientos iniciales
      const movimientosResponse = await movimientoService.obtenerMovimientos(filtros);
      const movimientosData = movimientosResponse.data || movimientosResponse.movimientos || movimientosResponse;
      
      // Asegurar que sean arrays
      setIngredientes(Array.isArray(ingredientesData) ? ingredientesData : []);
      setMovimientos(Array.isArray(movimientosData) ? movimientosData : []);
      
    } catch (error) {
      // console.error('Error al cargar datos:', error);
      
      // Inicializar con arrays vacíos en caso de error
      setIngredientes([]);
      setMovimientos([]);
      
      // alert('Error al cargar los datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const cargarMovimientos = async () => {
    try {
      const data = await movimientoService.obtenerMovimientos(filtros);
      setMovimientos(data.movimientos || data);
    } catch (error) {
      // console.error('Error al cargar movimientos:', error);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset página al cambiar filtros
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      ingrediente: '',
      tipoMovimiento: '',
      fechaDesde: '',
      fechaHasta: '',
      page: 1,
      limit: 50
    });
  };

  const exportarMovimientos = async () => {
    try {
      const response = await movimientoService.exportar(filtros);
      // Crear y descargar archivo CSV
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // console.error('Error al exportar:', error);
      // alert('Error al exportar los movimientos');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoMovimientoBadge = (tipo) => {
    const colors = {
      'Entrada': 'bg-green-100 text-green-800',
      'Salida': 'bg-red-100 text-red-800',
      'Ajuste': 'bg-blue-100 text-blue-800',
      'Producción': 'bg-purple-100 text-purple-800'
    };
    
    return `px-2 py-1 rounded-full text-sm font-medium ${colors[tipo] || 'bg-gray-100 text-gray-800'}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Movimientos de Inventario
        </h1>
        <button
          onClick={exportarMovimientos}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
        >
          <span>📊</span>
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingrediente
            </label>
            <select
              name="ingrediente"
              value={filtros.ingrediente}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los ingredientes</option>
              {ingredientes.map(ingrediente => (
                <option key={ingrediente._id} value={ingrediente._id}>
                  {ingrediente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Movimiento
            </label>
            <select
              name="tipoMovimiento"
              value={filtros.tipoMovimiento}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los tipos</option>
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
              <option value="Ajuste">Ajuste</option>
              <option value="Producción">Producción</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              name="fechaDesde"
              value={filtros.fechaDesde}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              name="fechaHasta"
              value={filtros.fechaHasta}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Movimientos</div>
          <div className="text-2xl font-bold text-gray-900">{movimientos.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Entradas</div>
          <div className="text-2xl font-bold text-green-600">
            {movimientos.filter(m => m.tipoMovimiento === 'Entrada').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Salidas</div>
          <div className="text-2xl font-bold text-red-600">
            {movimientos.filter(m => m.tipoMovimiento === 'Salida').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Ajustes</div>
          <div className="text-2xl font-bold text-blue-600">
            {movimientos.filter(m => m.tipoMovimiento === 'Ajuste').length}
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingrediente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Anterior
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Nuevo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron movimientos con los filtros aplicados
                  </td>
                </tr>
              ) : (
                movimientos.map((movimiento, index) => (
                  <tr key={movimiento._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearFecha(movimiento.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {movimiento.ingrediente?.nombre || 'Ingrediente no encontrado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getTipoMovimientoBadge(movimiento.tipoMovimiento)}>
                        {movimiento.tipoMovimiento}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={movimiento.tipoMovimiento === 'Salida' ? 'text-red-600' : 'text-green-600'}>
                        {movimiento.tipoMovimiento === 'Salida' ? '-' : '+'}
                        {Math.abs(movimiento.cantidad)} {movimiento.unidadMedida}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movimiento.stockAnterior} {movimiento.unidadMedida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movimiento.stockNuevo} {movimiento.unidadMedida}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {movimiento.motivo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movimiento.usuario || 'Sistema'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {movimientos.length >= filtros.limit && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setFiltros(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={filtros.page === 1}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
            >
              Anterior
            </button>
            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded">
              Página {filtros.page}
            </span>
            <button
              onClick={() => setFiltros(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionMovimientos;
