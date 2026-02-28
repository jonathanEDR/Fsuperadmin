/**
 * Modal para registrar Pago Diario Manual
 * Usado como respaldo cuando el pago automatico no funciona
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, X, Loader2 } from 'lucide-react';

const RegistroModal = React.memo(({
  isOpen, onClose, onSubmit, colaborador, loading
}) => {

  const getFechaActual = () => {
    const hoy = new Date();
    const a = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    const h = String(hoy.getHours()).padStart(2, '0');
    const mi = String(hoy.getMinutes()).padStart(2, '0');
    return `${a}-${m}-${d}T${h}:${mi}`;
  };

  const [formData, setFormData] = useState({
    fechaDeGestion: getFechaActual(),
    descripcion: ''
  });
  const [validationError, setValidationError] = useState(null);

  const pagoDiarioCalculado = colaborador?.sueldo
    ? (colaborador.sueldo / 30).toFixed(2)
    : '0.00';

  useEffect(() => {
    if (colaborador && isOpen) {
      setFormData({
        fechaDeGestion: getFechaActual(),
        descripcion: `Pago diario manual - ${colaborador.nombre_negocio}`
      });
      setValidationError(null);
    }
  }, [colaborador, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.descripcion.trim()) {
      setValidationError('Por favor ingrese una descripcion');
      return;
    }
    setValidationError(null);
    onSubmit({
      colaboradorUserId: colaborador?.clerk_id,
      fechaDeGestion: new Date(formData.fechaDeGestion).toISOString(),
      descripcion: formData.descripcion.trim(),
      adelanto: 0,
      bonificacion: 0,
      descripcionBonificacion: '',
      incluirDatosCobros: false
    });
  };

  const handleClose = () => {
    setFormData({ fechaDeGestion: getFechaActual(), descripcion: '' });
    setValidationError(null);
    onClose();
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all bg-gray-50/50';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" />
                Pago Diario Manual
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Registrar pago para {colaborador?.nombre_negocio || 'colaborador'}
              </p>
            </div>
            <button onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Info del colaborador */}
          <div className="bg-emerald-50 rounded-xl p-3.5 mb-5 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Colaborador</p>
                <p className="font-semibold text-sm text-gray-800">{colaborador?.nombre_negocio}</p>
                <p className="text-[11px] text-gray-400">{colaborador?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Pago Diario</p>
                <p className="text-xl font-bold text-emerald-600">S/ {pagoDiarioCalculado}</p>
                <p className="text-[11px] text-gray-400">Sueldo: S/ {colaborador?.sueldo?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* Validacion inline */}
          {validationError && (
            <div className="mb-4 px-3 py-2 rounded-xl text-xs border bg-red-50 border-red-200 text-red-600 flex items-center gap-2">
              <AlertTriangle size={12} /> {validationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Fecha y Hora</label>
              <input type="datetime-local" value={formData.fechaDeGestion}
                onChange={(e) => setFormData(p => ({ ...p, fechaDeGestion: e.target.value }))}
                className={inputCls} required />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Descripcion</label>
              <textarea value={formData.descripcion}
                onChange={(e) => { setFormData(p => ({ ...p, descripcion: e.target.value })); setValidationError(null); }}
                rows={2} className={`${inputCls} resize-none`}
                placeholder="Ej: Pago diario manual por asistencia..." required />
            </div>

            {/* Nota */}
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700 flex items-start gap-2">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                <span><strong>Nota:</strong> Use esta opcion solo cuando el registro automatico no haya funcionado correctamente.</span>
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleClose} disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium border text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 rounded-lg transition-all disabled:opacity-50">
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Registrando...</>
                ) : (
                  'Registrar Pago'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

RegistroModal.displayName = 'RegistroModal';
export default RegistroModal;