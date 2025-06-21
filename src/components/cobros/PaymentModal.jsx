import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, onSubmit, venta }) => {
  const [formData, setFormData] = useState({
    yape: 0,
    efectivo: 0,
    gastosImprevistos: 0,
    descripcion: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let numberValue = name !== 'descripcion' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({
      ...prev,
      [name]: numberValue
    }));
  };  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calcular el total automáticamente
    const total = (parseFloat(formData.yape) || 0) + 
                  (parseFloat(formData.efectivo) || 0) + 
                  (parseFloat(formData.gastosImprevistos) || 0);

    // Validar que al menos un método de pago tenga valor
    if (total <= 0) {
      alert('Debe ingresar al menos un método de pago');
      return;
    }

    // Asegurarse de que todos los valores numéricos sean números válidos
    const validatedData = {
      ...formData,
      yape: parseFloat(formData.yape) || 0,
      efectivo: parseFloat(formData.efectivo) || 0,
      gastosImprevistos: parseFloat(formData.gastosImprevistos) || 0,
      descripcion: formData.descripcion.trim()
    };

    console.log('Datos del formulario validados:', validatedData);
    onSubmit(validatedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="text-green-600" />
            Procesar Pago
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto Total de la Venta
            </label>
            <input
              type="text"
              value={`S/. ${venta.montoTotal.toFixed(2)}`}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yape
            </label>
            <input
              type="number"
              name="yape"
              value={formData.yape}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Efectivo
            </label>
            <input
              type="number"
              name="efectivo"
              value={formData.efectivo}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gastos Imprevistos
            </label>
            <input
              type="number"
              name="gastosImprevistos"
              value={formData.gastosImprevistos}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>          {/* Resumen del cálculo */}
          <div className="bg-gray-50 p-3 rounded-md border">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Resumen del pago:</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Yape:</span>
                <span>S/. {(parseFloat(formData.yape) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Efectivo:</span>
                <span>S/. {(parseFloat(formData.efectivo) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos Imprevistos:</span>
                <span>S/. {(parseFloat(formData.gastosImprevistos) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1 text-lg">
                <span>Monto a pagar:</span>
                <span className="text-green-600">S/. {((parseFloat(formData.yape) || 0) + (parseFloat(formData.efectivo) || 0) + (parseFloat(formData.gastosImprevistos) || 0)).toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
                <div className="flex justify-between">
                  <span>Monto total de la venta:</span>
                  <span>S/. {venta.montoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saldo pendiente después del pago:</span>
                  <span>S/. {Math.max(0, venta.montoTotal - ((parseFloat(formData.yape) || 0) + (parseFloat(formData.efectivo) || 0) + (parseFloat(formData.gastosImprevistos) || 0))).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Procesar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
