/**
 * Modal para registrar Bonificaciones y Adelantos
 * Diseño profesional y colores suaves
 */

import React, { useState, useEffect } from 'react';

const BonificacionAdelantoModal = React.memo(({
  isOpen,
  onClose,
  onSubmit,
  colaborador,
  loading
}) => {
  const [tipoRegistro, setTipoRegistro] = useState('bonificacion');
  
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
      setTipoRegistro('bonificacion');
    }
  }, [colaborador, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const monto = parseFloat(formData.monto);
    if (!monto || monto <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    const dataToSubmit = {
      colaboradorUserId: colaborador?.clerk_id,
      fechaDeGestion: new Date(formData.fechaDeGestion).toISOString(),
      tipo: tipoRegistro,
      monto: monto,
      descripcion: formData.descripcion.trim() || 
        (tipoRegistro === 'bonificacion' 
          ? `Bonificación - ${colaborador?.nombre_negocio}`
          : `Adelanto - ${colaborador?.nombre_negocio}`)
    };

    onSubmit(dataToSubmit);
  };

  const handleClose = () => {
    setFormData({
      fechaDeGestion: getFechaActual(),
      monto: '',
      descripcion: ''
    });
    setTipoRegistro('bonificacion');
    onClose();
  };

  if (!isOpen) return null;

  const isBonificacion = tipoRegistro === 'bonificacion';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-md mx-3 transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{isBonificacion ? '🎁' : '💸'}</span>
              <h3 className="text-lg font-semibold text-gray-800">
                {isBonificacion ? 'Nueva Bonificación' : 'Nuevo Adelanto'}
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Para {colaborador?.nombre_negocio || 'colaborador'}
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

        {/* Selector de tipo */}
        <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setTipoRegistro('bonificacion')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              isBonificacion
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎁 Bonificación
          </button>
          <button
            type="button"
            onClick={() => setTipoRegistro('adelanto')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              !isBonificacion
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💸 Adelanto
          </button>
        </div>

        {/* Info del colaborador */}
        <div className={`rounded-xl p-4 mb-5 border ${
          isBonificacion 
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100' 
            : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              isBonificacion ? 'bg-amber-100' : 'bg-orange-100'
            }`}>
              {colaborador?.nombre_negocio?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
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
              className={`w-full px-3.5 py-2.5 border rounded-xl transition-colors bg-gray-50/50 ${
                isBonificacion 
                  ? 'border-amber-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400' 
                  : 'border-orange-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400'
              }`}
              required
            />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">S/</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.monto}
                onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl transition-colors bg-gray-50/50 text-lg font-semibold ${
                  isBonificacion 
                    ? 'border-amber-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400' 
                    : 'border-orange-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400'
                }`}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Concepto
              <span className="text-xs text-gray-400 ml-1 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              maxLength="200"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-300/50 focus:border-gray-300 transition-colors bg-gray-50/50"
              placeholder={isBonificacion 
                ? 'Ej: Bono por puntualidad, Meta alcanzada...' 
                : 'Ej: Adelanto quincenal, Emergencia...'}
            />
          </div>

          {/* Nota informativa */}
          <div className={`p-3.5 rounded-xl border ${
            isBonificacion 
              ? 'bg-amber-50/50 border-amber-200/50' 
              : 'bg-orange-50/50 border-orange-200/50'
          }`}>
            <p className={`text-sm flex items-start gap-2 ${
              isBonificacion ? 'text-amber-700' : 'text-orange-700'
            }`}>
              <span className="text-base mt-0.5">{isBonificacion ? '📈' : '📉'}</span>
              <span>
                {isBonificacion 
                  ? 'Las bonificaciones se SUMAN al total a pagar del colaborador.'
                  : 'Los adelantos se RESTAN del total a pagar del colaborador.'}
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
              className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isBonificacion
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 shadow-orange-500/25'
              }`}
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
                `Registrar ${isBonificacion ? 'Bonificación' : 'Adelanto'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

BonificacionAdelantoModal.displayName = 'BonificacionAdelantoModal';

export default BonificacionAdelantoModal;
