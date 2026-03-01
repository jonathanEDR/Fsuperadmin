import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Search, X, Pencil, Trash2, Receipt, Coins, Factory, TrendingUp, Building2, FolderOpen } from 'lucide-react';

// Funcion para formatear moneda en Soles
const formatCurrency = (amount) => {
  return `S/. ${Number(amount || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Funcion para formatear fecha
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Funcion para formatear fecha y hora
const formatDateTime = (date) => {
  return new Date(date).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Configuracion de colores por categoria
const CATEGORIA_CONFIG = {
  'Finanzas': { color: 'blue', icon: Coins },
  'Producción': { color: 'green', icon: Factory },
  'Ventas': { color: 'amber', icon: TrendingUp },
  'Administración': { color: 'purple', icon: Building2 }
};

// Configuracion de colores por tipo de gasto
const TIPO_GASTO_CONFIG = {
  'Pago Personal': { color: 'violet', bg: 'bg-violet-100', text: 'text-violet-700' },
  'Materia Prima': { color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Otros': { color: 'slate', bg: 'bg-slate-100', text: 'text-slate-700' }
};

export default function GastoCategoriaView({
  categoria,
  gastos,
  onVolver,
  onAgregarGasto,
  onEditarGasto,
  onEliminarGasto
}) {
  // Estados para filtros
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

  const config = CATEGORIA_CONFIG[categoria] || { color: 'gray', icon: FolderOpen };
  const ConfigIcon = config.icon;

  // Filtrar gastos por categoria
  const gastosCategoria = useMemo(() => {
    return gastos.filter(g => g.gasto === categoria);
  }, [gastos, categoria]);

  // Aplicar filtros
  const gastosFiltrados = useMemo(() => {
    let filtered = [...gastosCategoria];

    // Filtro por rango de fechas
    if (customDateRange.start && customDateRange.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(g => {
        const fecha = new Date(g.fechaGasto);
        return fecha >= start && fecha <= end;
      });
    } else if (customDateRange.start) {
      // Solo fecha inicial
      const start = new Date(customDateRange.start);
      filtered = filtered.filter(g => new Date(g.fechaGasto) >= start);
    } else if (customDateRange.end) {
      // Solo fecha final
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(g => new Date(g.fechaGasto) <= end);
    }

    // Filtro por tipo de gasto
    if (tipoFilter) {
      filtered = filtered.filter(g => g.tipoDeGasto === tipoFilter);
    }

    // Filtro por busqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.descripcion?.toLowerCase().includes(term) ||
        g.tipoDeGasto?.toLowerCase().includes(term)
      );
    }

    // Ordenar por fecha descendente
    return filtered.sort((a, b) => new Date(b.fechaGasto) - new Date(a.fechaGasto));
  }, [gastosCategoria, customDateRange, tipoFilter, searchTerm]);

  // Calcular totales
  const totalFiltrado = gastosFiltrados.reduce((sum, g) => sum + (g.montoTotal || 0), 0);
  const totalCategoria = gastosCategoria.reduce((sum, g) => sum + (g.montoTotal || 0), 0);

  // Obtener tipos de gasto unicos
  const tiposUnicos = [...new Set(gastosCategoria.map(g => g.tipoDeGasto))];

  // Limpiar filtros
  const limpiarFiltros = () => {
    setCustomDateRange({ start: '', end: '' });
    setSearchTerm('');
    setTipoFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onVolver}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-${config.color}-100 flex items-center justify-center`}>
              <ConfigIcon size={20} className={`text-${config.color}-600`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gastos de {categoria}</h1>
              <p className="text-gray-500 text-sm">{gastosCategoria.length} gastos registrados</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => onAgregarGasto(categoria)}
          className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Agregar Gasto
        </button>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Categoria</p>
          <p className={`text-2xl font-bold text-${config.color}-600`}>{formatCurrency(totalCategoria)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Filtrado</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalFiltrado)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Registros</p>
          <p className="text-2xl font-bold text-gray-800">{gastosFiltrados.length} / {gastosCategoria.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Filtro por rango de fechas */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Filtrar por fecha:</span>
            <input
              type="date"
              value={customDateRange.start}
              onChange={e => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={e => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">Todos los tipos</option>
            {tiposUnicos.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          {/* Busqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar gasto..."
              className="w-full pl-10 pr-4 py-1.5 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          {/* Limpiar filtros */}
          {(customDateRange.start || customDateRange.end || tipoFilter || searchTerm) && (
            <button
              onClick={limpiarFiltros}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <X size={14} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de gastos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {gastosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No hay gastos registrados</p>
            <p className="text-gray-400 text-sm mb-4">
              {gastosCategoria.length > 0 ? 'Intenta ajustar los filtros' : 'Comienza agregando tu primer gasto'}
            </p>
            <button
              onClick={() => onAgregarGasto(categoria)}
              className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-sm"
            >
              <Plus size={14} className="mr-2 inline" />
              Agregar Gasto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripcion</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">P. Unit.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gastosFiltrados.map(gasto => {
                  const tipoConfig = TIPO_GASTO_CONFIG[gasto.tipoDeGasto] || TIPO_GASTO_CONFIG['Otros'];

                  return (
                    <tr key={gasto._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-800">{formatDate(gasto.fechaGasto)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{gasto.descripcion}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${tipoConfig.bg} ${tipoConfig.text}`}>
                          {gasto.tipoDeGasto}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-800">{gasto.cantidad} {gasto.unidadMedida || 'und'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-600">{formatCurrency(gasto.costoUnidad)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-gray-800">{formatCurrency(gasto.montoTotal)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => onEditarGasto(gasto)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onEliminarGasto(gasto._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    Total ({gastosFiltrados.length} registros):
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-lg font-bold text-${config.color}-600`}>{formatCurrency(totalFiltrado)}</span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
