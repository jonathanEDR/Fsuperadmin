/**
 * Componente TablaQRs
 * Tabla con historial de todos los códigos QR generados
 */

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  Calendar, 
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';

const TablaQRs = ({ 
  qrs = [], 
  onActivar, 
  onDesactivar, 
  onEliminar,
  onVerDetalles,
  loading = false,
  paginaActual = 1,
  totalPaginas = 1,
  onCambiarPagina
}) => {
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, activo, inactivo

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar QRs
  const qrsFiltrados = qrs.filter(qr => {
    const cumpleBusqueda = 
      qr.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      qr.sucursalNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      qr.createdByName.toLowerCase().includes(busqueda.toLowerCase());
    
    const cumpleEstado = 
      filtroEstado === 'todos' ||
      (filtroEstado === 'activo' && qr.activo) ||
      (filtroEstado === 'inactivo' && !qr.activo);
    
    return cumpleBusqueda && cumpleEstado;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando historial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      
      {/* Header con búsqueda y filtros */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          
          {/* Buscador */}
          <div className="relative flex-1 w-full lg:w-auto">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, sucursal o creador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtros de estado */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === 'todos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({qrs.length})
            </button>
            <button
              onClick={() => setFiltroEstado('activo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === 'activo'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Activos ({qrs.filter(q => q.activo).length})
            </button>
            <button
              onClick={() => setFiltroEstado('inactivo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === 'inactivo'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactivos ({qrs.filter(q => !q.activo).length})
            </button>
          </div>
        </div>
      </div>

      {/* Tabla - Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código QR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estadísticas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {qrsFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  <Search size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No se encontraron códigos QR</p>
                  <p className="text-sm mt-1">Intenta con otros filtros de búsqueda</p>
                </td>
              </tr>
            ) : (
              qrsFiltrados.map((qr) => (
                <tr key={qr._id} className="hover:bg-gray-50 transition-colors">
                  
                  {/* Código QR */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{qr.nombre}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin size={14} />
                        <span>{qr.sucursalNombre}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {qr.codigo.substring(0, 12)}...
                      </p>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      qr.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {qr.activo ? (
                        <>
                          <CheckCircle size={14} className="mr-1" />
                          Activo
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="mr-1" />
                          Inactivo
                        </>
                      )}
                    </span>
                  </td>

                  {/* Estadísticas */}
                  <td className="px-6 py-4">
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-blue-600">{qr.totalEscaneos || 0}</p>
                        <p className="text-xs text-gray-500">Escaneos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-600">{qr.totalEntradas || 0}</p>
                        <p className="text-xs text-gray-500">Entradas</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-orange-600">{qr.totalSalidas || 0}</p>
                        <p className="text-xs text-gray-500">Salidas</p>
                      </div>
                    </div>
                  </td>

                  {/* Creación */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-900">
                        <Calendar size={14} />
                        <span>{formatearFecha(qr.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <User size={14} />
                        <span>{qr.createdByName}</span>
                      </div>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {qr.activo ? (
                        <button
                          onClick={() => onDesactivar(qr._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Desactivar"
                        >
                          <XCircle size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onActivar(qr._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activar"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => onVerDetalles(qr)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEliminar(qr._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards - Mobile */}
      <div className="lg:hidden divide-y divide-gray-200">
        {qrsFiltrados.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Search size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-lg font-medium">No se encontraron códigos QR</p>
            <p className="text-sm mt-1">Intenta con otros filtros de búsqueda</p>
          </div>
        ) : (
          qrsFiltrados.map((qr) => (
            <div key={qr._id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{qr.nombre}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin size={14} />
                    <span>{qr.sucursalNombre}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                  qr.activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {qr.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <p className="font-bold text-blue-600 text-lg">{qr.totalEscaneos || 0}</p>
                  <p className="text-xs text-gray-600">Escaneos</p>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <p className="font-bold text-green-600 text-lg">{qr.totalEntradas || 0}</p>
                  <p className="text-xs text-gray-600">Entradas</p>
                </div>
                <div className="bg-orange-50 p-2 rounded text-center">
                  <p className="font-bold text-orange-600 text-lg">{qr.totalSalidas || 0}</p>
                  <p className="text-xs text-gray-600">Salidas</p>
                </div>
              </div>

              {/* Info adicional */}
              <div className="text-xs text-gray-600 space-y-1 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatearFecha(qr.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{qr.createdByName}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                {qr.activo ? (
                  <button
                    onClick={() => onDesactivar(qr._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    <XCircle size={16} />
                    <span>Desactivar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onActivar(qr._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <CheckCircle size={16} />
                    <span>Activar</span>
                  </button>
                )}
                <button
                  onClick={() => onVerDetalles(qr)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onEliminar(qr._id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Página <span className="font-semibold">{paginaActual}</span> de{' '}
              <span className="font-semibold">{totalPaginas}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onCambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => onCambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaQRs;
