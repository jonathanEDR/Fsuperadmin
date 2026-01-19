/**
 * Modal para registrar Descuentos y Faltantes Directos
 * Permite registrar faltantes sin necesidad de pasar por el flujo de cobros
 * Diseño profesional y colores claros
 */

import React, { useState, useEffect } from 'react';

const DescuentoModal = React.memo(({
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
    monto: '',
    descripcion: ''
  });

  useEffect(() => {
    if (colaborador && isOpen) {
      setFormData({
        fechaDeGestion: getFechaActual(),
        monto: '',
        descripcion: ''
      });
    }
  }, [colaborador, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const monto = parseFloat(formData.monto);
    if (!monto || monto <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    if (!formData.descripcion.trim()) {
      alert('Por favor ingrese una descripción del descuento');
      return;
    }

    const dataToSubmit = {
      colaboradorUserId: colaborador?.clerk_id,
      fechaDeGestion: new Date(formData.fechaDeGestion).toISOString(),
      monto: monto,
      descripcion: formData.descripcion.trim()
    };

    onSubmit(dataToSubmit);
  };

  const handleClose = () => {
    setFormData({
      fechaDeGestion: getFechaActual(),
      monto: '',
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
              <span className="text-2xl">🔻</span>
              <h3 className="text-lg font-semibold text-gray-800">
                Registrar Descuento/Faltante
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Para {colaborador?.nombre_negocio || 'colaborador'}
            </p>
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <span>⚠️</span>
              <span>Se restará del monto total a pagar del colaborador</span>
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
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-5 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-lg font-semibold text-red-600">
              {colaborador?.nombre_negocio?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1">
              <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Colaborador</p>
              <p className="font-semibold text-gray-800">{colaborador?.nombre_negocio}</p>
              <p className="text-xs text-gray-500">{colaborador?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha y Hora
            </label>
            <input
              type="datetime-local"
              value={formData.fechaDeGestion}
              onChange={(e) => setFormData(prev => ({ ...prev, fechaDeGestion: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors bg-gray-50/50"
              required
            />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monto del Descuento
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.monto}
                onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                className="w-full pl-12 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors bg-gray-50/50"
                placeholder="0.00"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Ingrese el monto que se descontará del pago
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Motivo del Descuento <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors bg-gray-50/50 resize-none"
              placeholder="Ej: Faltante en caja, pérdida de producto, error en registro..."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Describa detalladamente el motivo del descuento
            </p>
          </div>

          {/* Nota informativa */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/50">
            <p className="text-sm text-amber-700 flex items-start gap-2">
              <span className="text-base">💡</span>
              <span>
                <strong>Importante:</strong> Este descuento se restará directamente del total a pagar del colaborador. 
                Los faltantes detectados en cobros se registran automáticamente.
              </span>
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                'Registrar Descuento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

DescuentoModal.displayName = 'DescuentoModal';

export default DescuentoModal;
