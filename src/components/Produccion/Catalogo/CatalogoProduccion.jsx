import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Package, CheckCircle, XCircle, Archive, Pencil, Trash2, Power, AlertTriangle, X as XIcon } from 'lucide-react';
import catalogoProduccionService from '../../../services/catalogoProduccion.js';
import FormularioCatalogoProducto from './FormularioCatalogoProducto';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import BreadcrumbProduccion from '../BreadcrumbProduccion';

const CatalogoProduccion = ({ moduloActual = '' }) => {
  const [productos, setProductos] = useState([]);
  const [modulos, setModulos] = useState([
    { id: 'ingredientes', nombre: 'Ingredientes', activo: true },
    { id: 'materiales', nombre: 'Materiales', activo: true },
    { id: 'recetas', nombre: 'Recetas', activo: true },
    { id: 'produccion', nombre: 'Producción', activo: true }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conexionBackend, setConexionBackend] = useState(null);
  const [filtros, setFiltros] = useState({
    buscar: '',
    moduloSistema: '', // Permitir ver todos los módulos por defecto
    activo: true
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [filtros]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      setError('');
      
      const testResult = await catalogoProduccionService.testConexion();
      setConexionBackend(testResult.backend);
      
      const estadisticasResponse = await catalogoProduccionService.obtenerEstadisticasCatalogo();
      setEstadisticas(estadisticasResponse);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError('Error al cargar datos iniciales');
      setConexionBackend(false);
    }
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const productosData = await catalogoProduccionService.obtenerProductosPorModulo(filtros);
      
      if (Array.isArray(productosData)) {
        setProductos(productosData);
      } else if (productosData && Array.isArray(productosData.productos)) {
        setProductos(productosData.productos);
      } else {
        setProductos([]);
        console.warn('Respuesta de productos no es un array válido:', productosData);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar productos: ' + error.message);
      setProductos([]);
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

  const limpiarFiltros = () => {
    setFiltros({
      buscar: '',
      moduloSistema: '', // Limpiar para mostrar todos los módulos
      activo: true
    });
  };

  const handleGuardarProducto = async (datosProducto) => {
    try {
      setLoading(true);
      
      console.log('🔍 Datos recibidos en handleGuardarProducto:', datosProducto);
      
      // Mapear tipoProduccion a moduloSistema
      const productoConModulo = {
        ...datosProducto,
        moduloSistema: datosProducto.tipoProduccion || 'produccion' // Usar tipoProduccion en lugar de moduloSistema
      };
      
      console.log('📦 Producto con módulo mapeado:', productoConModulo);

      let resultado;
      if (productoEditando) {
        resultado = await catalogoProduccionService.actualizarProducto(productoEditando._id, productoConModulo);
      } else {
        resultado = await catalogoProduccionService.crearProductoPorModulo(productoConModulo);
      }

      if (resultado) {
        setMostrarFormulario(false);
        setProductoEditando(null);
        await cargarProductos();
        await cargarDatosIniciales();
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setError('Error al guardar producto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarProducto = (producto) => {
    setProductoEditando(producto);
    setMostrarFormulario(true);
  };

  const handleEliminarProducto = async (productId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      setLoading(true);
      await catalogoProduccionService.eliminarProducto(productId);
      await cargarProductos();
      await cargarDatosIniciales();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError('Error al eliminar producto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (productId, activo) => {
    try {
      setLoading(true);
      await catalogoProduccionService.toggleActivoProducto(productId, activo);
      await cargarProductos();
      await cargarDatosIniciales();
    } catch (error) {
      console.error('Error al cambiar estado del producto:', error);
      setError('Error al cambiar estado del producto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(producto => {
    let cumpleFiltros = true;

    // Filtro por búsqueda
    if (filtros.buscar.trim()) {
      const busqueda = filtros.buscar.toLowerCase().trim();
      cumpleFiltros = cumpleFiltros && (
        producto.nombre.toLowerCase().includes(busqueda) ||
        producto.codigo.toLowerCase().includes(busqueda) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda))
      );
    }

    // Filtro por estado activo
    if (typeof filtros.activo === 'boolean') {
      cumpleFiltros = cumpleFiltros && (producto.activo === filtros.activo);
    }

    return cumpleFiltros;
  });

  if (loading && productos.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <BreadcrumbProduccion />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Catálogo General de Productos
          </h1>
          <p className="text-gray-600">
            Gestiona productos para todos los módulos del sistema
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setMostrarFormulario(true)}
            className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <Plus size={18} /> Agregar Producto
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError('')}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Cerrar</span>
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Productos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.totalProductos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Activos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.productosActivos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Inactivos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.productosInactivos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Archive className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Módulos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.modulosConProductos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Buscar productos
              </label>
              <input
                type="text"
                value={filtros.buscar}
                onChange={(e) => handleFiltroChange('buscar', e.target.value)}
                placeholder="Nombre, código o descripción..."
                className="mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Módulo
              </label>
              <select
                value={filtros.moduloSistema}
                onChange={(e) => handleFiltroChange('moduloSistema', e.target.value)}
                className="mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none sm:text-sm"
              >
                <option value="">Todos los módulos</option>
                {modulos.map(modulo => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                value={filtros.activo.toString()}
                onChange={(e) => handleFiltroChange('activo', e.target.value === 'true')}
                className="mt-1 block w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none sm:text-sm"
              >
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza agregando un nuevo producto al catálogo.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus size={16} /> Agregar Producto
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosFiltrados.map((producto) => (
                  <tr key={producto._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {producto.nombre}
                          </div>
                          {producto.descripcion && (
                            <div className="text-sm text-gray-500">
                              {producto.descripcion}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {modulos.find(m => m.id === producto.moduloSistema)?.nombre || producto.moduloSistema}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditarProducto(producto)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(producto._id, !producto.activo)}
                          className={`${producto.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={producto.activo ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminarProducto(producto._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {mostrarFormulario && (
        <FormularioCatalogoProducto
          producto={productoEditando}
          tiposProduccion={modulos}
          onGuardar={handleGuardarProducto}
          onCancelar={() => {
            setMostrarFormulario(false);
            setProductoEditando(null);
          }}
        />
      )}
    </div>
  );
};

export default CatalogoProduccion;
