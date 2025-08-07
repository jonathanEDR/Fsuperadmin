import React from 'react';

/**
 * Componente memoizado para mostrar resumen de efectivo en ingresos
 * Calcula y muestra totales, cambio a devolver, etc.
 */
const IngresoResumenEfectivo = React.memo(({ 
    resumen, 
    montoVenta, 
    cambio = 0 
}) => {
    
    const { totalBilletes, totalMonedas, totalGeneral, cantidadItems } = resumen;
    const diferencia = totalGeneral - montoVenta;
    const esPagoExacto = Math.abs(diferencia) < 0.01;
    const esPagoInsuficiente = diferencia < -0.01;
    const hayVuelto = diferencia > 0.01;
    
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            
            {/* TOTALES POR TIPO */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <span className="text-gray-600">Total Billetes:</span>
                    <div className="font-medium">S/ {totalBilletes.toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                    <span className="text-gray-600">Total Monedas:</span>
                    <div className="font-medium">S/ {totalMonedas.toFixed(2)}</div>
                </div>
            </div>
            
            {/* TOTAL GENERAL */}
            <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total Efectivo:</span>
                    <span className="text-lg font-bold text-blue-600">
                        S/ {totalGeneral.toFixed(2)}
                    </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    {cantidadItems} items en total
                </div>
            </div>
            
            {/* COMPARACIÓN CON MONTO DE VENTA */}
            {montoVenta > 0 && (
                <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monto de venta:</span>
                        <span className="font-medium">S/ {montoVenta.toFixed(2)}</span>
                    </div>
                    
                    {/* ESTADO DEL PAGO */}
                    <div className={`
                        flex justify-between items-center p-2 rounded
                        ${esPagoExacto ? 'bg-green-100 text-green-800' : ''}
                        ${esPagoInsuficiente ? 'bg-red-100 text-red-800' : ''}
                        ${hayVuelto ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}>
                        {esPagoExacto && (
                            <>
                                <span className="font-medium">✓ Pago exacto</span>
                                <span>Sin vuelto</span>
                            </>
                        )}
                        
                        {esPagoInsuficiente && (
                            <>
                                <span className="font-medium">⚠️ Pago insuficiente</span>
                                <span className="font-bold">
                                    Faltan: S/ {Math.abs(diferencia).toFixed(2)}
                                </span>
                            </>
                        )}
                        
                        {hayVuelto && (
                            <>
                                <span className="font-medium">💰 Cambio a devolver:</span>
                                <span className="font-bold text-lg">
                                    S/ {cambio.toFixed(2)}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}
            
        </div>
    );
});

IngresoResumenEfectivo.displayName = 'IngresoResumenEfectivo';

export { IngresoResumenEfectivo };
