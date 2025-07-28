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
      {/* Filtros - Ultra compacto */}
      <div className="bg-white p-3 rounded-lg shadow overflow-x-auto">
        <h3 className="text-base sm:text-lg font-medium mb-3">Filtrar por período</h3>
        
        {/* Botones de período - Grid 2x2 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => onFiltroChange('semana')}
            className={`px-2 py-1.5 rounded text-xs ${
              filtroFecha === 'semana' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => onFiltroChange('mes')}
            className={`px-2 py-1.5 rounded text-xs ${
              filtroFecha === 'mes' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => onFiltroChange('año')}
            className={`px-2 py-1.5 rounded text-xs ${
              filtroFecha === 'año' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Año
          </button>
          <button
            onClick={() => onFiltroChange('historico')}
            className={`px-2 py-1.5 rounded text-xs ${
              filtroFecha === 'historico' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Rango personalizado - Optimizado en una sola fila */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Inicio</label>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => onCustomDateRangeChange('start', e.target.value)}
              className="w-full p-1.5 border border-gray-300 rounded text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fin</label>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => onCustomDateRangeChange('end', e.target.value)}
              className="w-full p-1.5 border border-gray-300 rounded text-xs"
            />
          </div>
          <div className="col-span-2 sm:col-span-2 flex items-end">
            <button
              onClick={() => onFiltroChange('personalizado')}
              disabled={!customDateRange.start || !customDateRange.end}
              className="w-full px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              Aplicar Rango
            </button>
          </div>
        </div>
      </div>
      {/* Resumen de totales - Tarjetas */}
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
      {/* Lista de registros - Tabla Única Responsiva */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  {/* Descripción oculta en móvil */}
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Gastos
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Faltantes
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Adelantos
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    <span className="hidden sm:inline">Pago Diario</span>
                    <span className="sm:hidden">Pago</span>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    <span className="hidden sm:inline">Acciones</span>
                    <span className="sm:hidden">⚙️</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrosFiltrados.map((registro) => (
                  <tr key={registro._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {new Date(registro.fechaDeGestion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: window.innerWidth > 640 ? 'numeric' : '2-digit'
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(registro.fechaDeGestion).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {/* Mostrar colaborador solo en móvil (ya que no hay descripción) */}
                      <div className="sm:hidden text-xs text-gray-400 mt-1 truncate">
                        {registro.colaboradorInfo?.nombre || 'N/A'}
                      </div>
                    </td>
                    
                    {/* Descripción - Solo visible en escritorio */}
                    <td className="hidden sm:table-cell px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-xs">
                        <p className="truncate" title={registro.descripcion}>
                          {registro.descripcion}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {registro.colaboradorInfo?.nombre || 'N/A'}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-bold text-red-600">
                        {formatearMoneda(registro.monto)}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-bold text-orange-600">
                        {formatearMoneda(registro.faltante)}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-bold text-blue-600">
                        {formatearMoneda(registro.adelanto)}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-bold text-green-600">
                        {formatearMoneda(registro.pagodiario)}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onEliminar(registro._id)}
                        className="inline-flex items-center px-2 sm:px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <span className="hidden sm:inline">Eliminar</span>
                        <span className="sm:hidden">🗑️</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionPersonalList;
