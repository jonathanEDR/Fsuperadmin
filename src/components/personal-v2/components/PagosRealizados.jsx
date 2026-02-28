/**
 * Panel de Pagos Realizados - Modulo V2
 * Tabla resumen + Calendario mensual de pagos
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Trash2, Plus, Calendar, CreditCard, ChevronLeft, ChevronRight, Loader2, DollarSign, Clock, FileText, Check, X } from 'lucide-react';
import CalendarioSeleccionDias from './CalendarioSeleccionDias';
import ResumenSeleccion from './ResumenSeleccion';

// ---- Avatar reutilizable ----
const AvatarColab = ({ nombre, avatar, avatarUrl, size = 'md' }) => {
  const src = avatarUrl || (avatar ? (typeof avatar === 'string' ? avatar : avatar?.url) : null);
  const [err, setErr] = React.useState(false);
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (src && !err) {
    return <img src={src} alt={nombre} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`} onError={() => setErr(true)} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}>
      {nombre?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

// ---- Helpers ----
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const obtenerFechaHoyPeru = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

const PagosRealizados = React.memo(({
  colaboradores,
  pagosRealizados,
  registros,
  estadisticasBulk,
  onCrearPago,
  onEliminarPago,
  formatearMoneda,
  loading
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null);
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anoActual, setAnoActual] = useState(new Date().getFullYear());

  // Scroll calendario
  const calScrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = calScrollRef.current;
    if (el) {
      setCanLeft(el.scrollLeft > 0);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  }, []);

  const doScroll = useCallback((dir) => {
    const el = calScrollRef.current;
    if (el) {
      el.scrollTo({ left: el.scrollLeft + (dir === 'left' ? -200 : 200), behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  }, [checkScroll]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [colaboradores, checkScroll]);

  // Seleccion de dias
  const [registrosSeleccionados, setRegistrosSeleccionados] = useState([]);
  const [registrosPendientes, setRegistrosPendientes] = useState([]);
  const [formData, setFormData] = useState({
    fechaPago: obtenerFechaHoyPeru(),
    montoTotal: 0,
    metodoPago: 'efectivo',
    observaciones: '',
    estado: 'pagado'
  });

  const metodosPago = ['efectivo', 'transferencia', 'deposito', 'cheque'];

  const calcularMontoPendiente = useCallback((clerkId) => {
    const est = estadisticasBulk[clerkId] || {};
    const totalAPagar = est.totalAPagarConCobros || 0;
    const totalPagado = pagosRealizados
      .filter(p => p.colaboradorUserId === clerkId)
      .reduce((sum, p) => sum + (p.montoTotal || p.monto || 0), 0);
    return totalAPagar - totalPagado;
  }, [pagosRealizados, estadisticasBulk]);

  const navegarMes = (dir) => {
    if (dir === 'ant') {
      if (mesActual === 0) { setMesActual(11); setAnoActual(a => a - 1); }
      else setMesActual(m => m - 1);
    } else {
      if (mesActual === 11) { setMesActual(0); setAnoActual(a => a + 1); }
      else setMesActual(m => m + 1);
    }
  };

  const irHoy = () => { const h = new Date(); setMesActual(h.getMonth()); setAnoActual(h.getFullYear()); };

  const parsearFechaPeru = useCallback((fechaISO) => {
    if (!fechaISO) return null;
    const d = new Date(fechaISO);
    const s = d.toLocaleDateString('es-PE', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [dia, mes, ano] = s.split('/').map(Number);
    return { dia, mes: mes - 1, ano };
  }, []);

  const agruparPagosPorDia = useMemo(() => {
    const agr = {};
    pagosRealizados.forEach(pago => {
      if (pago.diasPagados && pago.diasPagados.length > 0) {
        pago.diasPagados.forEach(dp => {
          const raw = dp.fecha || dp.fechaRegistro;
          const p = parsearFechaPeru(raw);
          if (p && p.mes === mesActual && p.ano === anoActual) {
            if (!agr[p.dia]) agr[p.dia] = [];
            agr[p.dia].push({ ...pago, montoTotal: dp.montoPagadoDia || 0, esPagoParcial: true, conceptos: dp.conceptos || {}, uniqueKey: `${pago._id}-${raw}` });
          }
        });
      } else {
        const p = parsearFechaPeru(pago.fechaPago);
        if (p && p.mes === mesActual && p.ano === anoActual) {
          if (!agr[p.dia]) agr[p.dia] = [];
          agr[p.dia].push(pago);
        }
      }
    });
    return agr;
  }, [pagosRealizados, mesActual, anoActual, parsearFechaPeru]);

  const montoCalculado = useMemo(() => {
    if (registrosSeleccionados.length === 0) return 0;
    let pagos = 0, bonif = 0, falt = 0, adel = 0;
    registrosSeleccionados.forEach(r => {
      const t = r.tipo || 'pago_diario';
      if (t === 'pago_diario') { pagos += r.pagodiario || 0; bonif += r.bonificacion || 0; adel += r.adelanto || 0; }
      else if (t === 'adelanto_manual') adel += r.adelanto || 0;
      else if (t === 'bonificacion_manual' || t === 'bonificacion_meta') bonif += r.bonificacion || 0;
      else if (t === 'ajuste_manual') { bonif += r.bonificacion || 0; adel += r.adelanto || 0; }
      else if (t === 'faltante_cobro' || t === 'faltante_manual' || t === 'descuento_tardanza') falt += r.faltante || 0;
    });
    return pagos + bonif - falt - adel;
  }, [registrosSeleccionados]);

  const obtenerRegistrosPendientes = useCallback((clerkId) => {
    return registros.filter(r => r.colaboradorUserId === clerkId && r.estadoPago === 'pendiente').sort((a, b) => new Date(a.fechaDeGestion) - new Date(b.fechaDeGestion));
  }, [registros]);

  const handleSeleccionDias = useCallback((regs) => setRegistrosSeleccionados(regs), []);

  const handleAbrirModal = (col) => {
    setColaboradorSeleccionado(col);
    const pend = obtenerRegistrosPendientes(col.clerk_id);
    setRegistrosPendientes(pend);
    setRegistrosSeleccionados([]);
    setFormData({ fechaPago: obtenerFechaHoyPeru(), montoTotal: 0, metodoPago: 'efectivo', observaciones: '', estado: 'pagado' });
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setColaboradorSeleccionado(null);
    setRegistrosSeleccionados([]);
    setRegistrosPendientes([]);
    setFormData({ fechaPago: obtenerFechaHoyPeru(), montoTotal: 0, metodoPago: 'efectivo', observaciones: '', estado: 'pagado' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (registrosSeleccionados.length === 0) { alert('Debes seleccionar al menos un dia para pagar'); return; }
    if (montoCalculado <= 0) { alert('El monto debe ser mayor a 0'); return; }
    const tipos = ['pago_diario','bonificacion_manual','bonificacion_meta','adelanto_manual','ajuste_manual','faltante_manual','descuento_tardanza'];
    const regsAPagar = registrosSeleccionados.filter(r => !r.tipo || tipos.includes(r.tipo));
    const data = {
      colaboradorUserId: colaboradorSeleccionado.clerk_id,
      fechaPago: new Date(formData.fechaPago + 'T12:00:00-05:00').toISOString(),
      registrosIds: regsAPagar.map(r => r._id),
      metodoPago: formData.metodoPago,
      observaciones: formData.observaciones.trim(),
      estado: formData.estado
    };
    try { await onCrearPago(data); handleCerrarModal(); } catch (error) { alert('Error al registrar el pago: ' + error.message); }
  };

  const confirmarEliminacion = async () => { if (!confirmacionEliminar) return; await onEliminarPago(confirmacionEliminar); setConfirmacionEliminar(null); };

  const formatearFecha = (f) => new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Lima' });

  const obtenerDiasDelMes = (m, a) => Array.from({ length: new Date(a, m + 1, 0).getDate() }, (_, i) => i + 1);

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* ---- Tabla Resumen de Colaboradores ---- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Resumen de Colaboradores</h3>
              <p className="text-xs text-gray-400 mt-0.5">{colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}</p>
            </div>
          </div>
        </div>

        {/* Vista movil - tarjetas */}
        <div className="md:hidden p-3 space-y-3">
          {colaboradores.map(col => {
            const pendiente = calcularMontoPendiente(col.clerk_id);
            const ultimo = pagosRealizados.filter(p => p.colaboradorUserId === col.clerk_id).sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))[0];
            return (
              <div key={col._id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AvatarColab nombre={col.nombre_negocio} avatar={col.avatar} avatarUrl={col.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{col.nombre_negocio}</h4>
                      <span className="text-xs text-gray-400 capitalize">{col.role}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                    pendiente > 0 ? 'text-red-600 bg-red-50 border border-red-100' : pendiente < 0 ? 'text-blue-600 bg-blue-50 border border-blue-100' : 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                  }`}>
                    {formatearMoneda(pendiente)}
                  </span>
                </div>
                {ultimo && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Clock size={11} />
                    <span>Ultimo pago: {formatearFecha(ultimo.fechaPago)}</span>
                    <span className="font-medium text-emerald-600">{formatearMoneda(ultimo.montoTotal)}</span>
                  </div>
                )}
                <button
                  onClick={() => handleAbrirModal(col)}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-50"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Registrar Pago
                </button>
              </div>
            );
          })}
        </div>

        {/* Vista desktop - tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ultimo Pago</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto Ultimo</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {colaboradores.map(col => {
                const pendiente = calcularMontoPendiente(col.clerk_id);
                const ultimo = pagosRealizados.filter(p => p.colaboradorUserId === col.clerk_id).sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))[0];
                return (
                  <tr key={col._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarColab nombre={col.nombre_negocio} avatar={col.avatar} avatarUrl={col.avatar_url} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-gray-800">{col.nombre_negocio}</span>
                          <span className="text-xs text-gray-400">{col.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-lg ${
                        pendiente > 0 ? 'text-red-600 bg-red-50 border border-red-100'
                        : pendiente < 0 ? 'text-blue-600 bg-blue-50 border border-blue-100'
                        : 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                      }`}>
                        {formatearMoneda(pendiente)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-500">
                      {ultimo ? formatearFecha(ultimo.fechaPago) : <span className="text-gray-300 italic text-xs">Sin pagos</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {ultimo ? (
                        <span className="text-sm font-semibold text-emerald-600">{formatearMoneda(ultimo.montoTotal)}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleAbrirModal(col)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 hover:shadow-sm text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-50"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        Registrar Pago
                      </button>
                    </td>
                  </tr>
                );
              })}
              {colaboradores.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400 italic">No hay colaboradores</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Calendario de Pagos ---- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                <Calendar size={16} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Calendario de Pagos</h3>
                <p className="text-xs text-gray-400">{colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navegarMes('ant')} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-blue-100 shadow-sm min-w-[140px] justify-center">
                <Calendar size={14} className="text-blue-400" />
                <span className="text-sm font-semibold text-gray-700">{MESES[mesActual]} {anoActual}</span>
              </div>
              <button onClick={() => navegarMes('sig')} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                <ChevronRight size={16} />
              </button>
              <button onClick={irHoy} className="text-xs text-blue-600 font-medium px-2.5 py-1.5 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors ml-1">
                Hoy
              </button>
            </div>
          </div>

          {/* Scroll horizontal para muchos colaboradores */}
          {colaboradores.length > 3 && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 mr-1">Navegar:</span>
              <button onClick={() => doScroll('left')} disabled={!canLeft}
                className={`p-1.5 rounded-full transition-all ${canLeft ? 'bg-blue-50 text-blue-500 hover:bg-blue-100 border border-blue-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'}`}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => doScroll('right')} disabled={!canRight}
                className={`p-1.5 rounded-full transition-all ${canRight ? 'bg-blue-50 text-blue-500 hover:bg-blue-100 border border-blue-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'}`}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Tabla calendario */}
        <div className="relative">
          {canLeft && <div className="absolute left-14 sm:left-20 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />}
          {canRight && <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />}

          <div ref={calScrollRef} className="overflow-x-auto" onScroll={checkScroll}>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase border-r border-gray-100 bg-gray-50 sticky left-0 z-20 w-14 sm:w-20">Dia</th>
                  {colaboradores.map(col => {
                    const nombre = col.nombre_negocio || '';
                    const palabras = nombre.trim().split(' ');
                    const iniciales = palabras.length >= 2 ? (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase() : nombre.slice(0, 2).toUpperCase();
                    return (
                      <th key={col._id} className="px-2 sm:px-3 py-2.5 text-center text-xs font-medium text-gray-500 border-r border-gray-100 min-w-[50px] sm:min-w-[120px]">
                        <div className="hidden sm:flex items-center justify-center gap-1.5">
                          <AvatarColab nombre={col.nombre_negocio} avatar={col.avatar} avatarUrl={col.avatar_url} size="sm" />
                          <span className="font-semibold truncate text-gray-700">{col.nombre_negocio}</span>
                        </div>
                        <div className="sm:hidden">
                          <AvatarColab nombre={col.nombre_negocio} avatar={col.avatar} avatarUrl={col.avatar_url} size="sm" />
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase min-w-[60px] sm:min-w-[80px]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {obtenerDiasDelMes(mesActual, anoActual).map(dia => {
                  const pagosHoy = agruparPagosPorDia[dia] || [];
                  const totalDia = pagosHoy.reduce((s, p) => s + p.montoTotal, 0);
                  const hoyPeru = obtenerFechaHoyPeru();
                  const [hy, hm, hd] = hoyPeru.split('-').map(Number);
                  const esHoy = dia === hd && mesActual === hm - 1 && anoActual === hy;

                  return (
                    <tr key={dia} className={`transition-colors ${esHoy ? 'bg-blue-50/30' : 'hover:bg-slate-50/40'}`}>
                      <td className={`px-2 sm:px-3 py-2 text-center border-r border-gray-100 sticky left-0 z-10 ${esHoy ? 'bg-blue-50' : 'bg-gray-50/80'}`}>
                        <div className={`font-bold text-sm sm:text-base ${esHoy ? 'text-blue-600' : 'text-gray-800'}`}>{dia}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">{new Date(anoActual, mesActual, dia).toLocaleDateString('es-PE', { weekday: 'short' })}</div>
                      </td>
                      {colaboradores.map(col => {
                        const pagoCol = pagosHoy.filter(p => p.colaboradorUserId === col.clerk_id);
                        return (
                          <td key={`${dia}-${col._id}`} className="px-1 sm:px-2 py-1 sm:py-1.5 border-r border-gray-100">
                            {pagoCol.length > 0 ? (
                              <div className="space-y-1">
                                {pagoCol.map((pago, i) => {
                                  const diasCub = pago.diasPagados?.length || 0;
                                  return (
                                    <div key={pago.uniqueKey || `${pago._id}-${i}`}
                                      className="flex justify-between items-center p-1.5 sm:p-2 bg-emerald-50 rounded-lg border border-emerald-100 group"
                                      title={diasCub > 0 ? `${diasCub} dia${diasCub > 1 ? 's' : ''}` : pago.observaciones || 'Pago'}>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-emerald-700 text-xs sm:text-sm truncate">{formatearMoneda(pago.montoTotal)}</div>
                                        <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[10px] text-gray-400">{pago.metodoPago}</span>
                                          {diasCub > 0 && <span className="text-[10px] text-blue-500 font-medium flex items-center gap-0.5"><Check size={8} strokeWidth={3}/> {diasCub}d</span>}
                                        </div>
                                      </div>
                                      <button onClick={() => setConfirmacionEliminar(pago._id)}
                                        className="ml-1 text-red-400 hover:text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center text-gray-200 text-xs">-</div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {totalDia > 0 && <span className="font-bold text-emerald-600 text-xs sm:text-sm">{formatearMoneda(totalDia)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---- Modal Crear Pago ---- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full my-4 max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center z-10 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Registrar Pago</h3>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                  <AvatarColab nombre={colaboradorSeleccionado?.nombre_negocio} avatar={colaboradorSeleccionado?.avatar} avatarUrl={colaboradorSeleccionado?.avatar_url} size="sm" />
                  {colaboradorSeleccionado?.nombre_negocio} - Selecciona los dias a pagar
                </p>
              </div>
              <button onClick={handleCerrarModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                <div className="lg:col-span-3">
                  <CalendarioSeleccionDias colaborador={colaboradorSeleccionado} registrosPendientes={registrosPendientes} onSeleccionChange={handleSeleccionDias} loading={loading} />
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <ResumenSeleccion registrosSeleccionados={registrosSeleccionados} formatearMoneda={formatearMoneda} colaboradorSeleccionado={colaboradorSeleccionado} />
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                      <CreditCard size={15} className="text-gray-400" />
                      Informacion del Pago
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de Pago</label>
                        <input type="date" value={formData.fechaPago} onChange={(e) => setFormData(p => ({ ...p, fechaPago: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Metodo de Pago</label>
                        <select value={formData.metodoPago} onChange={(e) => setFormData(p => ({ ...p, metodoPago: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all">
                          {metodosPago.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones (opcional)</label>
                        <textarea value={formData.observaciones} onChange={(e) => setFormData(p => ({ ...p, observaciones: e.target.value }))}
                          rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none" placeholder="Opcional..." />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 flex gap-2 justify-end">
                <button type="button" onClick={handleCerrarModal}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading || registrosSeleccionados.length === 0}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all">
                  {loading ? (<><Loader2 size={14} className="animate-spin" /> Guardando...</>) : (<>Guardar Pago ({formatearMoneda(montoCalculado)})</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Modal Confirmar Eliminacion ---- */}
      {confirmacionEliminar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar Eliminacion</h3>
            <p className="text-sm text-gray-500 mb-6">Esta accion no se puede deshacer. Se restauraran los dias como pendientes.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmacionEliminar(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarEliminacion} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PagosRealizados.displayName = 'PagosRealizados';

export default PagosRealizados;