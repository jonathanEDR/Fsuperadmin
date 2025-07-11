import React from 'react';

const GestionPersonalList = ({ 
  registros, 
  todosLosRegistros, // Todos los registros para cálculos de resumen
  onEliminar, 
  loading,
  filtroFecha,
  onFiltroChange,
  customDateRange,
  onCustomDateRangeChange 
}) => {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatearMoneda = (cantidad) => {
    if (cantidad === null || cantidad === undefined) return 'S/0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(cantidad);
  };
  const filtrarRegistrosPorFecha = (registros) => {
    console.log('Filtrando registros:', { filtroFecha, totalRegistros: registros.length }); // Debug
    
    if (filtroFecha === 'historico') return registros;
    
    const hoy = new Date();
    let inicio, fin;

    switch (filtroFecha) {
      case 'semana':
        const diaSemana = hoy.getDay();
        const diferenciaDias = diaSemana === 0 ? 6 : diaSemana - 1;
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - diferenciaDias);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
        fin.setHours(23, 59, 59, 999);
        break;

      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);
        break;

      case 'año':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy.getFullYear(), 11, 31);
        fin.setHours(23, 59, 59, 999);
        break;

      case 'personalizado':
        if (customDateRange.start && customDateRange.end) {
          inicio = new Date(customDateRange.start);
          fin = new Date(customDateRange.end);
          fin.setHours(23, 59, 59, 999);
        } else {
          return registros;
        }
        break;

      default:
        return registros;
    }

    console.log('Rango de fechas:', { inicio, fin }); // Debug
    
    const registrosFiltrados = registros.filter(registro => {
      const fechaRegistro = new Date(registro.fechaDeGestion);
      const estaEnRango = fechaRegistro >= inicio && fechaRegistro <= fin;
      console.log('Registro:', { 
        fecha: fechaRegistro, 
        estaEnRango, 
        descripcion: registro.descripcion 
      }); // Debug
      return estaEnRango;
    });
    
    console.log('Registros después del filtro:', registrosFiltrados.length); // Debug
    return registrosFiltrados;
  };
  const registrosFiltrados = filtrarRegistrosPorFecha(registros);

  // Calcular totales usando TODOS los registros (para resumen correcto)
  const calcularTotalesCompletos = () => {
    if (!todosLosRegistros || todosLosRegistros.length === 0) {
      return { monto: 0, faltante: 0, adelanto: 0, pagodiario: 0 };
    }
    
    return todosLosRegistros.reduce((totales, registro) => ({
      monto: totales.monto + (registro.monto || 0),
      faltante: totales.faltante + (registro.faltante || 0),
      adelanto: totales.adelanto + (registro.adelanto || 0),
      pagodiario: totales.pagodiario + (registro.pagodiario || 0)
    }), { monto: 0, faltante: 0, adelanto: 0, pagodiario: 0 });
  };

  // Calcular totales del período filtrado (para información adicional si se desea)
  const calcularTotalesFiltrados = () => {
    return registrosFiltrados.reduce((totales, registro) => ({
      monto: totales.monto + (registro.monto || 0),
      faltante: totales.faltante + (registro.faltante || 0),
      adelanto: totales.adelanto + (registro.adelanto || 0),
      pagodiario: totales.pagodiario + (registro.pagodiario || 0)
    }), { monto: 0, faltante: 0, adelanto: 0, pagodiario: 0 });
  };

  const totalesCompletos = calcularTotalesCompletos();
  const totalesFiltrados = calcularTotalesFiltrados();

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-base sm:text-lg font-medium mb-3">Filtrar por período</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
          <button
            onClick={() => onFiltroChange('semana')}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm ${
              filtroFecha === 'semana' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => onFiltroChange('mes')}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm ${
              filtroFecha === 'mes' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => onFiltroChange('año')}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm ${
              filtroFecha === 'año' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Este Año
          </button>
          <button
            onClick={() => onFiltroChange('historico')}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm ${
              filtroFecha === 'historico' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Rango personalizado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => onCustomDateRangeChange('start', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => onCustomDateRangeChange('end', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => onFiltroChange('personalizado')}
              disabled={!customDateRange.start || !customDateRange.end}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              Aplicar Rango
            </button>
          </div>
        </div>
      </div>
      {/* Resumen de totales */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-base sm:text-lg font-medium mb-3">Resumen Total del Colaborador</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Gastos</p>
            <p className="text-base sm:text-lg font-bold text-red-600">{formatearMoneda(totalesCompletos.monto)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Faltantes</p>
            <p className="text-base sm:text-lg font-bold text-orange-600">{formatearMoneda(totalesCompletos.faltante)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Adelantos</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">{formatearMoneda(totalesCompletos.adelanto)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Pagos Diarios</p>
            <p className="text-base sm:text-lg font-bold text-green-600">{formatearMoneda(totalesCompletos.pagodiario)}</p>
          </div>
        </div>
        {/* Mostrar totales del período si hay filtros activos */}
        {filtroFecha !== 'historico' && registrosFiltrados.length !== todosLosRegistros?.length && (
          <>
            <hr className="my-4" />
            <h4 className="text-xs sm:text-md font-medium mb-2">Totales del Período Seleccionado</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-500">Gastos del Período</p>
                <p className="font-semibold text-red-500">{formatearMoneda(totalesFiltrados.monto)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Faltantes del Período</p>
                <p className="font-semibold text-orange-500">{formatearMoneda(totalesFiltrados.faltante)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Adelantos del Período</p>
                <p className="font-semibold text-blue-500">{formatearMoneda(totalesFiltrados.adelanto)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Pagos del Período</p>
                <p className="font-semibold text-green-500">{formatearMoneda(totalesFiltrados.pagodiario)}</p>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Lista de registros */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="px-3 sm:px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-base sm:text-lg font-medium">
            Registros ({registrosFiltrados.length})
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando registros...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay registros para mostrar
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {registrosFiltrados.map((registro) => (
              <div key={registro._id} className="p-3 sm:p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {registro.colaboradorUserId?.nombre_negocio || 'Colaborador'}
                      </h4>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {formatearFecha(registro.fechaDeGestion)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3 text-xs sm:text-sm break-words">{registro.descripcion}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Monto:</span>
                        <span className="block text-red-600 font-bold">
                          {formatearMoneda(registro.monto)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Faltante:</span>
                        <span className="block text-orange-600 font-bold">
                          {formatearMoneda(registro.faltante)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Adelanto:</span>
                        <span className="block text-blue-600 font-bold">
                          {formatearMoneda(registro.adelanto)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Pago Diario:</span>
                        <span className="block text-green-600 font-bold">
                          {formatearMoneda(registro.pagodiario)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">Colaborador:</span> {registro.colaboradorInfo?.nombre || 'N/A'}
                    </div>
                  </div>
                  <button
                    onClick={() => onEliminar(registro._id)}
                    className="ml-0 sm:ml-4 px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50 text-xs sm:text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionPersonalList;
