import React, { useState, useEffect } from 'react';
import { Target, Building2, TrendingUp, Loader, RefreshCw, AlertCircle } from 'lucide-react';
import { metasSucursalService } from '../../services/metasSucursalService';

/**
 * Componente para mostrar el progreso de metas de todas las sucursales
 * Se muestra en el perfil para que el personal pueda dar seguimiento
 */
export default function ProgresoMetasSucursales() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datos, setDatos] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  const cargarDatos = async () => {
    try {
      setError(null);
      const response = await metasSucursalService.obtenerProgresoGlobal();
      setDatos(response.data);
    } catch (err) {
      console.error('Error cargando progreso:', err);
      setError('No se pudo cargar el progreso de metas');
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleRefresh = () => {
    setActualizando(true);
    cargarDatos();
  };

  // Obtener color según porcentaje
  const getColorClasses = (porcentaje) => {
    if (porcentaje >= 100) {
      return {
        bg: 'bg-green-500',
        text: 'text-green-600',
        light: 'bg-green-100'
      };
    } else if (porcentaje >= 75) {
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        light: 'bg-blue-100'
      };
    } else if (porcentaje >= 50) {
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-600',
        light: 'bg-yellow-100'
      };
    } else if (porcentaje >= 25) {
      return {
        bg: 'bg-orange-500',
        text: 'text-orange-600',
        light: 'bg-orange-100'
      };
    } else {
      return {
        bg: 'bg-red-500',
        text: 'text-red-600',
        light: 'bg-red-100'
      };
    }
  };

  // Formatear moneda
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0);
  };

  // Obtener nombre del mes
  const getNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || '';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin text-blue-600" size={32} />
          <span className="ml-3 text-gray-600">Cargando progreso de metas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle size={24} className="mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!datos || !datos.sucursales || datos.sucursales.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Progreso de Metas</h3>
            <p className="text-sm text-gray-500">Sin sucursales configuradas</p>
          </div>
        </div>
      </div>
    );
  }

  const sucursalesConMeta = datos.sucursales.filter(s => s.metaActiva);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Target className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Progreso de Metas del Mes</h3>
            <p className="text-sm text-gray-500">
              {getNombreMes(datos.periodo.mes)} {datos.periodo.año}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={actualizando}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={20} className={actualizando ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Resumen Global */}
      {datos.resumenGlobal && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-blue-600" />
            <span className="font-medium text-gray-700">Resumen Global</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Meta Total</p>
              <p className="font-semibold text-gray-900">{formatMoney(datos.resumenGlobal.totalMetaGlobal)}</p>
            </div>
            <div>
              <p className="text-gray-500">Alcanzado</p>
              <p className="font-semibold text-green-600">{formatMoney(datos.resumenGlobal.totalAlcanzadoGlobal)}</p>
            </div>
            <div>
              <p className="text-gray-500">Sucursales</p>
              <p className="font-semibold text-gray-900">{datos.resumenGlobal.sucursalesConMeta} con meta</p>
            </div>
            <div>
              <p className="text-gray-500">Cumplieron</p>
              <p className="font-semibold text-blue-600">{datos.resumenGlobal.sucursalesQueCumplieron} sucursal(es)</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Sucursales con barras de progreso */}
      <div className="space-y-4">
        {sucursalesConMeta.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No hay sucursales con metas activas este mes
          </p>
        ) : (
          sucursalesConMeta.map((sucursal) => {
            const colors = getColorClasses(sucursal.porcentaje);
            const porcentajeMostrar = Math.min(sucursal.porcentaje, 100); // Para la barra

            return (
              <div key={sucursal.sucursalId} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Header de sucursal */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-gray-400" />
                    <span className="font-medium text-gray-800 capitalize">{sucursal.sucursalNombre}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${colors.text}`}>
                      {sucursal.porcentaje.toFixed(1)}%
                    </span>
                    {sucursal.cumplioMeta && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        ✓ Meta cumplida
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`absolute top-0 left-0 h-full ${colors.bg} rounded-full transition-all duration-500`}
                    style={{ width: `${porcentajeMostrar}%` }}
                  />
                  {/* Indicador de meta al 100% */}
                  <div className="absolute top-0 right-0 h-full w-0.5 bg-gray-300" />
                </div>

                {/* Montos */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Alcanzado: <span className="font-medium text-gray-700">{formatMoney(sucursal.totalAlcanzado)}</span>
                  </span>
                  <span>
                    Meta: <span className="font-medium text-gray-700">{formatMoney(sucursal.metaMensual)}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sucursales sin meta */}
      {datos.sucursales.filter(s => !s.metaActiva).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {datos.sucursales.filter(s => !s.metaActiva).length} sucursal(es) sin meta configurada
          </p>
        </div>
      )}
    </div>
  );
}
