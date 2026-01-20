/**
 * Componente de Calendario para Selección de Días a Pagar
 * Permite seleccionar múltiples días pendientes de pago de un colaborador
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, CheckSquare, Square, Info } from 'lucide-react';

const CalendarioSeleccionDias = React.memo(({ 
  colaborador,
  registrosPendientes = [],
  onSeleccionChange,
  loading = false
}) => {
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());
  const [diasSeleccionados, setDiasSeleccionados] = useState(new Set());
  const [hoveredDia, setHoveredDia] = useState(null);

  // Función auxiliar para obtener partes de fecha en zona horaria de Perú
  const obtenerPartesFechaPeru = useCallback((fechaISO) => {
    const date = new Date(fechaISO);
    const fechaStr = date.toLocaleDateString('es-PE', { 
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }); // DD/MM/YYYY
    const [dia, mes, año] = fechaStr.split('/').map(Number);
    return { dia, mes, año };
  }, []);

  // Agrupar registros por día del mes actual - Con zona horaria de Perú
  const registrosPorDia = useMemo(() => {
    const agrupados = {};
    
    registrosPendientes.forEach(registro => {
      const partes = obtenerPartesFechaPeru(registro.fechaDeGestion);
      // Nota: mesActual es 0-indexed, partes.mes es 1-indexed
      if (partes.mes === mesActual + 1 && partes.año === añoActual) {
        const dia = partes.dia;
        if (!agrupados[dia]) {
          agrupados[dia] = [];
        }
        agrupados[dia].push(registro);
      }
    });
    
    return agrupados;
  }, [registrosPendientes, mesActual, añoActual, obtenerPartesFechaPeru]);

  // Calcular monto total del día usando sistema de registros independientes
  const calcularMontoDia = useCallback((registros) => {
    return registros.reduce((total, registro) => {
      const tipo = registro.tipo || 'pago_diario';
      let montoRegistro = 0;

      if (tipo === 'pago_diario') {
        // ✅ CORREGIDO: Solo usar pagodiario del registro, NO calcular desde sueldo
        // El pagodiario ya viene calculado correctamente al crear el registro
        const pagoDiarioReal = registro.pagodiario || 0;
        
        // ✅ FÓRMULA: Pago + Bonificación - Adelanto
        // Faltantes y gastos vienen en registros separados
        montoRegistro = pagoDiarioReal + (registro.bonificacion || 0) - (registro.adelanto || 0);
      } else if (tipo === 'adelanto_manual') {
        // ✅ Adelantos independientes se restan
        montoRegistro = -(registro.adelanto || 0);
      } else if (tipo === 'bonificacion_manual' || tipo === 'bonificacion_meta') {
        // ✅ Bonificaciones independientes se suman
        // Incluye bonificaciones manuales y automáticas por metas
        montoRegistro = registro.bonificacion || 0;
      } else if (tipo === 'ajuste_manual') {
        // ✅ Ajustes con bonificación y adelanto combinados
        montoRegistro = (registro.bonificacion || 0) - (registro.adelanto || 0);
      } else if (tipo === 'faltante_cobro' || tipo === 'faltante_manual' || tipo === 'descuento_tardanza') {
        // ✅ Faltantes (automáticos, manuales y por tardanza) se restan
        montoRegistro = -(registro.faltante || 0);
      } else if (tipo === 'gasto_cobro') {
        // ⚠️ GASTOS NO se restan (son solo referenciales)
        montoRegistro = 0;
      }
      
      return total + montoRegistro;
    }, 0);
  }, [colaborador]);

  // Funciones de navegación
  const navegarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (mesActual === 0) {
        setMesActual(11);
        setAñoActual(añoActual - 1);
      } else {
        setMesActual(mesActual - 1);
      }
    } else {
      if (mesActual === 11) {
        setMesActual(0);
        setAñoActual(añoActual + 1);
      } else {
        setMesActual(mesActual + 1);
      }
    }
    // Limpiar selección al cambiar de mes
    setDiasSeleccionados(new Set());
    notificarCambio(new Set());
  };

  const irAHoy = () => {
    const hoy = new Date();
    setMesActual(hoy.getMonth());
    setAñoActual(hoy.getFullYear());
  };

  // Manejar selección de día
  const toggleDia = (dia) => {
    const registrosDia = registrosPorDia[dia];
    if (!registrosDia || registrosDia.length === 0) return;

    const nuevaSeleccion = new Set(diasSeleccionados);

    if (nuevaSeleccion.has(dia)) {
      // Deseleccionar día
      nuevaSeleccion.delete(dia);
    } else {
      // Seleccionar día
      nuevaSeleccion.add(dia);
    }

    setDiasSeleccionados(nuevaSeleccion);
    notificarCambio(nuevaSeleccion);
  };

  // Seleccionar/Deseleccionar todos los días del mes
  const toggleTodos = () => {
    const diasConRegistros = Object.keys(registrosPorDia).map(Number);
    
    if (diasSeleccionados.size > 0) {
      // Deseleccionar todos
      setDiasSeleccionados(new Set());
      notificarCambio(new Set());
    } else {
      // Seleccionar todos los días
      const nuevaSeleccion = new Set(diasConRegistros);
      setDiasSeleccionados(nuevaSeleccion);
      notificarCambio(nuevaSeleccion);
    }
  };

  // Notificar cambios al componente padre
  const notificarCambio = (seleccion) => {
    if (!onSeleccionChange) return;

    // Extraer solo los días numéricos del Set
    const diasNumericos = Array.from(seleccion).filter(item => typeof item === 'number');
    
    // ✅ Pasar TODOS los registros de los días seleccionados
    // (ResumenSeleccion necesita todos para calcular correctamente)
    const registrosSeleccionados = [];
    diasNumericos.forEach(dia => {
      if (registrosPorDia[dia]) {
        registrosSeleccionados.push(...registrosPorDia[dia]);
      }
    });

    onSeleccionChange(registrosSeleccionados);
  };

  // Utilidades de calendario
  const obtenerNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
  };

  const obtenerDiasDelMes = (mes, año) => {
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    const primerDia = new Date(año, mes, 1).getDay();
    
    return {
      dias: Array.from({ length: diasEnMes }, (_, i) => i + 1),
      primerDia: primerDia
    };
  };

  const { dias, primerDia } = obtenerDiasDelMes(mesActual, añoActual);
  const diasConRegistros = Object.keys(registrosPorDia).length;
  const diasSeleccionadosCount = Array.from(diasSeleccionados).filter(item => typeof item === 'number').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando registros...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            <h4 className="text-base font-bold text-gray-800">
              Selecciona los días a pagar
            </h4>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navegarMes('anterior')}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              ← Anterior
            </button>
            
            <div className="text-center px-4">
              <div className="text-sm font-bold text-gray-800">
                {obtenerNombreMes(mesActual)} {añoActual}
              </div>
              <button
                onClick={irAHoy}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Hoy
              </button>
            </div>
            
            <button
              onClick={() => navegarMes('siguiente')}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Siguiente →
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{diasConRegistros}</span> días con registros pendientes
          </div>
          
          <button
            onClick={toggleTodos}
            disabled={diasConRegistros === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {diasSeleccionados.size > 0 ? (
              <>
                <CheckSquare size={16} />
                Deseleccionar Todos
              </>
            ) : (
              <>
                <Square size={16} />
                Seleccionar Todos
              </>
            )}
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
            <div
              key={dia}
              className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7">
          {/* Espacios vacíos antes del primer día */}
          {Array.from({ length: primerDia }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square border-b border-r border-gray-100" />
          ))}

          {/* Días del mes */}
          {dias.map(dia => {
            const tieneRegistros = registrosPorDia[dia];
            const estaSeleccionado = diasSeleccionados.has(dia);
            const montoDia = tieneRegistros ? calcularMontoDia(tieneRegistros) : 0;
            const esHoy = dia === new Date().getDate() && 
                          mesActual === new Date().getMonth() && 
                          añoActual === new Date().getFullYear();

            return (
              <div
                key={dia}
                className={`
                  relative aspect-square border-b border-r border-gray-100 p-2 transition-all
                  ${tieneRegistros ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-50 cursor-not-allowed'}
                  ${estaSeleccionado ? 'bg-blue-100 border-blue-400 shadow-inner' : ''}
                  ${esHoy ? 'ring-2 ring-indigo-500' : ''}
                `}
                onClick={() => tieneRegistros && toggleDia(dia)}
                onMouseEnter={() => setHoveredDia(dia)}
                onMouseLeave={() => setHoveredDia(null)}
              >
                {/* Número del día */}
                <div className="flex items-start justify-between">
                  <span className={`
                    text-sm font-semibold
                    ${tieneRegistros ? 'text-gray-900' : 'text-gray-400'}
                    ${estaSeleccionado ? 'text-blue-700' : ''}
                    ${esHoy ? 'text-indigo-600' : ''}
                  `}>
                    {dia}
                  </span>
                  
                  {tieneRegistros && (
                    <div className="flex items-center gap-1">
                      {estaSeleccionado ? (
                        <CheckSquare size={16} className="text-blue-600" />
                      ) : (
                        <Square size={16} className="text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Monto del día */}
                {tieneRegistros && (
                  <div className="mt-1">
                    <div className={`
                      text-xs font-bold
                      ${estaSeleccionado ? 'text-green-700' : 'text-green-600'}
                    `}>
                      S/ {montoDia.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {tieneRegistros.length} registro{tieneRegistros.length > 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {/* Tooltip en hover */}
                {hoveredDia === dia && tieneRegistros && (
                  <div className="absolute z-10 top-full left-0 mt-1 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
                    <div className="font-bold mb-2 border-b border-gray-700 pb-1">
                      Día {dia} - {obtenerNombreMes(mesActual)} {añoActual}
                    </div>
                    {tieneRegistros.map((registro, idx) => {
                      // Calcular pago diario real
                      let pagoDiarioReal = registro.pagodiario || 0;
                      if (pagoDiarioReal === 0 && colaborador?.sueldo) {
                        pagoDiarioReal = colaborador.sueldo / 30;
                      }
                      
                      return (
                        <div key={idx} className="space-y-1 mb-2">
                          <div className="flex justify-between">
                            <span>Pago Diario:</span>
                            <span className="font-semibold text-green-400">
                              S/ {pagoDiarioReal.toFixed(2)}
                            </span>
                          </div>
                          {registro.adelanto > 0 && (
                            <div className="flex justify-between">
                              <span>Adelantos:</span>
                              <span className="font-semibold text-red-400">
                                -S/ {registro.adelanto.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {registro.faltante > 0 && (
                            <div className="flex justify-between">
                              <span>Faltantes:</span>
                              <span className="font-semibold text-red-400">
                                -S/ {registro.faltante.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-700 pt-1 mt-1">
                      <div className="flex justify-between font-bold">
                        <span>Total Día:</span>
                        <span className="text-yellow-400">
                          S/ {montoDia.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen de selección */}
      {diasSeleccionadosCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Info size={18} />
            <span className="font-semibold">
              {diasSeleccionadosCount} día{diasSeleccionadosCount > 1 ? 's' : ''} seleccionado{diasSeleccionadosCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 border border-blue-400 rounded"></div>
          <span>Día seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white border border-gray-200 rounded"></div>
          <span>Día con registros</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-50 border border-gray-200 rounded"></div>
          <span>Sin registros</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 ring-2 ring-indigo-500 rounded"></div>
          <span>Hoy</span>
        </div>
      </div>
    </div>
  );
});

CalendarioSeleccionDias.displayName = 'CalendarioSeleccionDias';

export default CalendarioSeleccionDias;
