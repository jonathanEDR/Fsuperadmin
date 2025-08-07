import React, { memo, useCallback } from 'react';

/**
 * Componente optimizado para método de pago
 * Memoizado para evitar re-renders innecesarios
 */
const EgresoMetodoPago = memo(({ 
    formData, 
    metodosPago,
    cuentasBancarias,
    tieneCuentasBancarias,
    onInputChange,
    onNestedChange,
    className = ""
}) => {
    console.log('🔄 [EgresoMetodoPago] Render');

    // Memoizar handler para cambio de tipo de método de pago
    const handleTipoChange = useCallback((nuevoTipo) => {
        onNestedChange('metodoPago.tipo', nuevoTipo);
        
        // Limpiar campos específicos al cambiar tipo
        if (nuevoTipo === 'efectivo') {
            onInputChange('cuentaBancariaId', '');
            onNestedChange('metodoPago.detalles.numeroOperacion', '');
            onNestedChange('metodoPago.detalles.cuentaOrigen', '');
            onNestedChange('metodoPago.detalles.banco', '');
        }
    }, [onNestedChange, onInputChange]);

    const esBancario = formData.metodoPago.tipo !== 'efectivo';

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                💳 Método de Pago
            </h3>
            
            {/* Selector de método de pago */}
            <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Tipo de Pago *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {metodosPago.map((metodo) => (
                        <button
                            key={metodo.value}
                            type="button"
                            onClick={() => handleTipoChange(metodo.value)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                                formData.metodoPago.tipo === metodo.value
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                        >
                            <span className="text-lg">{metodo.icon}</span>
                            <span className="font-medium text-sm">{metodo.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Campos específicos para métodos bancarios */}
            {esBancario && (
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 flex items-center">
                        🏦 Información Bancaria
                    </h4>
                    
                    {/* Cuenta bancaria si hay cuentas disponibles */}
                    {tieneCuentasBancarias && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Cuenta Bancaria
                            </label>
                            <select
                                value={formData.cuentaBancariaId}
                                onChange={(e) => onInputChange('cuentaBancariaId', e.target.value)}
                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccionar cuenta (opcional)</option>
                                {cuentasBancarias.map((cuenta) => (
                                    <option key={cuenta.id} value={cuenta.id}>
                                        {cuenta.nombre} - {cuenta.banco} ({cuenta.moneda})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-600 mt-1">
                                Si selecciona una cuenta, el movimiento afectará el saldo bancario
                            </p>
                        </div>
                    )}

                    {/* Campos para transferencia/yape/plin */}
                    {(formData.metodoPago.tipo === 'transferencia' || 
                      formData.metodoPago.tipo === 'yape' || 
                      formData.metodoPago.tipo === 'plin') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Número de Operación
                                </label>
                                <input
                                    type="text"
                                    value={formData.metodoPago.detalles.numeroOperacion}
                                    onChange={(e) => onNestedChange('metodoPago.detalles.numeroOperacion', e.target.value)}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Número de operación"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {formData.metodoPago.tipo === 'transferencia' ? 'Banco' : 'Teléfono'}
                                </label>
                                <input
                                    type="text"
                                    value={formData.metodoPago.detalles.banco}
                                    onChange={(e) => onNestedChange('metodoPago.detalles.banco', e.target.value)}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={formData.metodoPago.tipo === 'transferencia' ? 'Nombre del banco' : 'Número de teléfono'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Campo específico para tarjeta */}
                    {formData.metodoPago.tipo === 'tarjeta' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Últimos 4 dígitos
                            </label>
                            <input
                                type="text"
                                maxLength="4"
                                value={formData.metodoPago.detalles.numeroOperacion}
                                onChange={(e) => onNestedChange('metodoPago.detalles.numeroOperacion', e.target.value)}
                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1234"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

EgresoMetodoPago.displayName = 'EgresoMetodoPago';

export default EgresoMetodoPago;
