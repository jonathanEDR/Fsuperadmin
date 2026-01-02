/**
 * Modal para registrar Pago Diario Manual
 * Usado como respaldo cuando el pago automático no funciona
 * Diseño limpio y profesional
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
    descripcion: ''
  });

  // Calcular pago diario basado en el sueldo del colaborador (sueldo / 30 días)
  const pagoDiarioCalculado = colaborador?.sueldo 
    ? (colaborador.sueldo / 30).toFixed(2) 
    : '0.00';

  useEffect(() => {
    if (colaborador && isOpen) {
      setFormData({
        fechaDeGestion: getFechaActual(),
        descripcion: `Pago diario manual - ${colaborador.nombre_negocio}`
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
      adelanto: 0,
      bonificacion: 0,
      descripcionBonificacion: '',
      incluirDatosCobros: false
    };

    onSubmit(dataToSubmit);
  };

  const handleClose = () => {
    setFormData({
      fechaDeGestion: getFechaActual(),
      descripcion: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-md mx-3 transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">💵</span>
              <h3 className="text-lg font-semibold text-gray-800">
                Pago Diario Manual
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Registrar pago diario para {colaborador?.nombre_negocio || 'colaborador'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info del colaborador */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-5 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Colaborador</p>
              <p className="font-semibold text-gray-800">{colaborador?.nombre_negocio}</p>
              <p className="text-xs text-gray-500">{colaborador?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Pago Diario</p>
              <p className="text-2xl font-bold text-emerald-600">S/ {pagoDiarioCalculado}</p>
              <p className="text-xs text-gray-500">Sueldo: S/ {colaborador?.sueldo?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha y Hora del Registro
            </label>
            <input
              type="datetime-local"
              value={formData.fechaDeGestion}
              onChange={(e) => setFormData(prev => ({ ...prev, fechaDeGestion: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-gray-50/50"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-gray-50/50 resize-none"
              placeholder="Ej: Pago diario manual por asistencia..."
              required
            />
          </div>

          {/* Nota informativa */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/50">
            <p className="text-sm text-amber-700 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Nota:</strong> Use esta opción solo cuando el registro automático no haya funcionado correctamente.
              </span>
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </span>
              ) : (
                'Registrar Pago'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

RegistroModal.displayName = 'RegistroModal';

export default RegistroModal;
