import React from 'react';

// Configuracion de categorias
const CATEGORIAS = [
  {
    id: 'Finanzas',
    nombre: 'Finanzas',
    descripcion: 'Gastos financieros, intereses, comisiones',
    icon: 'fa-coins',
    color: 'blue',
    bgGradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'Producción',
    nombre: 'Producción',
    descripcion: 'Materia prima, insumos, maquinaria',
    icon: 'fa-industry',
    color: 'green',
    bgGradient: 'from-green-500 to-green-600'
  },
  {
    id: 'Ventas',
    nombre: 'Ventas',
    descripcion: 'Marketing, publicidad, comisiones',
    icon: 'fa-chart-line',
    color: 'amber',
    bgGradient: 'from-amber-500 to-amber-600'
  },
  {
    id: 'Administración',
    nombre: 'Administración',
    descripcion: 'Servicios, alquiler, sueldos admin',
    icon: 'fa-building',
    color: 'purple',
    bgGradient: 'from-purple-500 to-purple-600'
  }
];

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
    month: 'short',
    year: 'numeric'
  });
};

export default function GastoDashboard({
  gastos,
  onSelectCategoria,
  onAgregarGasto,
  onAdministrarCatalogo
}) {
  // Calcular totales por categoria
  const getTotalByCategoria = (categoria) => {
    return gastos
      .filter(g => g.gasto === categoria)
      .reduce((sum, g) => sum + (g.montoTotal || 0), 0);
  };

  // Calcular total general
  const totalGeneral = gastos.reduce((sum, g) => sum + (g.montoTotal || 0), 0);

  // Obtener gastos del mes actual
  const gastosDelMes = gastos.filter(g => {
    const fechaGasto = new Date(g.fechaGasto);
    const ahora = new Date();
    return fechaGasto.getMonth() === ahora.getMonth() &&
           fechaGasto.getFullYear() === ahora.getFullYear();
  });

  const totalMesActual = gastosDelMes.reduce((sum, g) => sum + (g.montoTotal || 0), 0);

  // Obtener ultimos 5 gastos
  const ultimosGastos = [...gastos]
    .sort((a, b) => new Date(b.fechaGasto) - new Date(a.fechaGasto))
    .slice(0, 5);

  // Obtener color de categoria
  const getCategoriaColor = (categoriaId) => {
    const cat = CATEGORIAS.find(c => c.id === categoriaId);
    return cat?.color || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Control de Gastos</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen general y accesos rapidos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAgregarGasto}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
          >
            <i className="fas fa-plus"></i>
            Agregar Gasto
          </button>
          <button
            onClick={onAdministrarCatalogo}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-book"></i>
            Catalogo
          </button>
        </div>
      </div>

      {/* Cards de resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total General */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total General</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalGeneral)}</p>
              <p className="text-indigo-200 text-xs mt-2">{gastos.length} gastos registrados</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-wallet text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Gastos del Mes */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Este Mes</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalMesActual)}</p>
              <p className="text-emerald-200 text-xs mt-2">{gastosDelMes.length} gastos este mes</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-calendar-alt text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Promedio por Gasto */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Promedio por Gasto</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(gastos.length > 0 ? totalGeneral / gastos.length : 0)}
              </p>
              <p className="text-orange-200 text-xs mt-2">Por transaccion</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-calculator text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos rapidos por categoria */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Categoria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIAS.map(categoria => {
            const total = getTotalByCategoria(categoria.id);
            const cantidadGastos = gastos.filter(g => g.gasto === categoria.id).length;

            return (
              <div
                key={categoria.id}
                onClick={() => onSelectCategoria(categoria.id)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-${categoria.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <i className={`fas ${categoria.icon} text-xl text-${categoria.color}-600`}></i>
                  </div>
                  <i className="fas fa-arrow-right text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all"></i>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{categoria.nombre}</h3>
                <p className="text-xs text-gray-500 mb-3">{categoria.descripcion}</p>
                <div className="pt-3 border-t border-gray-100">
                  <p className={`text-xl font-bold text-${categoria.color}-600`}>{formatCurrency(total)}</p>
                  <p className="text-xs text-gray-500">{cantidadGastos} gasto(s)</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ultimos gastos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Ultimos Gastos</h2>
          <span className="text-sm text-gray-500">Recientes</span>
        </div>

        {ultimosGastos.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-receipt text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">No hay gastos registrados</p>
            <button
              onClick={onAgregarGasto}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Registrar primer gasto
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ultimosGastos.map(gasto => (
              <div key={gasto._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-${getCategoriaColor(gasto.gasto)}-100 flex items-center justify-center`}>
                      <i className={`fas ${CATEGORIAS.find(c => c.id === gasto.gasto)?.icon || 'fa-receipt'} text-${getCategoriaColor(gasto.gasto)}-600`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{gasto.descripcion}</p>
                      <p className="text-xs text-gray-500">
                        {gasto.gasto} • {gasto.tipoDeGasto} • {formatDate(gasto.fechaGasto)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{formatCurrency(gasto.montoTotal)}</p>
                    <p className="text-xs text-gray-500">
                      {gasto.cantidad} {gasto.unidadMedida || 'und'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
