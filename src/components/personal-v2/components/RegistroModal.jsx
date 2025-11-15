/**
 * Modal para crear registros de gestión personal
 * Componente optimizado y reutilizable
 */

import React, { useState, useEffect } from 'react';

const RegistroModal = React.memo(({
  isOpen,
  onClose,
  onSubmit,
  colaborador,
  loading
}) => {
  const getFechaActual = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const hora = String(hoy.getHours()).padStart(2, '0');
    const minutos = String(hoy.getMinutes()).padStart(2, '0');
    return `${año}-${mes}-${dia}T${hora}:${minutos}`;
  };

  const [formData, setFormData] = useState({
    fechaDeGestion: getFechaActual(),
    descripcion: '',
    adelanto: 0,
    bonificacion: 0,
    descripcionBonificacion: ''
  });

  // Calcular pago diario basado en el sueldo del colaborador (sueldo / 30 días)
  const pagoDiarioCalculado = colaborador?.sueldo 
    ? (colaborador.sueldo / 30).toFixed(2) 
    : '0.00';

  useEffect(() => {
    if (colaborador && isOpen) {
      setFormData({
        fechaDeGestion: getFechaActual(),
        descripcion: `Registro de pago diario - ${colaborador.nombre_negocio}`,
        adelanto: 0,
        bonificacion: 0,
        descripcionBonificacion: ''
      });
    }
  }, [colaborador, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.descripcion.trim()) {
      alert('Por favor ingrese una descripción');
      return;
    }

    const dataToSubmit = {
      colaboradorUserId: colaborador?.clerk_id,
      fechaDeGestion: new Date(formData.fechaDeGestion).toISOString(),
      descripcion: formData.descripcion.trim(),
      adelanto: parseFloat(formData.adelanto) || 0,
      bonificacion: parseFloat(formData.bonificacion) || 0,
      descripcionBonificacion: formData.descripcionBonificacion.trim(),
      incluirDatosCobros: true
    };

    onSubmit(dataToSubmit);
  };

  const handleClose = () => {
    setFormData({
      fechaDeGestion: getFechaActual(),
      descripcion: '',
      adelanto: 0,
      bonificacion: 0,
      descripcionBonificacion: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-md max-h-[90vh] mx-2 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Nuevo Registro - {colaborador?.nombre_negocio || 'Colaborador'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha y Hora
            </label>
            <input
              type="datetime-local"
              value={formData.fechaDeGestion}
              onChange={(e) => setFormData(prev => ({ ...prev, fechaDeGestion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adelanto
                <span className="text-xs text-green-600 ml-1">(Manual)</span>
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.adelanto}
                  onChange={(e) => setFormData(prev => ({ ...prev, adelanto: e.target.value }))}
                  className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pago Diario 
                <span className="text-xs text-blue-600 ml-1">(Calculado)</span>
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                <input
                  type="text"
                  value={pagoDiarioCalculado}
                  readOnly
                  className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-700 font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Sección de Bonificación */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <span className="text-lg">🎁</span>
              Bonificación (Opcional)
            </label>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Monto</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bonificacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, bonificacion: e.target.value }))}
                    className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Concepto</label>
                <input
                  type="text"
                  maxLength="200"
                  value={formData.descripcionBonificacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcionBonificacion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Ej: Bono por puntualidad"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máx. 200 caracteres
                </p>
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">ℹ️ Información:</span> Los faltantes y gastos imprevistos se agregarán automáticamente desde los cobros del día.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

RegistroModal.displayName = 'RegistroModal';

export default RegistroModal;
