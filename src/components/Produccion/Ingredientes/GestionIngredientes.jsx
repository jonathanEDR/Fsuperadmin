import React, { useState, useEffect } from 'react';
import { ingredienteService } from '../../../services/ingredienteService';
import FormularioIngrediente from './FormularioIngrediente';
import AjusteInventario from './AjusteInventario';
import MovimientosIngrediente from './MovimientosIngrediente';
import TablaIngredientesFinalizados from './TablaIngredientesFinalizados';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';

const GestionIngredientes = () => {
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    buscar: '',
    unidadMedida: '',
    activo: true
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ingredienteEditando, setIngredienteEditando] = useState(null);
  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState(null);

  useEffect(() => {
    cargarIngredientes();
  }, [filtros]);

  const cargarIngredientes = async () => {
    try {
      setLoading(true);
      const response = await ingredienteService.obtenerIngredientes(filtros);
      setIngredientes(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar ingredientes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleNuevoIngrediente = () => {
    setIngredienteEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarIngrediente = (ingrediente) => {
    setIngredienteEditando(ingrediente);
    setMostrarFormulario(true);
  };

  const handleGuardarIngrediente = async (datos) => {
    try {
      if (ingredienteEditando) {
        await ingredienteService.actualizarIngrediente(ingredienteEditando._id, datos);
      } else {
        await ingredienteService.crearIngrediente(datos);
      }
      setMostrarFormulario(false);
      setIngredienteEditando(null);
      cargarIngredientes();
    } catch (err) {
      setError('Error al guardar ingrediente: ' + err.message);
    }
  };

  const handleAjustarInventario = (ingrediente) => {
    setIngredienteSeleccionado(ingrediente);
    setMostrarAjuste(true);
  };

  const handleVerMovimientos = (ingrediente) => {
    setIngredienteSeleccionado(ingrediente);
    setMostrarMovimientos(true);
  };

  const handleDesactivar = async (id) => {
    if (window.confirm('¿Está seguro de desactivar este ingrediente?')) {
      try {
        await ingredienteService.desactivarIngrediente(id);
        cargarIngredientes();
      } catch (err) {
        setError('Error al desactivar ingrediente: ' + err.message);
      }
    }
  };

  const getStockColor = (ingrediente) => {
    const total = ingrediente.cantidad - ingrediente.procesado;
    if (total <= 0) return 'text-red-600';
    if (total <= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Ingredientes</h1>
        <button
          onClick={handleNuevoIngrediente}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          Nuevo Ingrediente
        </button>
      </div>
      <AccesosRapidosProduccion />

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filtros.buscar}
              onChange={(e) => handleFiltroChange('buscar', e.target.value)}
              placeholder="Nombre del ingrediente..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad de Medida
            </label>
            <select
              value={filtros.unidadMedida}
              onChange={(e) => handleFiltroChange('unidadMedida', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="kg">Kilogramos</option>
              <option value="gr">Gramos</option>
              <option value="lt">Litros</option>
              <option value="ml">Mililitros</option>
              <option value="unidad">Unidades</option>
              <option value="pieza">Piezas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.activo}
              onChange={(e) => handleFiltroChange('activo', e.target.value === 'true')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>


      {/* Lista de Ingredientes Disponibles */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingrediente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Procesado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disponible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ingredientes.filter(ingrediente => (ingrediente.cantidad - ingrediente.procesado) > 0).map((ingrediente) => (
                <tr key={ingrediente._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ingrediente.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ingrediente.unidadMedida}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ingrediente.cantidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ingrediente.procesado}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getStockColor(ingrediente)}`}> 
                    {ingrediente.cantidad - ingrediente.procesado}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    S/.{ingrediente.precioUnitario?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditarIngrediente(ingrediente)}
                        title="Editar"
                        className="p-1 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors"
                      >
                        <span role="img" aria-label="Editar">✏️</span>
                      </button>
                      <button
                        onClick={() => handleAjustarInventario(ingrediente)}
                        title="Ajustar Inventario"
                        className="p-1 text-green-600 hover:text-green-900 rounded hover:bg-green-50 transition-colors"
                      >
                        <span role="img" aria-label="Ajustar">⚖️</span>
                      </button>
                      <button
                        onClick={() => handleVerMovimientos(ingrediente)}
                        title="Historial"
                        className="p-1 text-purple-600 hover:text-purple-900 rounded hover:bg-purple-50 transition-colors"
                      >
                        <span role="img" aria-label="Historial">📋</span>
                      </button>
                      <button
                        onClick={() => handleDesactivar(ingrediente._id)}
                        title="Desactivar"
                        className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors"
                      >
                        <span role="img" aria-label="Desactivar">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ingredientes.filter(ingrediente => (ingrediente.cantidad - ingrediente.procesado) > 0).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron ingredientes</p>
          </div>
        )}
      </div>

      {/* Tabla de Ingredientes Finalizados */}
      <TablaIngredientesFinalizados ingredientes={ingredientes} />

      {/* Modales */}
      {mostrarFormulario && (
        <FormularioIngrediente
          ingrediente={ingredienteEditando}
          onGuardar={handleGuardarIngrediente}
          onCancelar={() => {
            setMostrarFormulario(false);
            setIngredienteEditando(null);
          }}
        />
      )}

      {mostrarAjuste && ingredienteSeleccionado && (
        <AjusteInventario
          ingrediente={ingredienteSeleccionado}
          onGuardar={() => {
            setMostrarAjuste(false);
            setIngredienteSeleccionado(null);
            cargarIngredientes();
          }}
          onCancelar={() => {
            setMostrarAjuste(false);
            setIngredienteSeleccionado(null);
          }}
        />
      )}

      {mostrarMovimientos && ingredienteSeleccionado && (
        <MovimientosIngrediente
          ingrediente={ingredienteSeleccionado}
          onCerrar={() => {
            setMostrarMovimientos(false);
            setIngredienteSeleccionado(null);
          }}
        />
      )}
    </div>
  );
};

export default GestionIngredientes;
