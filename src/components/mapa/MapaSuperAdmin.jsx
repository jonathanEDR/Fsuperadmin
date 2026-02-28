import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import MapaViewer from './MapaViewer';
import { MapPin, Users, Building2, Filter, RefreshCw, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { ubicacionService } from '../../services/ubicacionService';

/**
 * MapaSuperAdmin - Mapa central con todos los puntos (usuarios + sucursales)
 * Solo accesible por super_admin
 */
const MapaSuperAdmin = () => {
  const { getToken } = useAuth();
  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState({ totalUsuarios: 0, totalSucursales: 0, total: 0 });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    mostrarUsuarios: true,
    mostrarSucursales: true,
    filtroRole: '',
    filtroDepartamento: ''
  });
  const [showFiltros, setShowFiltros] = useState(false);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);

  // Cargar datos del mapa
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const data = await ubicacionService.getMapaGeneral(token);
      
      setPuntos(data.puntos || []);
      setResumen(data.resumen || { totalUsuarios: 0, totalSucursales: 0, total: 0 });
    } catch (err) {
      console.error('Error cargando mapa:', err);
      setError(err.message || 'Error al cargar datos del mapa');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtrar puntos según criterios
  const puntosFiltrados = puntos.filter(p => {
    if (p.tipo === 'usuario' && !filtros.mostrarUsuarios) return false;
    if (p.tipo === 'sucursal' && !filtros.mostrarSucursales) return false;
    if (filtros.filtroRole && p.role !== filtros.filtroRole) return false;
    if (filtros.filtroDepartamento && p.departamento !== filtros.filtroDepartamento) return false;
    return true;
  });

  // Obtener estadísticas rápidas
  const stats = {
    usuariosConUbicacion: puntos.filter(p => p.tipo === 'usuario').length,
    sucursalesConUbicacion: puntos.filter(p => p.tipo === 'sucursal').length,
    admins: puntos.filter(p => p.role === 'admin').length,
    users: puntos.filter(p => p.role === 'user').length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Cargando mapa de ubicaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa de Ubicaciones</h1>
            <p className="text-sm text-gray-500">
              {resumen.total} ubicaciones registradas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showFiltros ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filtros
          </button>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Usuarios</p>
            <p className="text-lg font-bold text-gray-900">{stats.usuariosConUbicacion}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Building2 size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Sucursales</p>
            <p className="text-lg font-bold text-gray-900">{stats.sucursalesConUbicacion}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Admins</p>
            <p className="text-lg font-bold text-gray-900">{stats.admins}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <MapPin size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Puntos</p>
            <p className="text-lg font-bold text-gray-900">{resumen.total}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFiltros && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtros de visualización</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Toggle usuarios */}
            <button
              onClick={() => setFiltros(f => ({ ...f, mostrarUsuarios: !f.mostrarUsuarios }))}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                filtros.mostrarUsuarios ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-300 text-gray-500'
              }`}
            >
              {filtros.mostrarUsuarios ? <Eye size={16} /> : <EyeOff size={16} />}
              Usuarios
            </button>

            {/* Toggle sucursales */}
            <button
              onClick={() => setFiltros(f => ({ ...f, mostrarSucursales: !f.mostrarSucursales }))}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                filtros.mostrarSucursales ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-500'
              }`}
            >
              {filtros.mostrarSucursales ? <Eye size={16} /> : <EyeOff size={16} />}
              Sucursales
            </button>

            {/* Filtro por role */}
            <select
              value={filtros.filtroRole}
              onChange={(e) => setFiltros(f => ({ ...f, filtroRole: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los roles</option>
              <option value="user">Usuarios</option>
              <option value="admin">Administradores</option>
              <option value="super_admin">Super Admin</option>
            </select>

            {/* Filtro por departamento */}
            <select
              value={filtros.filtroDepartamento}
              onChange={(e) => setFiltros(f => ({ ...f, filtroDepartamento: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los departamentos</option>
              <option value="ventas">Ventas</option>
              <option value="administracion">Administración</option>
              <option value="produccion">Producción</option>
              <option value="finanzas">Finanzas</option>
            </select>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Mapa */}
      <MapaViewer
        puntos={puntosFiltrados}
        height="400px"
        fitBounds={true}
        fitBoundsPadding={[30, 30]}
        zoom={14}
        onPuntoClick={(punto) => setPuntoSeleccionado(punto)}
      />

      {/* Leyenda */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Leyenda</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow"></span>
            Sucursales
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></span>
            Usuarios
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow"></span>
            Administradores
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow"></span>
            Super Admin
          </div>
        </div>
      </div>

      {/* Panel de detalle del punto seleccionado */}
      {puntoSeleccionado && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={18} className="text-blue-600" />
              Detalle de ubicación
            </h3>
            <button
              onClick={() => setPuntoSeleccionado(null)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Cerrar ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Nombre</p>
              <p className="font-medium text-gray-900">{puntoSeleccionado.nombre}</p>
            </div>
            <div>
              <p className="text-gray-500">Tipo</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                puntoSeleccionado.tipo === 'sucursal' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {puntoSeleccionado.tipo === 'sucursal' ? 'Sucursal' : 'Usuario'}
              </span>
            </div>
            {puntoSeleccionado.email && (
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{puntoSeleccionado.email}</p>
              </div>
            )}
            {puntoSeleccionado.departamento && (
              <div>
                <p className="text-gray-500">Departamento</p>
                <p className="font-medium text-gray-900 capitalize">{puntoSeleccionado.departamento}</p>
              </div>
            )}
            {puntoSeleccionado.direccion && (
              <div className="sm:col-span-2">
                <p className="text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900">{puntoSeleccionado.direccion}</p>
              </div>
            )}
            {puntoSeleccionado.referencia && (
              <div className="sm:col-span-2">
                <p className="text-gray-500">Referencia</p>
                <p className="font-medium text-gray-900">{puntoSeleccionado.referencia}</p>
              </div>
            )}
            {puntoSeleccionado.coordenadas && (
              <div>
                <p className="text-gray-500">Coordenadas</p>
                <p className="font-mono text-xs text-gray-700">
                  {puntoSeleccionado.coordenadas.lat.toFixed(6)}, {puntoSeleccionado.coordenadas.lng.toFixed(6)}
                </p>
              </div>
            )}
            {puntoSeleccionado.ultimaActualizacion && (
              <div>
                <p className="text-gray-500">Última actualización</p>
                <p className="font-medium text-gray-900">
                  {new Date(puntoSeleccionado.ultimaActualizacion).toLocaleString('es-PE')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaSuperAdmin;
