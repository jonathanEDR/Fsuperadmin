import React, { useState } from 'react';

const GestionPersonalModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  colaboradorSeleccionado, 
  loading, 
  error 
}) => {
  const getFechaActualString = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const hora = String(hoy.getHours()).padStart(2, '0');
    const minutos = String(hoy.getMinutes()).padStart(2, '0');
    return `${año}-${mes}-${dia}T${hora}:${minutos}`;
  };

  const [formData, setFormData] = useState({
    colaboradorId: colaboradorSeleccionado?._id || '',
    fechaDeGestion: getFechaActualString(),
    descripcion: '',
    adelanto: 0 // Solo adelantos
  });

  const pagoDiarioCalculado = colaboradorSeleccionado?.sueldo ? (colaboradorSeleccionado.sueldo / 30).toFixed(2) : 0;
  React.useEffect(() => {
    if (colaboradorSeleccionado) {
      console.log('Colaborador seleccionado en modal:', colaboradorSeleccionado); // Debug
      setFormData({
        colaboradorId: colaboradorSeleccionado._id,
        fechaDeGestion: getFechaActualString(),
        descripcion: `Registro de pago diario - ${colaboradorSeleccionado.nombre_negocio}`,
        adelanto: 0
      });
    }
  }, [colaboradorSeleccionado]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.descripcion.trim()) {
      alert('Por favor ingrese una descripción');
      return;
    }

    // Solo enviamos adelantos, el sistema automáticamente agregará faltantes y gastos
    const dataToSubmit = {
      colaboradorUserId: colaboradorSeleccionado?.clerk_id,
      fechaDeGestion: new Date(formData.fechaDeGestion).toISOString(),
      descripcion: formData.descripcion.trim(),
      adelanto: parseFloat(formData.adelanto) || 0,
      incluirDatosCobros: true // Flag para que el backend agregue automáticamente faltantes y gastos
    };

    onSubmit(dataToSubmit);
  };

  const resetForm = () => {
    setFormData({
      colaboradorId: '',
      fechaDeGestion: getFechaActualString(),
      descripcion: '',
      adelanto: 0
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-md max-h-[90vh] mx-2 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Nuevo Registro - {colaboradorSeleccionado?.nombre_negocio || 'Colaborador'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha y Hora de Gestión
            </label>
            <input
              type="datetime-local"
              value={formData.fechaDeGestion}
              onChange={(e) => handleInputChange('fechaDeGestion', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Describe el concepto del registro..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
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
                  onChange={(e) => handleInputChange('adelanto', e.target.value)}
                  className="w-full pl-8 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full pl-8 p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">ℹ️ Información:</span> Los faltantes y gastos imprevistos se agregarán automáticamente desde los cobros del día.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GestionPersonalModal;
