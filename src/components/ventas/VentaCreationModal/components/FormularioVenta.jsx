import React from 'react';
import { User, CreditCard, FileText, DollarSign } from 'lucide-react';

/**
 * FormularioVenta - Formulario de datos de la venta
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.formData - Datos del formulario
 * @param {Function} props.onFormChange - Callback para cambios en el formulario
 * @param {Array} props.usuarios - Lista de usuarios disponibles
 * @param {boolean} props.loadingUsuarios - Estado de carga de usuarios
 * @param {Object} props.errores - Objeto con errores de validación
 * 
 * @example
 * <FormularioVenta
 *   formData={ventaData}
 *   onFormChange={handleChange}
 *   usuarios={clientesData}
 *   loadingUsuarios={false}
 *   errores={{}}
 * />
 */
const FormularioVenta = React.memo(({
  formData = {},
  onFormChange,
  usuarios = [],
  loadingUsuarios = false,
  errores = {}
}) => {
  const metodoPagoOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'mixto', label: 'Mixto' }
  ];

  const handleChange = (field, value) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User size={16} className="inline mr-1" />
          Cliente *
        </label>
        
        {loadingUsuarios ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Cargando clientes...</span>
          </div>
        ) : (
          <select
            value={formData.targetUserId || formData.clienteId || ''}
            onChange={(e) => handleChange('targetUserId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errores.targetUserId || errores.clienteId ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Seleccionar cliente...</option>
            {usuarios.map((usuario) => (
              <option key={usuario._id} value={usuario._id}>
                {usuario.firstName} {usuario.lastName}
                {usuario.email && ` (${usuario.email})`}
              </option>
            ))}
          </select>
        )}
        
        {(errores.targetUserId || errores.clienteId) && (
          <p className="text-red-500 text-xs mt-1">⚠️ {errores.targetUserId || errores.clienteId}</p>
        )}
      </div>

      {/* Método de Pago */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CreditCard size={16} className="inline mr-1" />
          Método de Pago *
        </label>
        
        <select
          value={formData.metodoPago || 'efectivo'}
          onChange={(e) => handleChange('metodoPago', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errores.metodoPago ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          required
        >
          {metodoPagoOptions.map((metodo) => (
            <option key={metodo.value} value={metodo.value}>
              {metodo.label}
            </option>
          ))}
        </select>
        
        {errores.metodoPago && (
          <p className="text-red-500 text-xs mt-1">⚠️ {errores.metodoPago}</p>
        )}
      </div>

      {/* Monto Pagado (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DollarSign size={16} className="inline mr-1" />
          Monto Pagado (opcional)
        </label>
        
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.montoPagado || ''}
          onChange={(e) => handleChange('montoPagado', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errores.montoPagado ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
        />
        
        {errores.montoPagado && (
          <p className="text-red-500 text-xs mt-1">⚠️ {errores.montoPagado}</p>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Dejar en blanco si el pago es completo
        </p>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText size={16} className="inline mr-1" />
          Notas (opcional)
        </label>
        
        <textarea
          value={formData.notas || ''}
          onChange={(e) => handleChange('notas', e.target.value)}
          placeholder="Información adicional sobre la venta..."
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
            errores.notas ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          maxLength={500}
        />
        
        {formData.notas && (
          <p className="text-xs text-gray-500 mt-1">
            {formData.notas.length}/500 caracteres
          </p>
        )}
        
        {errores.notas && (
          <p className="text-red-500 text-xs mt-1">⚠️ {errores.notas}</p>
        )}
      </div>

      {/* Resumen de validación */}
      {Object.keys(errores).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm font-medium">
            ⚠️ Por favor corrige los errores antes de continuar
          </p>
        </div>
      )}
    </div>
  );
});

FormularioVenta.displayName = 'FormularioVenta';

export default FormularioVenta;
