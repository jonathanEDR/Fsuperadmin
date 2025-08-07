import React from 'react';

/**
 * Componente optimizado para selector de denominaciones de efectivo en ingresos
 * Memoizado para evitar re-renders cuando cambian otros campos
 */
const IngresoEfectivoSelector = React.memo(({ 
    denominaciones, 
    valores, 
    onChange, 
    error = false 
}) => {
    
    const handleDenominacionChange = (tipo, denominacion, cantidad) => {
        onChange(tipo, denominacion, cantidad);
    };
    
    const renderDenominacionGroup = (tipo, items) => (
        <div key={tipo} className="space-y-3">
            <h4 className="font-medium text-gray-700 capitalize">
                {tipo === 'billetes' ? 'Billetes' : 'Monedas'}
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map(item => {
                    const cantidad = valores[tipo]?.[item.key] || 0;
                    
                    return (
                        <div key={item.key} className="space-y-1">
                            <label className="text-sm text-gray-600">
                                {item.label}
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={cantidad}
                                    onChange={(e) => handleDenominacionChange(
                                        tipo, 
                                        item.key, 
                                        e.target.value
                                    )}
                                    className={`
                                        w-16 px-2 py-1 border rounded text-center text-sm
                                        ${error ? 'border-red-500' : 'border-gray-300'}
                                        focus:ring-2 focus:ring-green-500 focus:border-green-500
                                    `}
                                    placeholder="0"
                                />
                                <span className="text-xs text-gray-500">
                                    = S/ {(cantidad * item.valor).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    
    return (
        <div className={`
            space-y-6 p-4 rounded-lg border-2
            ${error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}
        `}>
            {renderDenominacionGroup('billetes', denominaciones.billetes)}
            {renderDenominacionGroup('monedas', denominaciones.monedas)}
            
            {error && (
                <div className="text-sm text-red-600 font-medium">
                    ⚠️ El desglose de efectivo no coincide con el monto del ingreso
                </div>
            )}
        </div>
    );
});

IngresoEfectivoSelector.displayName = 'IngresoEfectivoSelector';

export { IngresoEfectivoSelector };
