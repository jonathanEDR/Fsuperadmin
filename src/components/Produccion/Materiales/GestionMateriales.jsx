import React, { useState, useEffect } from 'react';
import { materialService } from '../../../services/materialService';
import FormularioMaterialMejorado from './FormularioMaterialMejorado';
import AjusteMaterial from './AjusteMaterial';
import MovimientosMaterial from './MovimientosMaterial';
import BreadcrumbProduccion from '../BreadcrumbProduccion';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

const GestionMateriales = () => {
  // Hook de permisos para control de roles
  const { 
    canViewPrices, 
    canManageMateriales, 
    canAdjustInventory 
  } = useQuickPermissions();
  
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    buscar: '',
    unidadMedida: '',
    activo: true
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [materialEditando, setMaterialEditando] = useState(null);
  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [accionesExpandidas, setAccionesExpandidas] = useState({});

  useEffect(() => {
    cargarMateriales();
  }, [filtros]);

  const cargarMateriales = async () => {
    try {
      setLoading(true);
      const response = await materialService.obtenerMateriales(filtros);
      setMateriales(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar materiales: ' + err.message);
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

  const handleNuevoMaterial = () => {
    setMaterialEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarMaterial = (material) => {
    setMaterialEditando(material);
    setMostrarFormulario(true);
  };

  const handleGuardarMaterial = (materialGuardado) => {
    if (materialEditando) {
      setMateriales(prev => prev.map(m => m._id === materialGuardado._id ? materialGuardado : m));
    } else {
      setMateriales(prev => [materialGuardado, ...prev]);
    }
    setMostrarFormulario(false);
    setMaterialEditando(null);
  };

  const handleDesactivarMaterial = async (material) => {
    if (!confirm(`¿Está seguro de desactivar el material "${material.nombre}"?`)) {
      return;
    }

    try {
      await materialService.desactivarMaterial(material._id);
      cargarMateriales();
    } catch (error) {
      console.error('Error al desactivar material:', error);
      alert('Error al desactivar el material');
    }
  };

  const toggleAcciones = (materialId) => {
    setAccionesExpandidas(prev => ({
      ...prev,
      [materialId]: !prev[materialId]
    }));
  };

  const formatearNumero = (numero) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero);
  };

  const getEstadoStock = (material) => {
    const disponible = material.cantidad - (material.consumido || 0);
    if (disponible <= 0) return { color: 'text-red-600', texto: 'Agotado' };
    if (disponible <= material.stockMinimo) return { color: 'text-yellow-600', texto: 'Stock Bajo' };
    return { color: 'text-green-600', texto: 'Disponible' };
  };

  const unidadesMedida = ['', 'kg', 'gr', 'lt', 'ml', 'unidad', 'pieza'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbProduccion />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Materiales</h1>
          <p className="text-gray-600 mt-1">Administra el inventario de materiales de producción</p>
        </div>

      </div>

      {/* Filtros optimizados para móvil */}
      <div className="bg-white p-2 md:p-4 rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
        {/* Filtro de búsqueda principal en móvil */}
        <div className="block md:hidden mb-3">
          <input
            type="text"
            placeholder="Buscar material..."
            value={filtros.buscar}
            onChange={(e) => handleFiltroChange('buscar', e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Layout compacto para móvil - selectores en una fila */}
        <div className="flex md:hidden gap-2 mb-2">
          <select
            value={filtros.unidadMedida}
            onChange={(e) => handleFiltroChange('unidadMedida', e.target.value)}
            className="flex-1 p-2 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las unidades</option>
            {unidadesMedida.slice(1).map(unidad => (
              <option key={unidad} value={unidad}>{unidad}</option>
            ))}
          </select>
          
          <select
            value={filtros.activo}
            onChange={(e) => handleFiltroChange('activo', e.target.value === 'true')}
            className="flex-1 p-2 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={true}>Activos</option>
            <option value={false}>Inactivos</option>
          </select>
        </div>
        
        {/* Layout original para desktop */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar material
            </label>
            <input
              type="text"
              placeholder="Nombre del material..."
              value={filtros.buscar}
              onChange={(e) => handleFiltroChange('buscar', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad de medida
            </label>
            <select
              value={filtros.unidadMedida}
              onChange={(e) => handleFiltroChange('unidadMedida', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las unidades</option>
              {unidadesMedida.slice(1).map(unidad => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.activo}
              onChange={(e) => handleFiltroChange('activo', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={true}>Materiales activos</option>
              <option value={false}>Materiales inactivos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={cargarMateriales}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Estadísticas rápidas optimizadas para móvil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg md:text-2xl font-bold text-blue-600">
            {materiales.length}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Total Materiales</div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg md:text-2xl font-bold text-green-600">
            {materiales.filter(m => (m.cantidad - (m.consumido || 0)) > m.stockMinimo).length}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Con Stock Suficiente</div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg md:text-2xl font-bold text-yellow-600">
            {materiales.filter(m => {
              const disponible = m.cantidad - (m.consumido || 0);
              return disponible > 0 && disponible <= m.stockMinimo;
            }).length}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Stock Bajo</div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg md:text-2xl font-bold text-red-600">
            {materiales.filter(m => (m.cantidad - (m.consumido || 0)) <= 0).length}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Agotados</div>
        </div>
      </div>
        {/* Solo super_admin puede crear nuevos materiales */}
        {canManageMateriales && (
          <button
            onClick={handleNuevoMaterial}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Material</span>
          </button>
        )}
      {/* Tabla de materiales optimizada para móvil */}
      
      {/* ========== VISTA MÓVIL: Tarjetas ========== */}
      <div className="md:hidden space-y-3">
        {materiales.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">No se encontraron materiales</p>
          </div>
        ) : (
          materiales.map((material) => {
            const estadoStock = getEstadoStock(material);
            const disponible = material.cantidad - (material.consumido || 0);
            
            return (
              <div 
                key={material._id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">
                      {material.nombre}
                    </h3>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full mt-1">
                      {material.unidadMedida}
                    </span>
                  </div>
                  {/* Badge de estado */}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    estadoStock.color === 'text-red-600' 
                      ? 'bg-red-100 text-red-700' 
                      : estadoStock.color === 'text-yellow-600' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                  }`}>
                    {estadoStock.texto}
                  </span>
                </div>
                
                {/* Referencia al producto */}
                {material.productoReferencia && (
                  <div className="bg-blue-50 rounded-lg p-2 mb-3 flex items-center text-xs">
                    <span className="mr-1">📦</span>
                    <span className="text-blue-700 truncate">
                      {material.productoReferencia.nombre}
                    </span>
                  </div>
                )}
                
                {/* Stats en grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-blue-600 font-medium">Disponible</p>
                    <p className={`text-sm font-bold ${estadoStock.color}`}>{formatearNumero(disponible)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-orange-600 font-medium">Stock Mín.</p>
                    <p className="text-sm font-bold text-orange-800">{formatearNumero(material.stockMinimo)}</p>
                  </div>
                  {/* Solo super_admin ve el precio */}
                  {canViewPrices ? (
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-emerald-600 font-medium">Precio</p>
                      <p className="text-sm font-bold text-emerald-800">${formatearNumero(material.precioUnitario)}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-600 font-medium">Total</p>
                      <p className="text-sm font-bold text-gray-800">{formatearNumero(material.cantidad)}</p>
                    </div>
                  )}
                </div>
                
                {/* Info adicional */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
                  <span>Total: {formatearNumero(material.cantidad)}</span>
                  {material.consumido > 0 && (
                    <span>Consumido: {formatearNumero(material.consumido)}</span>
                  )}
                </div>
                
                {/* Acciones */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="flex space-x-1">
                    {/* Solo super_admin puede editar */}
                    {canManageMateriales && (
                      <button
                        onClick={() => handleEditarMaterial(material)}
                        className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        <span className="mr-1">✏️</span> Editar
                      </button>
                    )}
                    {/* Admin o superior puede ajustar */}
                    {canAdjustInventory && (
                      <button
                        onClick={() => {
                          setMaterialSeleccionado(material);
                          setMostrarAjuste(true);
                        }}
                        className="flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                      >
                        <span className="mr-1">⚖️</span> Ajustar
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setMaterialSeleccionado(material);
                        setMostrarMovimientos(true);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Movimientos"
                    >
                      📋
                    </button>
                    {/* Solo super_admin puede desactivar */}
                    {material.activo && canManageMateriales && (
                      <button
                        onClick={() => handleDesactivarMaterial(material)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Desactivar"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========== VISTA DESKTOP: Tabla ========== */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto Referencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Mínimo
                </th>
                {/* Solo super_admin ve la columna de precio */}
                {canViewPrices && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materiales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron materiales
                  </td>
                </tr>
              ) : (
                materiales.map((material) => {
                  const estadoStock = getEstadoStock(material);
                  const disponible = material.cantidad - (material.consumido || 0);

                  return (
                    <tr key={material._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {material.unidadMedida}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {material.productoReferencia?.nombre || 'Sin referencia'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {material.productoReferencia?.categoria || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatearNumero(disponible)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: {formatearNumero(material.cantidad)}
                          {material.consumido > 0 && (
                            <span> | Consumido: {formatearNumero(material.consumido)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatearNumero(material.stockMinimo)}
                        </div>
                      </td>
                      {/* Solo super_admin ve el precio */}
                      {canViewPrices && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            ${formatearNumero(material.precioUnitario)}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${estadoStock.color}`}>
                          {estadoStock.texto}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {/* Solo super_admin puede editar */}
                          {canManageMateriales && (
                            <button
                              onClick={() => handleEditarMaterial(material)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                              title="Editar material"
                            >
                              Editar
                            </button>
                          )}
                          {/* Admin o superior puede ajustar */}
                          {canAdjustInventory && (
                            <button
                              onClick={() => {
                                setMaterialSeleccionado(material);
                                setMostrarAjuste(true);
                              }}
                              className="text-green-600 hover:text-green-900 text-sm"
                              title="Ajustar inventario"
                            >
                              Ajustar
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setMaterialSeleccionado(material);
                              setMostrarMovimientos(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 text-sm"
                            title="Ver movimientos"
                          >
                            Movimientos
                          </button>
                          {/* Solo super_admin puede desactivar */}
                          {material.activo && canManageMateriales && (
                            <button
                              onClick={() => handleDesactivarMaterial(material)}
                              className="text-red-600 hover:text-red-900 text-sm"
                              title="Desactivar material"
                            >
                              Desactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {mostrarFormulario && (
        <FormularioMaterialMejorado
          material={materialEditando}
          onGuardar={handleGuardarMaterial}
          onCancelar={() => {
            setMostrarFormulario(false);
            setMaterialEditando(null);
          }}
        />
      )}

      {mostrarAjuste && materialSeleccionado && (
        <AjusteMaterial
          material={materialSeleccionado}
          onGuardar={() => {
            setMostrarAjuste(false);
            setMaterialSeleccionado(null);
            cargarMateriales();
          }}
          onCancelar={() => {
            setMostrarAjuste(false);
            setMaterialSeleccionado(null);
          }}
        />
      )}

      {mostrarMovimientos && materialSeleccionado && (
        <MovimientosMaterial
          material={materialSeleccionado}
          onCerrar={() => {
            setMostrarMovimientos(false);
            setMaterialSeleccionado(null);
          }}
        />
      )}
    </div>
  );
};

export default GestionMateriales;