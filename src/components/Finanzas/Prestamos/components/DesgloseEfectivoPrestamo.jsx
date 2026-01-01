import React, { useMemo } from 'react';
import { Minus, Plus, AlertCircle } from 'lucide-react';

/**
 * Componente de desglose de efectivo para préstamos otorgados
 * Muestra el efectivo disponible en caja y permite seleccionar la cantidad a retirar
 * Similar al usado en ModalEgresoFinanzas pero adaptado para préstamos
 */
const DesgloseEfectivoPrestamo = ({
    desglose,
    saldoCaja,
    onDesgloseChange,
    loading = false,
    totalDisponible = 0,
    montoAPagar = 0
}) => {
    // Calcular total del desglose
    const totalDesglose = useMemo(() => {
        const { billetes, monedas } = desglose;
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

    // Función para manejar cambios en el desglose
    const handleDesgloseChange = (tipo, key, accion) => {
        const disponible = saldoCaja?.[tipo]?.[key] || 0;
        const actual = desglose?.[tipo]?.[key] || 0;
        
        let nuevoValor;
        if (accion === 'add') {
            // Incrementar (retirar más)
            if (actual < disponible) {
                nuevoValor = actual + 1;
            } else {
                return; // No se puede retirar más de lo disponible
            }
        } else {
            // Decrementar (retirar menos)
            nuevoValor = Math.max(0, actual - 1);
        }

        onDesgloseChange(tipo, key, nuevoValor);
    };

    // Auto-distribuir el monto
    const autoDistribuir = () => {
        if (!montoAPagar || montoAPagar <= 0) return;

        let restante = parseFloat(montoAPagar);
        const nuevoDesglose = {
            billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
            monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
        };

        // Billetes primero
        for (const { key, valor } of billetes) {
            const disponible = saldoCaja?.billetes?.[key] || 0;
            if (restante >= valor && disponible > 0) {
                const cantidadNecesaria = Math.floor(restante / valor);
                const cantidadUsar = Math.min(cantidadNecesaria, disponible);
                nuevoDesglose.billetes[key] = cantidadUsar;
                restante -= cantidadUsar * valor;
            }
        }

        // Monedas después
        for (const { key, valor } of monedas) {
            const disponible = saldoCaja?.monedas?.[key] || 0;
            restante = Math.round(restante * 100) / 100;
            if (restante >= valor && disponible > 0) {
                const cantidadNecesaria = Math.floor(restante / valor);
                const cantidadUsar = Math.min(cantidadNecesaria, disponible);
                nuevoDesglose.monedas[key] = cantidadUsar;
                restante -= cantidadUsar * valor;
                restante = Math.round(restante * 100) / 100;
            }
        }

        // Notificar cambios
        Object.entries(nuevoDesglose.billetes).forEach(([key, valor]) => {
            onDesgloseChange('billetes', key, valor);
        });
        Object.entries(nuevoDesglose.monedas).forEach(([key, valor]) => {
            onDesgloseChange('monedas', key, valor);
        });

        if (restante > 0.01) {
            alert(`⚠️ No hay suficiente efectivo en caja. Faltan S/ ${restante.toFixed(2)} para completar el monto.`);
        }
    };

    // Limpiar desglose
    const limpiarDesglose = () => {
        Object.keys(desglose.billetes).forEach(key => {
            onDesgloseChange('billetes', key, 0);
        });
        Object.keys(desglose.monedas).forEach(key => {
            onDesgloseChange('monedas', key, 0);
        });
    };

    // Diferencia entre monto solicitado y desglose
    const diferencia = montoAPagar - totalDesglose;
    const hayDiferencia = Math.abs(diferencia) > 0.01;

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando saldo de caja...</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
            {/* Header con totales */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center">
                    <span className="mr-2">💸</span> Desglose de Efectivo
                </h3>
                <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow">
                    A Entregar: S/ {totalDesglose.toFixed(2)}
                </div>
            </div>

            {/* Resumen de caja */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-blue-100 rounded-lg p-2">
                    <span className="text-xs text-blue-600 font-medium">En Caja</span>
                    <p className="text-sm font-bold text-blue-800">S/ {totalDisponible.toFixed(2)}</p>
                </div>
                <div className="bg-orange-100 rounded-lg p-2">
                    <span className="text-xs text-orange-600 font-medium">A Prestar</span>
                    <p className="text-sm font-bold text-orange-800">S/ {montoAPagar.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 rounded-lg p-2">
                    <span className="text-xs text-green-600 font-medium">Quedará</span>
                    <p className="text-sm font-bold text-green-800">S/ {(totalDisponible - totalDesglose).toFixed(2)}</p>
                </div>
            </div>

            {/* Alerta de diferencia */}
            {hayDiferencia && montoAPagar > 0 && (
                <div className={`mb-3 p-2 rounded-lg flex items-center gap-2 ${diferencia > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    <AlertCircle size={16} />
                    <span className="text-xs font-medium">
                        {diferencia > 0 
                            ? `Faltan S/ ${diferencia.toFixed(2)} por asignar`
                            : `Se excede S/ ${Math.abs(diferencia).toFixed(2)} del monto`
                        }
                    </span>
                </div>
            )}

            {/* Botones de acción rápida */}
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={autoDistribuir}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    disabled={!montoAPagar || montoAPagar <= 0}
                >
                    🔄 Auto-distribuir
                </button>
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
                    <div className="flex gap-2 text-xs">
                        <span className="text-blue-600">Disp: {Object.values(saldoCaja?.billetes || {}).reduce((a, b) => a + b, 0)}</span>
                        <span className="text-green-600">Usar: {Object.values(desglose?.billetes || {}).reduce((a, b) => a + b, 0)}</span>
                    </div>
                </div>
                <div className="space-y-1.5">
                    {billetes.map(billete => {
                        const disponible = saldoCaja?.billetes?.[billete.key] || 0;
                        const aRetirar = desglose?.billetes?.[billete.key] || 0;
                        const quedara = disponible - aRetirar;
                        const sinStock = disponible === 0;
                        
                        return (
                            <div key={billete.key} className={`flex items-center justify-between bg-white p-2 rounded-lg shadow-sm ${sinStock ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`${billete.color} text-white px-2 py-0.5 rounded text-xs font-bold min-w-[50px] text-center`}>
                                        {billete.label}
                                    </span>
                                    <span className="text-xs text-blue-600 font-medium" title="Disponible">
                                        📦{disponible}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleDesgloseChange('billetes', billete.key, 'subtract')}
                                        className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-40"
                                        disabled={aRetirar === 0}
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className={`w-8 text-center font-bold text-sm ${aRetirar > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {aRetirar}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDesgloseChange('billetes', billete.key, 'add')}
                                        className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-40"
                                        disabled={sinStock || aRetirar >= disponible}
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 min-w-[70px] justify-end">
                                    <span className={`text-xs font-semibold ${quedara >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        →{quedara}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        S/{(aRetirar * billete.valor).toFixed(0)}
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
                    <div className="flex gap-2 text-xs">
                        <span className="text-blue-600">Disp: {Object.values(saldoCaja?.monedas || {}).reduce((a, b) => a + b, 0)}</span>
                        <span className="text-green-600">Usar: {Object.values(desglose?.monedas || {}).reduce((a, b) => a + b, 0)}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                    {monedas.map(moneda => {
                        const disponible = saldoCaja?.monedas?.[moneda.key] || 0;
                        const aRetirar = desglose?.monedas?.[moneda.key] || 0;
                        const quedara = disponible - aRetirar;
                        const sinStock = disponible === 0;
                        
                        return (
                            <div key={moneda.key} className={`flex items-center justify-between bg-white p-1.5 rounded-lg shadow-sm ${sinStock ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-1">
                                    <span className={`${moneda.color} text-white px-1.5 py-0.5 rounded text-xs font-bold min-w-[45px] text-center`}>
                                        {moneda.label}
                                    </span>
                                    <span className="text-xs text-blue-600" title="Disponible">
                                        {disponible}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleDesgloseChange('monedas', moneda.key, 'subtract')}
                                        className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-40"
                                        disabled={aRetirar === 0}
                                    >
                                        <Minus size={10} />
                                    </button>
                                    <span className={`w-5 text-center font-bold text-xs ${aRetirar > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {aRetirar}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDesgloseChange('monedas', moneda.key, 'add')}
                                        className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-40"
                                        disabled={sinStock || aRetirar >= disponible}
                                    >
                                        <Plus size={10} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Verificación de saldo */}
            {totalDesglose > totalDisponible && (
                <div className="mt-3 p-2 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span className="text-xs font-medium">
                        ¡No hay suficiente efectivo en caja!
                    </span>
                </div>
            )}
        </div>
    );
};

export default DesgloseEfectivoPrestamo;
