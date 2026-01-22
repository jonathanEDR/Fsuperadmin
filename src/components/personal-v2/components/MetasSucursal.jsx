/**
 * 🎯 Componente de Gestión de Metas por Sucursal
 * 
 * Features:
 * - Ver sucursales con sus metas configuradas
 * - Configurar metas DIARIAS y MENSUALES con sus bonificaciones
 * - Ver progreso de trabajadores
 * - Evaluar metas y otorgar bonificaciones
 * - Ver historial de evaluaciones
 * 
 * Campos de configuración:
 * - metaDiaria: Meta de cobros/ventas diaria (S/)
 * - bonificacionDiaria: Bonificación al cumplir la meta diaria (S/)
 * - metaMensual: Meta de cobros/ventas mensual (S/)
 * - bonificacionMensual: Bonificación al cumplir la meta mensual (S/)
 * - tipoMedicion: 'cobros' | 'ventas'
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, 
  TrendingUp, 
  Award, 
  Building2, 
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import metasSucursalService from '../../../services/metasSucursalService';

// ============================================================================
// SUBCOMPONENTES
// ============================================================================

/**
 * Tarjeta de resumen de sucursal
 */
const SucursalCard = ({ sucursal, onVerProgreso, onConfigurar }) => {
  const metaActiva = sucursal.metasConfig?.activo;
  const metaMensual = sucursal.metasConfig?.metaMensual || 0;
  const bonificacionMensual = sucursal.metasConfig?.bonificacionMensual || sucursal.metasConfig?.bonificacionPorCumplimiento || 0;
  const metaDiaria = sucursal.metasConfig?.metaDiaria || 0;
  const bonificacionDiaria = sucursal.metasConfig?.bonificacionDiaria || 0;

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
      metaActiva ? 'border-green-500' : 'border-gray-300'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            {sucursal.nombre}
          </h3>
          <p className="text-sm text-gray-500">{sucursal.ubicacion}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          metaActiva 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {metaActiva ? '🎯 Meta Activa' : 'Sin Meta'}
        </span>
      </div>

      {metaActiva && (
        <div className="space-y-2 mb-3">
          {/* Metas Diarias */}
          {metaDiaria > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-orange-50 rounded p-2">
                <p className="text-xs text-gray-500">📅 Meta Diaria</p>
                <p className="font-semibold text-orange-700">
                  {metasSucursalService.formatearMoneda(metaDiaria)}
                </p>
              </div>
              <div className="bg-yellow-50 rounded p-2">
                <p className="text-xs text-gray-500">Bonif. Diaria</p>
                <p className="font-semibold text-yellow-700">
                  {metasSucursalService.formatearMoneda(bonificacionDiaria)}
                </p>
              </div>
            </div>
          )}
          {/* Metas Mensuales */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded p-2">
              <p className="text-xs text-gray-500">📆 Meta Mensual</p>
              <p className="font-semibold text-blue-700">
                {metasSucursalService.formatearMoneda(metaMensual)}
              </p>
            </div>
            <div className="bg-green-50 rounded p-2">
              <p className="text-xs text-gray-500">Bonif. Mensual</p>
              <p className="font-semibold text-green-700">
                {metasSucursalService.formatearMoneda(bonificacionMensual)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onVerProgreso(sucursal)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1"
        >
          <TrendingUp size={16} />
          Ver Progreso
        </button>
        <button
          onClick={() => onConfigurar(sucursal)}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

/**
 * Modal de configuración de meta
 */
const ModalConfiguracion = ({ sucursal, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    activo: false,
    // Metas mensuales
    metaMensual: 0,
    bonificacionMensual: 0,
    // Metas diarias
    metaDiaria: 0,
    bonificacionDiaria: 0,
    // Otros
    tipoMedicion: 'cobros',
    notas: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sucursal && sucursal.metasConfig) {
      setFormData({
        activo: sucursal.metasConfig.activo || false,
        // Metas mensuales (compatibilidad con bonificacionPorCumplimiento)
        metaMensual: sucursal.metasConfig.metaMensual || 0,
        bonificacionMensual: sucursal.metasConfig.bonificacionMensual || sucursal.metasConfig.bonificacionPorCumplimiento || 0,
        // Metas diarias
        metaDiaria: sucursal.metasConfig.metaDiaria || 0,
        bonificacionDiaria: sucursal.metasConfig.bonificacionDiaria || 0,
        // Otros
        tipoMedicion: sucursal.metasConfig.tipoMedicion || 'cobros',
        notas: sucursal.metasConfig.notas || ''
      });
    }
  }, [sucursal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usar _id o sucursalId (compatibilidad)
      const sucursalId = sucursal?._id || sucursal?.sucursalId;
      if (!sucursalId) {
        throw new Error('No se pudo identificar la sucursal');
      }
      await onSave(sucursalId, formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-lg">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target size={20} />
            Configurar Meta - {sucursal?.nombre}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Activar/Desactivar */}
          <div className="flex items-center justify-between">
            <label className="font-medium">Sistema de Metas</label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.activo ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.activo ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Sección: Meta Diaria */}
          <div className="bg-orange-50 p-3 rounded-lg space-y-3">
            <h4 className="font-medium text-orange-800 flex items-center gap-2">
              📅 Meta Diaria
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta (S/)
                </label>
                <input
                  type="number"
                  value={formData.metaDiaria}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDiaria: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: 500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonificación (S/)
                </label>
                <input
                  type="number"
                  value={formData.bonificacionDiaria}
                  onChange={(e) => setFormData(prev => ({ ...prev, bonificacionDiaria: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: 20"
                />
              </div>
            </div>
          </div>

          {/* Sección: Meta Mensual */}
          <div className="bg-blue-50 p-3 rounded-lg space-y-3">
            <h4 className="font-medium text-blue-800 flex items-center gap-2">
              📆 Meta Mensual
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta (S/)
                </label>
                <input
                  type="number"
                  value={formData.metaMensual}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaMensual: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 15000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonificación (S/)
                </label>
                <input
                  type="number"
                  value={formData.bonificacionMensual}
                  onChange={(e) => setFormData(prev => ({ ...prev, bonificacionMensual: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 200"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Medición */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medir por
            </label>
            <select
              value={formData.tipoMedicion}
              onChange={(e) => setFormData(prev => ({ ...prev, tipoMedicion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="cobros">Cobros (montoPagado)</option>
              <option value="ventas">Ventas (montoTotal)</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Vista de progreso de una sucursal
 */
const ProgresoSucursal = ({ sucursal, onVolver, onEvaluar }) => {
  const [progreso, setProgreso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [evaluando, setEvaluando] = useState(false);

  // Obtener ID de sucursal de forma segura (compatibilidad con _id y sucursalId)
  const sucursalId = sucursal?._id || sucursal?.sucursalId;

  const cargarProgreso = useCallback(async () => {
    if (!sucursalId) {
      setError('No se pudo identificar la sucursal');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await metasSucursalService.obtenerProgreso(sucursalId, mes, año);
      setProgreso(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, mes, año]);

  useEffect(() => {
    cargarProgreso();
  }, [cargarProgreso]);

  const handleEvaluar = async (registrarBonificaciones = false) => {
    if (registrarBonificaciones && !window.confirm(
      '¿Está seguro de evaluar y REGISTRAR las bonificaciones?\n\nEsta acción creará registros en Gestión de Personal.'
    )) {
      return;
    }

    setEvaluando(true);
    try {
      const response = await metasSucursalService.evaluarMeta(sucursalId, mes, año, registrarBonificaciones);
      alert(registrarBonificaciones 
        ? `✅ Evaluación completada. ${response.data?.totalBonificacionesOtorgadas || 0} bonificaciones registradas.`
        : `ℹ️ Simulación completada. Ver resultados en consola.`
      );
      await cargarProgreso();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setEvaluando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={onVolver}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2"
          >
            ← Volver a Sucursales
          </button>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Building2 size={24} className="text-blue-600" />
            {sucursal.nombre}
          </h3>
        </div>

        {/* Selector de periodo */}
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {metasSucursalService.obtenerNombreMes(i + 1)}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            min="2020"
            max="2030"
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={cargarProgreso}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            title="Recargar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!progreso?.metaActiva ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          El sistema de metas no está activo para esta sucursal.
        </div>
      ) : (
        <>
          {/* 🆕 RESUMEN GLOBAL DE LA SUCURSAL - Meta Mensual es GLOBAL */}
          {progreso.resumenGlobal && (
            <div className={`rounded-lg p-4 mb-4 border-2 ${
              progreso.resumenGlobal.sucursalCumplioMetaMensual 
                ? 'bg-green-50 border-green-400' 
                : 'bg-blue-50 border-blue-300'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    🏪 Progreso Global de la Sucursal
                    {progreso.resumenGlobal.sucursalCumplioMetaMensual && (
                      <span className="text-green-600">✅ ¡META CUMPLIDA!</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600">
                    La meta mensual es para TODA la sucursal combinada
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {metasSucursalService.formatearMoneda(progreso.resumenGlobal.montoTotalSucursal)}
                    <span className="text-gray-400 text-lg"> / </span>
                    {metasSucursalService.formatearMoneda(progreso.resumenGlobal.metaMensual)}
                  </p>
                  <p className={`text-sm font-medium ${
                    progreso.resumenGlobal.porcentajeCumplimientoGlobal >= 100 
                      ? 'text-green-600' 
                      : 'text-blue-600'
                  }`}>
                    {progreso.resumenGlobal.porcentajeCumplimientoGlobal}% completado
                  </p>
                </div>
              </div>
              {/* Barra de progreso global */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      progreso.resumenGlobal.sucursalCumplioMetaMensual 
                        ? 'bg-green-500' 
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(progreso.resumenGlobal.porcentajeCumplimientoGlobal, 100)}%` }}
                  />
                </div>
              </div>
              {/* Nota sobre distribución manual */}
              {progreso.resumenGlobal.sucursalCumplioMetaMensual && (
                <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                  💰 <strong>Bonificación disponible:</strong> {metasSucursalService.formatearMoneda(progreso.configuracion?.bonificacionMensual)}
                  <br/>
                  <span className="text-xs">La distribución de la bonificación mensual es <strong>MANUAL</strong>. 
                  Registre las bonificaciones desde el perfil de cada colaborador en "Gestión Personal".</span>
                </div>
              )}
            </div>
          )}

          {/* Resumen de estadísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Metas Diarias */}
            {progreso.configuracion?.metaDiaria > 0 && (
              <>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">📅 Meta Diaria</p>
                  <p className="text-xl font-bold text-orange-700">
                    {metasSucursalService.formatearMoneda(progreso.configuracion?.metaDiaria)}
                  </p>
                  <p className="text-xs text-gray-500">Por colaborador</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Bonif. Diaria</p>
                  <p className="text-xl font-bold text-yellow-700">
                    {metasSucursalService.formatearMoneda(progreso.configuracion?.bonificacionDiaria)}
                  </p>
                  <p className="text-xs text-gray-500">Automática</p>
                </div>
              </>
            )}
            {/* Metas Mensuales - Ahora es GLOBAL */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">📆 Meta Mensual</p>
              <p className="text-xl font-bold text-blue-700">
                {metasSucursalService.formatearMoneda(progreso.configuracion?.metaMensual)}
              </p>
              <p className="text-xs text-gray-500">Global (sucursal)</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Bonif. Mensual</p>
              <p className="text-xl font-bold text-green-700">
                {metasSucursalService.formatearMoneda(progreso.configuracion?.bonificacionMensual || progreso.configuracion?.bonificacionPorCumplimiento)}
              </p>
              <p className="text-xs text-gray-500">Manual</p>
            </div>
            {/* Estadísticas */}
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Trabajadores</p>
              <p className="text-xl font-bold text-purple-700">
                {progreso.resumen?.totalTrabajadores || 0}
              </p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cumplen Diaria</p>
              <p className="text-xl font-bold text-indigo-700">
                {progreso.resumen?.trabajadoresCumplenDiaria || 0}
              </p>
            </div>
          </div>

          {/* Tabla de trabajadores */}
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trabajador</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Alcanzado</th>
                  {/* Columna Meta Diaria - solo si está configurada */}
                  {progreso.configuracion?.metaDiaria > 0 && (
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                      <span className="flex items-center justify-center gap-1">
                        📅 Diario
                      </span>
                    </th>
                  )}
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                    <span className="flex items-center justify-center gap-1">
                      📆 Mensual
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Bonificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {progreso.progresoPorTrabajador?.map((trabajador) => {
                  const coloresMensual = metasSucursalService.obtenerColorPorcentaje(trabajador.porcentajeCumplimiento);
                  const coloresDiario = metasSucursalService.obtenerColorPorcentaje(trabajador.porcentajeCumplimientoDiario || 0);
                  return (
                    <tr key={trabajador.colaboradorUserId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{trabajador.nombreColaborador}</p>
                        <p className="text-xs text-gray-500">{trabajador.cantidadCobros} cobros</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {metasSucursalService.formatearMoneda(trabajador.montoAlcanzado)}
                      </td>
                      {/* Progreso Diario */}
                      {progreso.configuracion?.metaDiaria > 0 && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                                <div
                                  className={`h-2 rounded-full ${coloresDiario.progress}`}
                                  style={{ width: `${Math.min(trabajador.porcentajeCumplimientoDiario || 0, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${coloresDiario.text} whitespace-nowrap`}>
                                {trabajador.porcentajeCumplimientoDiario || 0}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Prom: {metasSucursalService.formatearMoneda(trabajador.promedioDiario || 0)}/día
                            </p>
                          </div>
                        </td>
                      )}
                      {/* Progreso Mensual */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                            <div
                              className={`h-2 rounded-full ${coloresMensual.progress}`}
                              style={{ width: `${Math.min(trabajador.porcentajeCumplimiento, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${coloresMensual.text} whitespace-nowrap`}>
                            {trabajador.porcentajeCumplimiento}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          {/* Estado Meta Diaria - INDIVIDUAL */}
                          {progreso.configuracion?.metaDiaria > 0 && (
                            <span className={`inline-flex items-center gap-1 text-xs ${trabajador.cumplioMetaDiaria ? 'text-green-600' : 'text-orange-500'}`}>
                              📅 {trabajador.cumplioMetaDiaria ? '✓' : '○'}
                            </span>
                          )}
                          {/* 🆕 Estado Meta Mensual - GLOBAL (solo indicador de contribución) */}
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <XCircle size={16} className="opacity-50" />
                            <span className="text-xs">Pendiente</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col gap-1 text-right">
                          {/* Bonificación Diaria - AUTOMÁTICA */}
                          {progreso.configuracion?.metaDiaria > 0 && trabajador.bonificacionDiariaPotencial > 0 && (
                            <span className="text-orange-600 text-xs">
                              📅 {metasSucursalService.formatearMoneda(trabajador.bonificacionDiariaPotencial)}
                            </span>
                          )}
                          {/* 🆕 Bonificación Mensual - YA NO SE MUESTRA (es manual y global) */}
                          {/* Total - Solo muestra bonificación diaria automática */}
                          {trabajador.bonificacionPotencial > 0 && (
                            <span className="text-blue-600 font-medium text-sm border-t pt-1">
                              Auto: {metasSucursalService.formatearMoneda(trabajador.bonificacionPotencial)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Acciones de evaluación */}
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              onClick={() => handleEvaluar(false)}
              disabled={evaluando}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <History size={18} />
              Simular Evaluación
            </button>
            <button
              onClick={() => handleEvaluar(true)}
              disabled={evaluando}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Award size={18} />
              {evaluando ? 'Evaluando...' : 'Evaluar y Registrar Bonificaciones'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const MetasSucursal = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de vista
  const [vista, setVista] = useState('lista'); // 'lista' | 'progreso'
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [modalConfiguracion, setModalConfiguracion] = useState({ isOpen: false, sucursal: null });

  // Cargar sucursales
  const cargarSucursales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await metasSucursalService.obtenerSucursalesConMetas();
      setSucursales(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // Handlers
  const handleVerProgreso = (sucursal) => {
    setSucursalSeleccionada(sucursal);
    setVista('progreso');
  };

  const handleConfigurar = (sucursal) => {
    setModalConfiguracion({ isOpen: true, sucursal });
  };

  const handleGuardarConfiguracion = async (sucursalId, config) => {
    await metasSucursalService.configurarMeta(sucursalId, config);
    await cargarSucursales();
  };

  const handleVolver = () => {
    setVista('lista');
    setSucursalSeleccionada(null);
  };

  // Renderizado
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando sucursales...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Error al cargar sucursales</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={cargarSucursales}
          className="mt-2 text-sm text-red-800 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="text-blue-600" />
            Sistema de Metas y Bonificaciones
          </h2>
          <p className="text-sm text-gray-600">
            Configura metas diarias y mensuales por sucursal. Bonifica a los trabajadores que las cumplan.
          </p>
        </div>
      </div>

      {/* Contenido */}
      {vista === 'lista' ? (
        <>
          {sucursales.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay sucursales registradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sucursales.map((sucursal) => (
                <SucursalCard
                  key={sucursal._id || sucursal.sucursalId}
                  sucursal={sucursal}
                  onVerProgreso={handleVerProgreso}
                  onConfigurar={handleConfigurar}
                />
              ))}
            </div>
          )}
        </>
      ) : vista === 'progreso' && sucursalSeleccionada ? (
        <ProgresoSucursal
          sucursal={sucursalSeleccionada}
          onVolver={handleVolver}
        />
      ) : null}

      {/* Modal de configuración */}
      <ModalConfiguracion
        sucursal={modalConfiguracion.sucursal}
        isOpen={modalConfiguracion.isOpen}
        onClose={() => setModalConfiguracion({ isOpen: false, sucursal: null })}
        onSave={handleGuardarConfiguracion}
      />
    </div>
  );
};

export default MetasSucursal;
