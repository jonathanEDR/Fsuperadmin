/**
 * Componente de Resumen de Selección de Días
 * Muestra el desglose detallado del cálculo de pago
 */

import React, { useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const ResumenSeleccion = React.memo(({ 
  registrosSeleccionados = [],
  formatearMoneda,
  colaboradorSeleccionado = null
}) => {
  
  // Calcular totales
  const { subtotal, totalBonificaciones, totalAdelantos, totalFaltantes, totalGastos, montoTotal, rangoFechas, diasCount } = useMemo(() => {
    if (registrosSeleccionados.length === 0) {
      return {
        subtotal: 0,
        totalBonificaciones: 0,
        totalAdelantos: 0,
        totalFaltantes: 0,
        totalGastos: 0,
        montoTotal: 0,
        rangoFechas: null,
        diasCount: 0
      };
    }

    let sumaPagos = 0;
    let sumaBonificaciones = 0;
    let sumaAdelantos = 0;
    let sumaFaltantes = 0;
    let sumaGastos = 0; // Solo referencial

    // Ordenar por fecha para obtener rango
    const registrosOrdenados = [...registrosSeleccionados].sort((a, b) => 
      new Date(a.fechaDeGestion) - new Date(b.fechaDeGestion)
    );

    // Agrupar por fecha para contar días únicos - Con zona horaria de Perú
    const registrosPorFecha = {};
    
    registrosOrdenados.forEach(registro => {
      // Usar zona horaria de Perú para obtener la fecha correcta
      const fechaKey = new Date(registro.fechaDeGestion).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      if (!registrosPorFecha[fechaKey]) {
        registrosPorFecha[fechaKey] = [];
      }
      registrosPorFecha[fechaKey].push(registro);
    });

    // Calcular totales por tipo
    registrosOrdenados.forEach(registro => {
      const tipo = registro.tipo || 'pago_diario';
      
      if (tipo === 'pago_diario') {
        // Si pagodiario es 0, calcular desde el sueldo del colaborador
        let pagoDiarioReal = registro.pagodiario || 0;
        if (pagoDiarioReal === 0 && colaboradorSeleccionado?.sueldo) {
          pagoDiarioReal = colaboradorSeleccionado.sueldo / 30;
        }
        
        sumaPagos += pagoDiarioReal;
        sumaBonificaciones += registro.bonificacion || 0;
        sumaAdelantos += registro.adelanto || 0;
      } else if (tipo === 'adelanto_manual') {
        // ✅ NUEVO: Manejar adelantos creados como registros independientes
        sumaAdelantos += registro.adelanto || 0;
        // También puede tener bonificación si se agregó junto con el adelanto
        sumaBonificaciones += registro.bonificacion || 0;
      } else if (tipo === 'bonificacion_manual') {
        // ✅ NUEVO: Manejar bonificaciones creadas como registros independientes
        sumaBonificaciones += registro.bonificacion || 0;
      } else if (tipo === 'faltante_cobro') {
        sumaFaltantes += registro.faltante || 0;
      } else if (tipo === 'gasto_cobro') {
        sumaGastos += registro.gasto || 0; // ✅ CORREGIDO: usar registro.gasto
      }
    });

    const fechaInicio = new Date(registrosOrdenados[0].fechaDeGestion);
    const fechaFin = new Date(registrosOrdenados[registrosOrdenados.length - 1].fechaDeGestion);

    // ✅ CORREGIDO: Subtotal es SOLO pagos diarios (sin bonificaciones)
    // Total = Pagos + Bonificaciones - Faltantes - Adelantos
    // Gastos NO se restan (solo referenciales)
    const subtotalCalc = sumaPagos; // Solo pagos diarios puros
    const montoTotalCalc = sumaPagos + sumaBonificaciones - sumaFaltantes - sumaAdelantos;

    return {
      subtotal: subtotalCalc,
      totalBonificaciones: sumaBonificaciones,
      totalAdelantos: sumaAdelantos,
      totalFaltantes: sumaFaltantes,
      totalGastos: sumaGastos, // Solo informativo
      montoTotal: montoTotalCalc,
      rangoFechas: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      diasCount: Object.keys(registrosPorFecha).length // ✅ Contar fechas únicas
    };
  }, [registrosSeleccionados, colaboradorSeleccionado]);

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearMonto = (monto) => {
    return formatearMoneda ? formatearMoneda(monto) : `S/ ${monto.toFixed(2)}`;
  };

  if (registrosSeleccionados.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Calculator size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="font-medium">Selecciona días en el calendario</p>
          <p className="text-sm mt-1">El monto se calculará automáticamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
        <Calculator size={20} className="text-blue-600" />
        <h4 className="text-lg font-bold text-gray-800">Resumen de Pago</h4>
      </div>

      {/* Info General */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <p className="text-xs text-gray-600 mb-1">Días seleccionados</p>
          <p className="text-2xl font-bold text-blue-600">{diasCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {diasCount === 1 ? 'día' : 'días'}
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <p className="text-xs text-gray-600 mb-1">Período</p>
          {rangoFechas && (
            <>
              <p className="text-sm font-semibold text-gray-800">
                {formatearFecha(rangoFechas.inicio)}
              </p>
              {rangoFechas.inicio.getTime() !== rangoFechas.fin.getTime() && (
                <>
                  <p className="text-xs text-gray-400 text-center">hasta</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatearFecha(rangoFechas.fin)}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Desglose de Montos */}
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Subtotal Pagos Diarios</p>
              <p className="text-xs text-gray-500">{diasCount} día{diasCount > 1 ? 's' : ''} × pago diario</p>
            </div>
          </div>
          <p className="text-lg font-bold text-green-700">
            {formatearMonto(subtotal)}
          </p>
        </div>

        {/* Bonificaciones */}
        {totalBonificaciones > 0 && (
          <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp size={16} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">(+) Bonificaciones</p>
                <p className="text-xs text-gray-500">Bonos adicionales</p>
              </div>
            </div>
            <p className="text-lg font-bold text-yellow-600">
              +{formatearMonto(totalBonificaciones)}
            </p>
          </div>
        )}

        {/* Adelantos */}
        {totalAdelantos > 0 && (
          <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingDown size={16} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">(-) Adelantos</p>
                <p className="text-xs text-gray-500">Dinero adelantado previamente</p>
              </div>
            </div>
            <p className="text-lg font-bold text-orange-600">
              -{formatearMonto(totalAdelantos)}
            </p>
          </div>
        )}

        {/* Faltantes */}
        {totalFaltantes > 0 && (
          <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown size={16} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">(-) Faltantes</p>
                <p className="text-xs text-gray-500">Faltantes en cobros</p>
              </div>
            </div>
            <p className="text-lg font-bold text-red-600">
              -{formatearMonto(totalFaltantes)}
            </p>
          </div>
        )}

        {/* Gastos (Solo Referencia) */}
        {totalGastos > 0 && (
          <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200 opacity-60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <TrendingDown size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Gastos (solo referencia)</p>
                <p className="text-xs text-gray-500">ℹ️ No se descuenta del pago</p>
              </div>
            </div>
            <p className="text-lg font-medium text-gray-500">
              {formatearMonto(totalGastos)}
            </p>
          </div>
        )}

        {/* Total Final */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 shadow-md mt-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <DollarSign size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">TOTAL A PAGAR</p>
                <p className="text-xs opacity-75">Monto neto calculado</p>
              </div>
            </div>
            <p className="text-3xl font-bold">
              {formatearMonto(montoTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mt-4 bg-blue-100 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Nota:</strong> El monto se calcula automáticamente según los días seleccionados.
          Los adelantos y faltantes se descuentan del total.
        </p>
      </div>
    </div>
  );
});

ResumenSeleccion.displayName = 'ResumenSeleccion';

export default ResumenSeleccion;
