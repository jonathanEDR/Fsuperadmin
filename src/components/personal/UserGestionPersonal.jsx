import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, BarChart3, ClipboardList, ChevronLeft, ChevronRight, ChevronDown, CreditCard } from 'lucide-react';
import { gestionPersonalService } from '../../services';
import { getPagosRealizados } from '../../services/api';

function UserGestionPersonal() {
  const { user } = useUser();
  const [registros, setRegistros] = useState([]);
  const [pagosRealizados, setPagosRealizados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrosMostrados, setRegistrosMostrados] = useState(10);
  
  // Estado para el mes seleccionado (por defecto mes actual)
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const ahora = new Date();
    return {
      mes: ahora.getMonth(), // 0-11
      año: ahora.getFullYear()
    };
  });

  // Generar lista de los últimos 12 meses
  const mesesDisponibles = useMemo(() => {
    const meses = [];
    const ahora = new Date();
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      meses.push({
        mes: fecha.getMonth(),
        año: fecha.getFullYear(),
        label: fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
      });
    }
    return meses;
  }, []);

  useEffect(() => {
    if (user) {
      fetchMisRegistros();
      fetchPagosRealizados();
    }
  }, [user]);

  const fetchMisRegistros = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gestionPersonalService.obtenerMisRegistros();
      setRegistros(data);
    } catch (error) {
      console.error('Error al obtener mis registros:', error);
      setError(error.message || 'Error al cargar mis registros');
    } finally {
      setLoading(false);
    }
  };

  const fetchPagosRealizados = async () => {
    try {
      const pagos = await getPagosRealizados();
      setPagosRealizados(pagos || []);
    } catch (error) {
      console.error('Error al obtener pagos realizados:', error);
    }
  };

  const cargarMasRegistros = () => {
    setRegistrosMostrados(prev => prev + 10);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(cantidad);
  };

  const ordenarRegistros = () => {
    return [...registros].sort((a, b) => new Date(b.fechaDeGestion) - new Date(a.fechaDeGestion));
  };

  // Filtrar registros por mes seleccionado
  const filtrarPorMes = (registrosArray) => {
    return registrosArray.filter(registro => {
      const fecha = new Date(registro.fechaDeGestion);
      return fecha.getMonth() === mesSeleccionado.mes && 
             fecha.getFullYear() === mesSeleccionado.año;
    });
  };

  // Calcular pagos realizados filtrados por mes
  const calcularPagosRealizadosMes = () => {
    if (!user) return 0;
    return pagosRealizados
      .filter(p => {
        if (p.colaboradorUserId !== user.id) return false;
        const fecha = new Date(p.fecha || p.createdAt);
        return fecha.getMonth() === mesSeleccionado.mes && 
               fecha.getFullYear() === mesSeleccionado.año;
      })
      .reduce((total, p) => total + (p.montoTotal || p.monto || 0), 0);
  };

  const calcularTotales = (registrosFiltrados) => {
    const totales = {
      pagosDiarios: 0,
      bonificaciones: 0,
      faltantes: 0,
      adelantos: 0
    };

    registrosFiltrados.forEach(registro => {
      const tipo = registro.tipo || 'pago_diario';
      
      switch (tipo) {
        case 'pago_diario':
          totales.pagosDiarios += registro.pagodiario || 0;
          totales.bonificaciones += registro.bonificacion || 0;
          totales.adelantos += registro.adelanto || 0;
          break;
        case 'faltante_cobro':
        case 'faltante_manual':
        case 'descuento_tardanza':
          totales.faltantes += registro.faltante || 0;
          break;
        case 'adelanto_manual':
          totales.adelantos += registro.adelanto || 0;
          break;
        case 'bonificacion_manual':
        case 'bonificacion_meta':
          totales.bonificaciones += registro.bonificacion || 0;
          break;
        default:
          totales.pagosDiarios += registro.pagodiario || 0;
          totales.faltantes += registro.faltante || 0;
          totales.adelantos += registro.adelanto || 0;
          break;
      }
    });

    return totales;
  };

  // Obtener información del tipo de registro
  const obtenerInfoTipo = (registro) => {
    const tipo = registro.tipo || 'pago_diario';
    
    const tiposInfo = {
      'pago_diario': {
        icono: '💵',
        titulo: 'Pago Diario',
        color: 'bg-green-50 border-green-200',
        colorTexto: 'text-green-700'
      },
      'faltante_cobro': {
        icono: '⚠️',
        titulo: 'Faltante de Cobro',
        color: 'bg-orange-50 border-orange-200',
        colorTexto: 'text-orange-700'
      },
      'faltante_manual': {
        icono: '⚠️',
        titulo: 'Descuento Manual',
        color: 'bg-orange-50 border-orange-200',
        colorTexto: 'text-orange-700'
      },
      'descuento_tardanza': {
        icono: '⏰',
        titulo: 'Descuento por Tardanza',
        color: 'bg-amber-50 border-amber-200',
        colorTexto: 'text-amber-700'
      },
      'adelanto_manual': {
        icono: '💸',
        titulo: 'Adelanto',
        color: 'bg-blue-50 border-blue-200',
        colorTexto: 'text-blue-700'
      },
      'bonificacion_manual': {
        icono: '🎁',
        titulo: 'Bonificación Manual',
        color: 'bg-purple-50 border-purple-200',
        colorTexto: 'text-purple-700'
      },
      'bonificacion_meta': {
        icono: '🎯',
        titulo: 'Bonificación por Meta',
        color: 'bg-indigo-50 border-indigo-200',
        colorTexto: 'text-indigo-700'
      },
      'gasto_cobro': {
        icono: '📝',
        titulo: 'Gasto',
        color: 'bg-red-50 border-red-200',
        colorTexto: 'text-red-700'
      }
    };

    return tiposInfo[tipo] || {
      icono: '📋',
      titulo: 'Registro',
      color: 'bg-gray-50 border-gray-200',
      colorTexto: 'text-gray-700'
    };
  };

  // Obtener el monto principal del registro según su tipo
  const obtenerMontoPrincipal = (registro) => {
    const tipo = registro.tipo || 'pago_diario';
    
    switch (tipo) {
      case 'pago_diario':
        return { monto: registro.pagodiario || 0, signo: '+', color: 'text-green-600' };
      case 'faltante_cobro':
      case 'faltante_manual':
      case 'descuento_tardanza':
        return { monto: registro.faltante || 0, signo: '-', color: 'text-orange-600' };
      case 'adelanto_manual':
        return { monto: registro.adelanto || 0, signo: '-', color: 'text-blue-600' };
      case 'bonificacion_manual':
      case 'bonificacion_meta':
        return { monto: registro.bonificacion || 0, signo: '+', color: 'text-purple-600' };
      case 'gasto_cobro':
        return { monto: registro.monto || 0, signo: '-', color: 'text-red-600' };
      default:
        return { monto: registro.pagodiario || 0, signo: '+', color: 'text-gray-600' };
    }
  };

  // Navegación de meses
  const cambiarMes = (direccion) => {
    const indiceActual = mesesDisponibles.findIndex(
      m => m.mes === mesSeleccionado.mes && m.año === mesSeleccionado.año
    );
    const nuevoIndice = indiceActual + direccion;
    if (nuevoIndice >= 0 && nuevoIndice < mesesDisponibles.length) {
      setMesSeleccionado(mesesDisponibles[nuevoIndice]);
      setRegistrosMostrados(10); // Reset pagination al cambiar mes
    }
  };

  const registrosOrdenados = ordenarRegistros();
  const registrosFiltrados = filtrarPorMes(registrosOrdenados);
  const registrosPaginados = registrosFiltrados.slice(0, registrosMostrados);
  const totales = calcularTotales(registrosFiltrados);
  const pagosRealizadosTotal = calcularPagosRealizadosMes();
  const totalAPagar = (totales.pagosDiarios + totales.bonificaciones) - (totales.faltantes + totales.adelantos) - pagosRealizadosTotal;
  const hayMasRegistros = registrosFiltrados.length > registrosMostrados;

  // Obtener nombre del mes actual
  const nombreMesActual = new Date(mesSeleccionado.año, mesSeleccionado.mes).toLocaleDateString('es-PE', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Verificar si hay meses anteriores/siguientes disponibles
  const indiceActual = mesesDisponibles.findIndex(
    m => m.mes === mesSeleccionado.mes && m.año === mesSeleccionado.año
  );
  const puedeRetroceder = indiceActual < mesesDisponibles.length - 1;
  const puedeAvanzar = indiceActual > 0;

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mi Historial Personal</h2>
        <p className="text-gray-600">Visualiza tu historial de pagos, descuentos y bonificaciones</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Selector de Mes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => cambiarMes(1)}
            disabled={!puedeRetroceder}
            className={`p-2 rounded-xl transition-colors ${
              puedeRetroceder 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Período</p>
            <h3 className="text-xl font-bold text-gray-800 capitalize">{nombreMesActual}</h3>
          </div>
          
          <button
            onClick={() => cambiarMes(-1)}
            disabled={!puedeAvanzar}
            className={`p-2 rounded-xl transition-colors ${
              puedeAvanzar 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Selector rápido de mes */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {mesesDisponibles.slice(0, 6).map((m, idx) => (
            <button
              key={idx}
              onClick={() => {
                setMesSeleccionado(m);
                setRegistrosMostrados(10);
              }}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                m.mes === mesSeleccionado.mes && m.año === mesSeleccionado.año
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {new Date(m.año, m.mes).toLocaleDateString('es-PE', { month: 'short' }).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen de totales - Diseño mejorado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800"><BarChart3 size={18} className="text-blue-600 inline mr-1" /> Resumen de {nombreMesActual}</h3>
          <span className="text-sm text-gray-500">{registrosFiltrados.length} registros</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Pagos Diarios</p>
              <p className="text-xl font-bold text-green-700 mt-1">{formatearMoneda(totales.pagosDiarios)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200">
              <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Bonificaciones</p>
              <p className="text-xl font-bold text-purple-700 mt-1">{formatearMoneda(totales.bonificaciones)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-200">
              <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Descuentos</p>
              <p className="text-xl font-bold text-orange-700 mt-1">-{formatearMoneda(totales.faltantes)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Adelantos</p>
              <p className="text-xl font-bold text-blue-700 mt-1">-{formatearMoneda(totales.adelantos)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center border ${totalAPagar >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${totalAPagar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Total a Pagar
              </p>
              <p className={`text-xl font-bold mt-1 ${totalAPagar >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatearMoneda(totalAPagar)}
              </p>
            </div>
          </div>
          
          {/* Pagos Realizados Info */}
          {pagosRealizadosTotal > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600"><CreditCard size={14} className="inline mr-1 text-gray-500" /> Pagos ya realizados:</span>
                <span className="font-semibold text-gray-800">{formatearMoneda(pagosRealizadosTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de registros - Diseño mejorado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            <ClipboardList size={18} className="text-gray-600 inline mr-1" /> Registros de {nombreMesActual} ({registrosFiltrados.length})
          </h3>
          {registrosMostrados < registrosFiltrados.length && (
            <span className="text-sm text-gray-500">
              Mostrando {registrosMostrados} de {registrosFiltrados.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={40} className="animate-spin text-blue-600 mx-auto" />
            <p className="mt-3 text-gray-600">Cargando registros...</p>
          </div>
        ) : registrosPaginados.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tienes registros en {nombreMesActual}</p>
            <p className="text-sm text-gray-400 mt-2">Prueba navegando a otro mes</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {registrosPaginados.map((registro) => {
                const infoTipo = obtenerInfoTipo(registro);
                const montoPrincipal = obtenerMontoPrincipal(registro);
                const esAutomatico = registro.origenDatos === 'cobro_automatico' || 
                                     registro.origenDatos === 'automatico_metas' ||
                                     registro.origenDatos === 'asistencia_tardanza' ||
                                     registro.tipo === 'bonificacion_meta' ||
                                     registro.tipo === 'descuento_tardanza';

                return (
                  <div 
                    key={registro._id} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${infoTipo.color} border-l-4`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Info del registro */}
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{infoTipo.icono}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold ${infoTipo.colorTexto}`}>
                              {infoTipo.titulo}
                            </span>
                            {esAutomatico && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                Auto
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 break-words">
                            {registro.descripcion || 'Sin descripción'}
                          </p>
                          {registro.descripcionBonificacion && (
                            <p className="text-xs text-gray-500 italic mt-1">
                              {registro.descripcionBonificacion}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Monto y fecha */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                        <span className={`text-lg font-bold ${montoPrincipal.color}`}>
                          {montoPrincipal.signo} {formatearMoneda(montoPrincipal.monto)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatearFecha(registro.fechaDeGestion)}
                        </span>
                      </div>
                    </div>

                    {/* Detalles adicionales si es pago_diario con bonificación o adelanto */}
                    {registro.tipo === 'pago_diario' && (registro.bonificacion > 0 || registro.adelanto > 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                        {registro.bonificacion > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">🎁 Bonificación:</span>
                            <span className="font-semibold text-purple-600">+{formatearMoneda(registro.bonificacion)}</span>
                          </div>
                        )}
                        {registro.adelanto > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">💸 Adelanto:</span>
                            <span className="font-semibold text-blue-600">-{formatearMoneda(registro.adelanto)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botón Ver más */}
            {hayMasRegistros && (
              <div className="px-4 py-4 bg-gray-50 border-t text-center">
                <button
                  onClick={cargarMasRegistros}
                  className="inline-flex items-center px-6 py-2.5 text-blue-700 bg-blue-50 border border-blue-200 font-medium rounded-xl hover:bg-blue-100 transition-colors"
                >
                  Ver más registros
                  <ChevronDown size={16} className="ml-2" />
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Mostrando {registrosMostrados} de {registrosFiltrados.length} registros
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserGestionPersonal;
