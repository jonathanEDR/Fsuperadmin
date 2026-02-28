import React from 'react';
import { Save, X, Loader2, AlertCircle, Lightbulb } from 'lucide-react';

/**
 * BotonesAccion - Botones de acción del modal (Guardar/Cancelar)
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onGuardar - Callback para guardar venta
 * @param {Function} props.onCancelar - Callback para cancelar
 * @param {boolean} props.guardando - Estado de guardado en progreso
 * @param {boolean} props.deshabilitarGuardar - Deshabilitar botón guardar
 * @param {string} props.mensajeError - Mensaje de error global
 * @param {number} props.subtotal - Subtotal para mostrar en confirmación
 * 
 * @example
 * <BotonesAccion
 *   onGuardar={handleSubmit}
 *   onCancelar={handleClose}
 *   guardando={false}
 *   deshabilitarGuardar={!isValid}
 *   mensajeError={null}
 *   subtotal={150.50}
 * />
 */
const BotonesAccion = React.memo(({
  onGuardar,
  onCancelar,
  guardando = false,
  deshabilitarGuardar = false,
  mensajeError = null,
  subtotal = 0
}) => {
  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Mensaje de error global */}
      {mensajeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 flex items-start gap-1.5 sm:gap-2">
          <AlertCircle size={16} className="sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-red-700 font-medium text-xs sm:text-sm">Error al procesar la venta</p>
            <p className="text-red-600 text-xs sm:text-sm mt-0.5 sm:mt-1 break-words">{mensajeError}</p>
          </div>
        </div>
      )}

      {/* Estado de guardando */}
      {guardando && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
          <Loader2 size={16} className="sm:w-5 sm:h-5 text-yellow-600 animate-spin flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-yellow-900 font-medium text-xs sm:text-sm">Procesando venta...</p>
            <p className="text-yellow-700 text-[10px] sm:text-xs mt-0.5">
              Por favor espera, no cierres esta ventana
            </p>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 pt-1 sm:pt-2">
        {/* Botón Cancelar */}
        <button
          onClick={onCancelar}
          disabled={guardando}
          className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 min-w-[40px] sm:min-w-0 ${
            guardando
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
          }`}
          title="Cancelar"
        >
          <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden xs:inline">Cancelar</span>
        </button>

        {/* Botón Guardar */}
        <button
          onClick={onGuardar}
          disabled={deshabilitarGuardar || guardando}
          className={`px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
            deshabilitarGuardar || guardando
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100'
          }`}
          title={
            deshabilitarGuardar
              ? 'Completa todos los campos requeridos'
              : guardando
              ? 'Guardando...'
              : 'Guardar venta'
          }
        >
          {guardando ? (
            <>
              <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
              <span className="hidden xs:inline">Guardando...</span>
            </>
          ) : (
            <>
              <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden xs:inline">Guardar</span>
            </>
          )}
        </button>
      </div>

      {/* Ayuda contextual */}
      {deshabilitarGuardar && !guardando && (
        <p className="text-[10px] sm:text-xs text-gray-500 text-center flex items-center justify-center gap-1">
          <Lightbulb size={10} className="text-amber-500" /> Asegúrate de agregar productos y seleccionar un cliente
        </p>
      )}
    </div>
  );
});

BotonesAccion.displayName = 'BotonesAccion';

export default BotonesAccion;
