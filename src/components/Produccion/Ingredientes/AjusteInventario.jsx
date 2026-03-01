import React, { useState } from 'react';
import { X, Scale, Loader2, AlertTriangle, Eye } from 'lucide-react';
import { ingredienteService } from '../../../services/ingredienteService';

const AjusteInventario = ({ ingrediente, onGuardar, onCancelar }) => {
  const [tipoAjuste, setTipoAjuste] = useState('ajustar'); // 'ajustar' o 'establecer'
  const [valor, setValor] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const disponible = ingrediente.cantidad - ingrediente.procesado;

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!motivo.trim()) {
      nuevosErrores.motivo = 'El motivo es requerido';
    }

    if (tipoAjuste === 'ajustar') {
      if (valor === 0) {
        nuevosErrores.valor = 'El ajuste no puede ser cero';
      }
      if (valor < 0 && Math.abs(valor) > disponible) {
        nuevosErrores.valor = 'No se puede retirar más cantidad de la disponible';
      }
    } else {
      if (valor < 0) {
        nuevosErrores.valor = 'La cantidad no puede ser negativa';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);
    try {
      if (tipoAjuste === 'ajustar') {
        await ingredienteService.ajustarInventario(ingrediente._id, valor, motivo);
      } else {
        await ingredienteService.actualizarCantidad(ingrediente._id, valor, motivo);
      }
      onGuardar();
    } catch (error) {
      setErrores({ general: 'Error al realizar el ajuste: ' + error.message });
    } finally {
      setEnviando(false);
    }
  };

  const calcularNuevaCantidad = () => {
    if (tipoAjuste === 'ajustar') {
      return ingrediente.cantidad + valor;
    } else {
      return valor;
    }
  };

  const calcularNuevoDisponible = () => {
    const nuevaCantidad = calcularNuevaCantidad();
    return nuevaCantidad - ingrediente.procesado;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto w-11/12 md:w-1/2 lg:w-1/3 rounded-2xl shadow-xl border border-gray-100 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg border border-green-200">
              <Scale size={18} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ajustar Inventario - {ingrediente.nombre}
            </h3>
          </div>
          <button onClick={onCancelar} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Información actual */}
          <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100 mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Estado Actual:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Cantidad Total:</span>
                <span className="ml-2 font-medium">{ingrediente.cantidad} {ingrediente.unidadMedida}</span>
              </div>
              <div>
                <span className="text-gray-600">Procesado:</span>
                <span className="ml-2 font-medium">{ingrediente.procesado} {ingrediente.unidadMedida}</span>
              </div>
              <div>
                <span className="text-gray-600">Disponible:</span>
                <span className="ml-2 font-medium text-blue-600">{disponible} {ingrediente.unidadMedida}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {errores.general && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errores.general}
              </div>
            )}

            <div className="space-y-4">
              {/* Tipo de Ajuste */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ajuste
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="ajustar"
                      checked={tipoAjuste === 'ajustar'}
                      onChange={(e) => setTipoAjuste(e.target.value)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Ajustar (+/-) - Sumar o restar cantidad
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="establecer"
                      checked={tipoAjuste === 'establecer'}
                      onChange={(e) => setTipoAjuste(e.target.value)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Establecer cantidad total
                    </span>
                  </label>
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tipoAjuste === 'ajustar' ? 'Ajuste' : 'Nueva Cantidad'} ({ingrediente.unidadMedida}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                    errores.valor ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder={tipoAjuste === 'ajustar' ? '+10 o -5' : '50'}
                />
                {errores.valor && (
                  <p className="mt-1 text-sm text-red-600">{errores.valor}</p>
                )}
                {tipoAjuste === 'ajustar' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Usa números positivos para agregar, negativos para retirar
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo *
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                    errores.motivo ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Describe el motivo del ajuste..."
                />
                {errores.motivo && (
                  <p className="mt-1 text-sm text-red-600">{errores.motivo}</p>
                )}
              </div>

              {/* Vista previa */}
              {valor !== 0 && (
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                  <h4 className="flex items-center gap-1.5 font-medium text-blue-700 mb-2"><Eye size={15} /> Vista Previa:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Nueva Cantidad Total:</span>
                      <span className="ml-2 font-medium">{calcularNuevaCantidad()} {ingrediente.unidadMedida}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Nuevo Disponible:</span>
                      <span className="ml-2 font-medium">{calcularNuevoDisponible()} {ingrediente.unidadMedida}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onCancelar}
                className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || valor === 0}
                className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {enviando ? <><Loader2 size={16} className="animate-spin" /> Aplicando...</> : 'Aplicar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AjusteInventario;
