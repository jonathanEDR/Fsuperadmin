import React, { useState } from 'react';
import { Loader2, Scale, Plus, Minus, Factory, RefreshCw, Package, AlertTriangle } from 'lucide-react';
import { materialService } from '../../../services/materialService';

const AjusteMaterial = ({ material, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    tipoOperacion: 'ajustar', // 'ajustar', 'consumir', 'restaurar', 'agregar'
    cantidad: '',
    motivo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const disponible = material.cantidad - material.consumido;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cantidad || !formData.motivo.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    const cantidad = parseFloat(formData.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      setError('La cantidad debe ser un número positivo');
      return;
    }

    // Validaciones específicas por tipo de operación
    if (formData.tipoOperacion === 'consumir' && cantidad > disponible) {
      setError(`No hay suficiente stock. Disponible: ${disponible}`);
      return;
    }

    if (formData.tipoOperacion === 'restaurar' && cantidad > material.consumido) {
      setError(`No se puede restaurar más de lo consumido: ${material.consumido}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      switch (formData.tipoOperacion) {
        case 'ajustar':
          await materialService.actualizarCantidad(material._id, cantidad, formData.motivo);
          break;
        case 'consumir':
          await materialService.consumirMaterial(material._id, cantidad, formData.motivo);
          break;
        case 'restaurar':
          await materialService.restaurarMaterial(material._id, cantidad, formData.motivo);
          break;
        case 'agregar':
          await materialService.agregarStock(material._id, cantidad, formData.motivo);
          break;
        default:
          // Ajuste relativo
          const ajuste = formData.tipoOperacion === 'sumar' ? cantidad : -cantidad;
          await materialService.ajustarInventario(material._id, ajuste, formData.motivo);
      }

      onGuardar();
    } catch (error) {
      console.error('Error al ajustar material:', error);
      setError(error.response?.data?.message || error.message || 'Error al ajustar el material');
    } finally {
      setLoading(false);
    }
  };

  const operaciones = [
    {
      value: 'ajustar',
      label: 'Ajustar Cantidad Total',
      description: 'Establecer la cantidad total exacta',
      icon: <Scale size={18} />
    },
    {
      value: 'sumar',
      label: 'Sumar al Inventario',
      description: 'Agregar cantidad al stock actual',
      icon: <Plus size={18} />
    },
    {
      value: 'restar',
      label: 'Restar del Inventario',
      description: 'Quitar cantidad del stock actual',
      icon: <Minus size={18} />
    },
    {
      value: 'consumir',
      label: 'Consumir Material',
      description: 'Marcar como consumido en producción',
      icon: <Factory size={18} />
    },
    {
      value: 'restaurar',
      label: 'Restaurar Material',
      description: 'Devolver material consumido al inventario',
      icon: <RefreshCw size={18} />
    },
    {
      value: 'agregar',
      label: 'Entrada de Stock',
      description: 'Agregar nueva entrada de material',
      icon: <Package size={18} />
    }
  ];

  const getResultadoEsperado = () => {
    if (!formData.cantidad) return null;

    const cantidad = parseFloat(formData.cantidad);
    if (isNaN(cantidad)) return null;

    switch (formData.tipoOperacion) {
      case 'ajustar':
        return `Total: ${cantidad}, Disponible: ${cantidad - material.consumido}`;
      case 'sumar':
        return `Total: ${material.cantidad + cantidad}, Disponible: ${disponible + cantidad}`;
      case 'restar':
        const nuevoTotal = material.cantidad - cantidad;
        return `Total: ${nuevoTotal}, Disponible: ${nuevoTotal - material.consumido}`;
      case 'consumir':
        return `Consumido: ${material.consumido + cantidad}, Disponible: ${disponible - cantidad}`;
      case 'restaurar':
        return `Consumido: ${material.consumido - cantidad}, Disponible: ${disponible + cantidad}`;
      case 'agregar':
        return `Total: ${material.cantidad + cantidad}, Disponible: ${disponible + cantidad}`;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border border-gray-100 w-11/12 md:w-2/3 lg:w-1/2 xl:w-1/3 shadow-xl rounded-2xl bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ajustar Inventario - {material.nombre}
          </h3>

          {/* Estado Actual */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Estado Actual</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Cantidad Total:</span>
                <span className="font-medium ml-2">{material.cantidad}</span>
              </div>
              <div>
                <span className="text-gray-600">Consumido:</span>
                <span className="font-medium ml-2">{material.consumido}</span>
              </div>
              <div>
                <span className="text-gray-600">Disponible:</span>
                <span className="font-medium ml-2 text-green-600">{disponible}</span>
              </div>
              <div>
                <span className="text-gray-600">Unidad:</span>
                <span className="font-medium ml-2">{material.unidadMedida}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Operación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Operación *
              </label>
              <div className="space-y-2">
                {operaciones.map((operacion) => (
                  <label
                    key={operacion.value}
                    className={`border rounded-xl p-3 cursor-pointer transition-colors flex items-start space-x-3 ${
                      formData.tipoOperacion === operacion.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={operacion.value}
                      checked={formData.tipoOperacion === operacion.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipoOperacion: e.target.value }))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-500">{operacion.icon}</span>
                        <span className="font-medium">{operacion.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{operacion.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {/* Resultado Esperado */}
            {getResultadoEsperado() && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <h4 className="font-medium text-blue-800 mb-1">Resultado Esperado:</h4>
                <p className="text-sm text-blue-700">{getResultadoEsperado()}</p>
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo *
              </label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
                placeholder="Descripción del motivo del ajuste..."
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertTriangle size={16} className="flex-shrink-0" /> {error}
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancelar}
                className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : 'Confirmar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AjusteMaterial;
