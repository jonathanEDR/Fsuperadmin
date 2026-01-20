/**
 * Modal de Configuración de Descuentos por Tardanza
 * Permite configurar el monto o porcentaje de descuento automático
 */

import React, { useState, useEffect } from 'react';
import { Settings, Percent, DollarSign, Clock, Save, X, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';

const ConfiguracionTardanzaModal = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado de la configuración
  const [config, setConfig] = useState({
    habilitado: true,
    tipoDescuento: 'porcentaje', // 'porcentaje' o 'monto_fijo'
    valorPorcentaje: 10,
    montoFijo: 5,
    aplicarAutomaticamente: true
  });

  // Cargar configuración al abrir
  useEffect(() => {
    if (isOpen) {
      cargarConfiguracion();
    }
  }, [isOpen]);

  const cargarConfiguracion = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/gestion-personal/configuracion-tardanza');
      if (response.data.success && response.data.configuracion) {
        setConfig(response.data.configuracion);
      }
    } catch (err) {
      console.log('No hay configuración previa, usando valores por defecto');
      // Usar valores por defecto si no hay configuración
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setError(null);
    
    try {
      const response = await api.post('/api/gestion-personal/configuracion-tardanza', {
        configuracion: config
      });
      
      if (response.data.success) {
        onSave && onSave(config);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar configuración');
    } finally {
      setGuardando(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Configuración de Tardanzas</h3>
                <p className="text-white/80 text-sm">Descuentos automáticos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              <span className="ml-3 text-gray-600">Cargando configuración...</span>
            </div>
          ) : (
            <>
              {/* Toggle Habilitado */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="text-amber-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Descuento por tardanza</p>
                    <p className="text-sm text-gray-500">Activar descuento automático</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.habilitado}
                    onChange={(e) => handleChange('habilitado', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {config.habilitado && (
                <>
                  {/* Tipo de descuento */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de descuento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleChange('tipoDescuento', 'porcentaje')}
                        className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          config.tipoDescuento === 'porcentaje'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Percent size={20} />
                        <span className="font-medium">Porcentaje</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('tipoDescuento', 'monto_fijo')}
                        className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          config.tipoDescuento === 'monto_fijo'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <DollarSign size={20} />
                        <span className="font-medium">Monto Fijo</span>
                      </button>
                    </div>
                  </div>

                  {/* Valor del descuento */}
                  {config.tipoDescuento === 'porcentaje' ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Porcentaje a descontar del pago diario
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={config.valorPorcentaje}
                          onChange={(e) => handleChange('valorPorcentaje', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
                          placeholder="10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          %
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" />
                        Ejemplo: Si el pago diario es S/ 50.00 y el descuento es 10%, se descontará S/ 5.00
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Monto fijo a descontar
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          S/
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={config.montoFijo}
                          onChange={(e) => handleChange('montoFijo', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
                          placeholder="5.00"
                        />
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" />
                        Este monto se descontará por cada tardanza registrada
                      </p>
                    </div>
                  )}

                  {/* Aplicar automáticamente */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <p className="font-medium text-blue-800">Aplicar automáticamente</p>
                      <p className="text-sm text-blue-600">
                        Crear descuento al registrar asistencia con tardanza
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.aplicarAutomaticamente}
                        onChange={(e) => handleChange('aplicarAutomaticamente', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionTardanzaModal;
