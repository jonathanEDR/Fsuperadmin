import React, { useMemo } from 'react';
import { Minus, Plus, AlertCircle } from 'lucide-react';

/**
 * Componente de desglose de efectivo para préstamos recibidos (INGRESO)
 * Permite registrar qué billetes y monedas ingresan a la caja
 * cuando recibes un préstamo en efectivo
 */
const DesgloseEfectivoIngreso = ({
    desglose,
    onDesgloseChange,
    loading = false,
    montoARecibir = 0
}) => {
    // Calcular total del desglose
    const totalDesglose = useMemo(() => {
        const { billetes, monedas } = desglose || { billetes: {}, monedas: {} };
        const totalBilletes =
            (billetes?.b200 || 0) * 200 +
            (billetes?.b100 || 0) * 100 +
            (billetes?.b50 || 0) * 50 +
            (billetes?.b20 || 0) * 20 +
            (billetes?.b10 || 0) * 10;
        const totalMonedas =
            (monedas?.m5 || 0) * 5 +
            (monedas?.m2 || 0) * 2 +
            (monedas?.m1 || 0) * 1 +
            (monedas?.c50 || 0) * 0.5 +
            (monedas?.c20 || 0) * 0.2 +
            (monedas?.c10 || 0) * 0.1;
        return totalBilletes + totalMonedas;
    }, [desglose]);

    // Configuración de billetes y monedas
    const billetes = [
        { key: 'b200', valor: 200, label: 'S/ 200', color: 'bg-purple-500' },
        { key: 'b100', valor: 100, label: 'S/ 100', color: 'bg-blue-500' },
        { key: 'b50', valor: 50, label: 'S/ 50', color: 'bg-orange-500' },
        { key: 'b20', valor: 20, label: 'S/ 20', color: 'bg-green-500' },
        { key: 'b10', valor: 10, label: 'S/ 10', color: 'bg-red-500' }
    ];

    const monedas = [
        { key: 'm5', valor: 5, label: '5 soles', color: 'bg-yellow-500' },
        { key: 'm2', valor: 2, label: '2 soles', color: 'bg-gray-500' },
        { key: 'm1', valor: 1, label: '1 sol', color: 'bg-yellow-400' },
        { key: 'c50', valor: 0.5, label: '0.50 ctv', color: 'bg-gray-400' },
        { key: 'c20', valor: 0.2, label: '0.20 ctv', color: 'bg-gray-400' },
        { key: 'c10', valor: 0.1, label: '0.10 ctv', color: 'bg-gray-400' }
    ];

    // Función para manejar cambios en el desglose - ahora acepta valor directo
    const handleDesgloseChange = (tipo, key, valorOAccion) => {
        let nuevoValor;
        
        // Si es un número, es un valor directo del input
        if (typeof valorOAccion === 'number') {
            nuevoValor = Math.max(0, Math.floor(valorOAccion));
        } else if (valorOAccion === 'add') {
            const actual = desglose?.[tipo]?.[key] || 0;
            nuevoValor = actual + 1;
        } else if (valorOAccion === 'subtract') {
            const actual = desglose?.[tipo]?.[key] || 0;
            nuevoValor = Math.max(0, actual - 1);
        } else {
            // Si es string (del input), convertir a número
            nuevoValor = Math.max(0, Math.floor(parseInt(valorOAccion) || 0));
        }

        onDesgloseChange(tipo, key, nuevoValor);
    };

    // Manejar cambio directo desde input
    const handleInputChange = (tipo, key, e) => {
        const valor = e.target.value;
        // Permitir campo vacío temporalmente (se tratará como 0)
        if (valor === '') {
            onDesgloseChange(tipo, key, 0);
        } else {
            const num = parseInt(valor, 10);
            if (!isNaN(num) && num >= 0) {
                onDesgloseChange(tipo, key, num);
            }
        }
    };

    // Limpiar desglose
    const limpiarDesglose = () => {
        Object.keys(desglose?.billetes || {}).forEach(key => {
            onDesgloseChange('billetes', key, 0);
        });
        Object.keys(desglose?.monedas || {}).forEach(key => {
            onDesgloseChange('monedas', key, 0);
        });
    };

    // Diferencia entre monto solicitado y desglose
    const diferencia = montoARecibir - totalDesglose;
    const hayDiferencia = Math.abs(diferencia) > 0.01;

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            {/* Header con totales */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center">
                    <span className="mr-2">💵</span> Desglose del Efectivo Recibido
                </h3>
                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow">
                    Ingresa: S/ {totalDesglose.toFixed(2)}
                </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                <div className="bg-indigo-100 rounded-lg p-2">
                    <span className="text-xs text-indigo-600 font-medium">Monto Préstamo</span>
                    <p className="text-sm font-bold text-indigo-800">S/ {montoARecibir.toFixed(2)}</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-2">
                    <span className="text-xs text-blue-600 font-medium">Efectivo a Ingresar</span>
                    <p className="text-sm font-bold text-blue-800">S/ {totalDesglose.toFixed(2)}</p>
                </div>
            </div>

            {/* Alerta de diferencia */}
            {hayDiferencia && montoARecibir > 0 && (
                <div className={`mb-3 p-2 rounded-lg flex items-center gap-2 ${diferencia > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    <AlertCircle size={16} />
                    <span className="text-xs font-medium">
                        {diferencia > 0 
                            ? `Faltan S/ ${diferencia.toFixed(2)} por registrar`
                            : `Se excede S/ ${Math.abs(diferencia).toFixed(2)} del monto`
                        }
                    </span>
                </div>
            )}

            {/* Botón de limpiar */}
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={limpiarDesglose}
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                    🗑️ Limpiar
                </button>
            </div>

            {/* Billetes */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">📄 Billetes</span>
                    <span className="text-xs text-blue-600 font-medium">
                        Total: {Object.values(desglose?.billetes || {}).reduce((a, b) => a + b, 0)} unidades
                    </span>
                </div>
                <div className="space-y-1.5">
                    {billetes.map(billete => {
                        const cantidad = desglose?.billetes?.[billete.key] || 0;
                        
                        return (
                            <div key={billete.key} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`${billete.color} text-white px-2 py-0.5 rounded text-xs font-bold min-w-[50px] text-center`}>
                                        {billete.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleDesgloseChange('billetes', billete.key, 'subtract')}
                                        className="w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-40"
                                        disabled={cantidad === 0}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cantidad}
                                        onChange={(e) => handleInputChange('billetes', billete.key, e)}
                                        className={`w-16 text-center font-bold text-sm border rounded-lg py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${cantidad > 0 ? 'text-blue-600 bg-blue-50 border-blue-300' : 'text-gray-400 border-gray-200'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleDesgloseChange('billetes', billete.key, 'add')}
                                        className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="min-w-[70px] text-right">
                                    <span className="text-xs text-gray-500">
                                        = S/ {(cantidad * billete.valor).toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Monedas */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">🪙 Monedas</span>
                    <span className="text-xs text-blue-600 font-medium">
                        Total: {Object.values(desglose?.monedas || {}).reduce((a, b) => a + b, 0)} unidades
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    {monedas.map(moneda => {
                        const cantidad = desglose?.monedas?.[moneda.key] || 0;
                        
                        return (
                            <div key={moneda.key} className="flex items-center justify-between bg-white p-1.5 rounded-lg shadow-sm">
                                <div className="flex items-center gap-1">
                                    <span className={`${moneda.color} text-white px-1.5 py-0.5 rounded text-xs font-bold min-w-[55px] text-center`}>
                                        {moneda.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleDesgloseChange('monedas', moneda.key, 'subtract')}
                                        className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-40"
                                        disabled={cantidad === 0}
                                    >
                                        <Minus size={10} />
                                    </button>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cantidad}
                                        onChange={(e) => handleInputChange('monedas', moneda.key, e)}
                                        className={`w-12 text-center font-bold text-xs border rounded-lg py-0.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${cantidad > 0 ? 'text-blue-600 bg-blue-50 border-blue-300' : 'text-gray-400 border-gray-200'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleDesgloseChange('monedas', moneda.key, 'add')}
                                        className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                                    >
                                        <Plus size={10} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Confirmación de coincidencia */}
            {!hayDiferencia && totalDesglose > 0 && (
                <div className="mt-3 p-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                    <span>✅</span>
                    <span className="text-xs font-medium">
                        El desglose coincide con el monto del préstamo
                    </span>
                </div>
            )}
        </div>
    );
};

export default DesgloseEfectivoIngreso;
