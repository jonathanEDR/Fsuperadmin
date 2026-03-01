import React, { memo, useCallback, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

/**
 * Componente optimizado para desglose de efectivo
 * Memoizado para evitar re-renders innecesarios
 */
const EgresoDesgloseEfectivo = memo(({ 
    formData, 
    denominaciones,
    totalCalculado,
    diferenciaMonto,
    tieneErrorDesglose,
    resumenEfectivo,
    onBilleteMonedaChange,
    onAutoCompletarMonto,
    className = ""
}) => {
    console.log('🔄 [EgresoDesgloseEfectivo] Render');

    // Auto-completar monto cuando cambie el total calculado
    useEffect(() => {
        onAutoCompletarMonto();
    }, [onAutoCompletarMonto]);

    // Memoizar handler para incrementar/decrementar
    const handleIncrement = useCallback((tipo, denominacion) => {
        onBilleteMonedaChange(tipo, denominacion, 'add');
    }, [onBilleteMonedaChange]);

    const handleDecrement = useCallback((tipo, denominacion) => {
        onBilleteMonedaChange(tipo, denominacion, 'subtract');
    }, [onBilleteMonedaChange]);

    if (formData.metodoPago.tipo !== 'efectivo') {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                💵 Desglose de Efectivo
            </h3>

            {/* Resumen y estado */}
            <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Total Calculado:</span>
                    <span className="font-bold text-lg text-green-600">
                        S/ {totalCalculado.toFixed(2)}
                    </span>
                </div>
                
                {tieneErrorDesglose && (
                    <div className="bg-red-100 border border-red-200 rounded p-3 mt-2">
                        <p className="text-red-700 text-sm">
                            ⚠️ Diferencia de S/ {diferenciaMonto.toFixed(2)} 
                            entre el monto ingresado y el desglose de efectivo
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4 mt-3 text-sm text-gray-600">
                    <div>
                        <span className="font-medium">Billetes:</span> S/ {resumenEfectivo.totalBilletes.toFixed(2)}
                    </div>
                    <div>
                        <span className="font-medium">Monedas:</span> S/ {resumenEfectivo.totalMonedas.toFixed(2)}
                    </div>
                    <div>
                        <span className="font-medium">Items:</span> {resumenEfectivo.cantidadItems}
                    </div>
                </div>
            </div>

            {/* Billetes */}
            <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    📄 Billetes
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {denominaciones.billetes.map((denom) => {
                        const cantidad = formData.metodoPago.detalles.billetes[denom.key] || 0;
                        const subtotal = cantidad * denom.valor;
                        
                        return (
                            <div key={denom.key} className="bg-white border border-gray-200 rounded-xl p-3">
                                <div className="text-center mb-2">
                                    <div className="font-semibold text-gray-800">{denom.label}</div>
                                    <div className="text-xs text-gray-500">
                                        Subtotal: S/ {subtotal.toFixed(2)}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => handleDecrement('billetes', denom.key)}
                                        className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                                        disabled={cantidad === 0}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    
                                    <span className="font-bold text-lg min-w-[2rem] text-center">
                                        {cantidad}
                                    </span>
                                    
                                    <button
                                        type="button"
                                        onClick={() => handleIncrement('billetes', denom.key)}
                                        className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Monedas */}
            <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    🪙 Monedas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {denominaciones.monedas.map((denom) => {
                        const cantidad = formData.metodoPago.detalles.monedas[denom.key] || 0;
                        const subtotal = cantidad * denom.valor;
                        
                        return (
                            <div key={denom.key} className="bg-white border border-gray-200 rounded-xl p-3">
                                <div className="text-center mb-2">
                                    <div className="font-semibold text-gray-800 text-sm">{denom.label}</div>
                                    <div className="text-xs text-gray-500">
                                        S/ {subtotal.toFixed(2)}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => handleDecrement('monedas', denom.key)}
                                        className="w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                                        disabled={cantidad === 0}
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    
                                    <span className="font-bold text-sm min-w-[1.5rem] text-center">
                                        {cantidad}
                                    </span>
                                    
                                    <button
                                        type="button"
                                        onClick={() => handleIncrement('monedas', denom.key)}
                                        className="w-7 h-7 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

EgresoDesgloseEfectivo.displayName = 'EgresoDesgloseEfectivo';

export default EgresoDesgloseEfectivo;
