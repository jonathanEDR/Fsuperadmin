import React, { useState, useEffect } from 'react';
import { Package, Calendar, User, Hash, Eye, Edit, Trash2, AlertCircle, CheckCircle, Clock, Search, Filter, X, Loader2, RefreshCw } from 'lucide-react';

const InventarioHistorial = ({ historialEntradas, onRefresh, onEdit, onDelete, loading = false, userRole = 'user' }) => {
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  const isSuperAdmin = userRole === 'super_admin';
  const [entradasFiltradas, setEntradasFiltradas] = useState([]);
  const [mostrarDetalle, setMostrarDetalle] = useState(null);

  // Filtrar entradas cuando cambian los filtros o las entradas
  useEffect(() => {
    // Asegurar que historialEntradas sea un array válido
    if (!Array.isArray(historialEntradas)) {
      setEntradasFiltradas([]);
      return;
    }

    let resultado = historialEntradas || [];

    // Filtro por búsqueda
    if (filtros.busqueda) {
      resultado = resultado.filter(entrada =>
        entrada.productoNombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        entrada.codigoproducto?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        entrada.numeroEntrada?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        entrada.lote?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        entrada.usuario?.toLowerCase().includes(filtros.busqueda.toLowerCase())
      );
    }

    // Filtro por estado
    if (filtros.estado) {
      resultado = resultado.filter(entrada => entrada.estado === filtros.estado);
    }

    // Filtro por fecha
    if (filtros.fechaDesde) {
      resultado = resultado.filter(entrada => {
        const fechaEntrada = new Date(entrada.fecha);
        const fechaDesde = new Date(filtros.fechaDesde);
        return fechaEntrada >= fechaDesde;
      });
    }

    if (filtros.fechaHasta) {
      resultado = resultado.filter(entrada => {
        const fechaEntrada = new Date(entrada.fecha);
        const fechaHasta = new Date(filtros.fechaHasta);
        return fechaEntrada <= fechaHasta;
      });
    }

    setEntradasFiltradas(resultado);
  }, [historialEntradas, filtros]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'agotado':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'inactivo':
        return 'bg-gray-50 text-gray-600 border border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'activo':
        return <CheckCircle size={16} />;
      case 'agotado':
        return <AlertCircle size={16} />;
      case 'inactivo':
        return <Clock size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  if (loading) {
    return (
      <div className="mt-8">
        <div className="flex justify-center items-center py-10">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!historialEntradas || historialEntradas.length === 0) {
    return (
      <div className="mt-8">
        <div className="rounded-2xl shadow-sm border border-gray-100 p-8 text-center bg-white">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay entradas de inventario</h3>
          <p className="text-gray-500">Comienza registrando tu primera entrada de inventario.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Historial de Entradas de Inventario</h2>
            <p className="text-gray-600">Registros individuales de cada entrada con trazabilidad completa</p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors text-sm"
            >
              <RefreshCw size={15} /> Actualizar
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Filtros de Búsqueda</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Producto, lote..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-2 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white outline-none"
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="agotado">Agotado</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                className="w-full px-2 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                className="w-full px-2 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white outline-none"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Mostrando <span className="font-semibold text-gray-700">{entradasFiltradas.length}</span> de <span className="font-semibold text-gray-700">{historialEntradas.length}</span> entradas
            </p>
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X size={12} /> Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
        {/* Desktop Table */}
        <table className="hidden md:table min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/60">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inventario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entradasFiltradas.map((entrada) => (
              <tr key={entrada._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entrada.numeroEntrada || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entrada.fecha ? new Date(entrada.fecha).toLocaleDateString() : 'Sin fecha'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entrada.productoNombre || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entrada.codigoproducto || 'Sin código'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">{entrada.cantidadDisponible || entrada.cantidad}</span>
                    {entrada.cantidadInicial && (
                      <span className="text-gray-500"> / {entrada.cantidadInicial}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    S/ {parseFloat(entrada.precio || 0).toFixed(2)} c/u
                  </div>
                  {entrada.lote && (
                    <div className="text-xs text-gray-500">
                      Lote: {entrada.lote}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(entrada.estado)}`}>
                    {getEstadoIcon(entrada.estado)}
                    <span className="ml-1 capitalize">{entrada.estado || 'activo'}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entrada.usuario || 'Desconocido'}
                      </div>
                      {entrada.usuarioEmail && (
                        <div className="text-sm text-gray-500">
                          {entrada.usuarioEmail}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => setMostrarDetalle(entrada)}
                      className="p-1.5 rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye size={14} />
                    </button>
                    {onEdit && isSuperAdmin && (
                      <button
                        onClick={() => onEdit(entrada._id, entrada)}
                        className="p-1.5 rounded-lg text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
                        title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {onDelete && isSuperAdmin && entrada.cantidadDisponible === entrada.cantidadInicial && (
                      <button
                        onClick={() => onDelete(entrada._id)}
                        className="p-1.5 rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {entradasFiltradas.map((entrada) => (
            <div key={entrada._id} className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Hash className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">
                    {entrada.numeroEntrada || 'N/A'}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(entrada.estado)}`}>
                  {getEstadoIcon(entrada.estado)}
                  <span className="ml-1 capitalize">{entrada.estado || 'activo'}</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">
                    {entrada.productoNombre || 'Sin nombre'} ({entrada.codigoproducto || 'Sin código'})
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {entrada.fecha ? new Date(entrada.fecha).toLocaleDateString() : 'Sin fecha'}
                  </span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {entrada.usuario || 'Desconocido'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {entrada.cantidadDisponible || entrada.cantidad} / {entrada.cantidadInicial} unidades
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    S/ {parseFloat(entrada.precio || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => setMostrarDetalle(entrada)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100"
                >
                  Ver detalles
                </button>
                {onEdit && isSuperAdmin && (
                  <button
                    onClick={() => onEdit(entrada._id, entrada)}
                    className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalles */}
      {mostrarDetalle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                  <Package size={18} className="text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Detalles de la Entrada</h3>
              </div>
              <button
                onClick={() => setMostrarDetalle(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número de Entrada</label>
                  <p className="text-sm text-gray-900">{mostrarDetalle.numeroEntrada || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Producto</label>
                  <p className="text-sm text-gray-900">{mostrarDetalle.productoNombre || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-500">{mostrarDetalle.codigoproducto || 'Sin código'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                  <p className="text-sm text-gray-900">
                    Inicial: {mostrarDetalle.cantidadInicial || mostrarDetalle.cantidad}
                  </p>
                  {mostrarDetalle.cantidadDisponible !== undefined && (
                    <p className="text-sm text-gray-600">
                      Disponible: {mostrarDetalle.cantidadDisponible}
                    </p>
                  )}
                  {mostrarDetalle.cantidadUtilizada !== undefined && (
                    <p className="text-sm text-gray-600">
                      Utilizada: {mostrarDetalle.cantidadUtilizada}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio</label>
                  <p className="text-sm text-gray-900">S/ {parseFloat(mostrarDetalle.precio || 0).toFixed(2)}</p>
                  {mostrarDetalle.costoTotal && (
                    <p className="text-sm text-gray-600">
                      Total: S/ {parseFloat(mostrarDetalle.costoTotal).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(mostrarDetalle.estado)}`}>
                    {getEstadoIcon(mostrarDetalle.estado)}
                    <span className="ml-1 capitalize">{mostrarDetalle.estado || 'activo'}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuario</label>
                  <p className="text-sm text-gray-900">{mostrarDetalle.usuario || 'Desconocido'}</p>
                  {mostrarDetalle.usuarioEmail && (
                    <p className="text-sm text-gray-500">{mostrarDetalle.usuarioEmail}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Entrada</label>
                  <p className="text-sm text-gray-900">
                    {mostrarDetalle.fecha ? new Date(mostrarDetalle.fecha).toLocaleString() : 'Sin fecha'}
                  </p>
                </div>
                {mostrarDetalle.lote && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lote</label>
                    <p className="text-sm text-gray-900">{mostrarDetalle.lote}</p>
                  </div>
                )}
                {mostrarDetalle.proveedor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                    <p className="text-sm text-gray-900">{mostrarDetalle.proveedor}</p>
                  </div>
                )}
                {mostrarDetalle.fechaVencimiento && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                    <p className="text-sm text-gray-900">
                      {new Date(mostrarDetalle.fechaVencimiento).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {mostrarDetalle.observaciones && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {mostrarDetalle.observaciones}
                </p>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setMostrarDetalle(null)}
                className="px-4 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-3 rounded-b-2xl flex-shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioHistorial;
