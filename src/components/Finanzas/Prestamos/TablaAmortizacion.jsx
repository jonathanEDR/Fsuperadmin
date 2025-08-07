import React, { useMemo } from 'react';

const TablaAmortizacion = ({ prestamo }) => {
    const tablaAmortizacion = useMemo(() => {
        if (!prestamo) return [];

        const monto = parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado || 0);
        const tasaAnual = parseFloat(prestamo.tasaInteres?.porcentaje || prestamo.tasaInteres || 0) / 100;
        const tasaMensual = tasaAnual / 12;
        const plazoMeses = parseInt(prestamo.plazoMeses || prestamo.plazo?.cantidad || prestamo.plazo || 0);
        
        if (monto === 0 || tasaAnual === 0 || plazoMeses === 0) {
            return [];
        }

        // Calcular cuota mensual usando fórmula de amortización francesa
        const cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                           (Math.pow(1 + tasaMensual, plazoMeses) - 1);

        const tabla = [];
        let saldoPendiente = monto;
        const fechaInicio = new Date(prestamo.fechaAprobacion || prestamo.fechaSolicitud || new Date());

        for (let i = 1; i <= plazoMeses; i++) {
            const interes = saldoPendiente * tasaMensual;
            const capital = cuotaMensual - interes;
            saldoPendiente = Math.max(0, saldoPendiente - capital);

            // Calcular fecha de pago
            const fechaPago = new Date(fechaInicio);
            fechaPago.setMonth(fechaPago.getMonth() + i);

            // Determinar estado del pago
            const hoy = new Date();
            let estadoPago = 'pendiente';
            if (fechaPago < hoy) {
                estadoPago = 'vencido';
            } else if (fechaPago.getTime() - hoy.getTime() <= 7 * 24 * 60 * 60 * 1000) {
                estadoPago = 'proximo';
            }

            tabla.push({
                cuota: i,
                fechaPago: fechaPago,
                capital: capital,
                interes: interes,
                cuotaMensual: cuotaMensual,
                saldoPendiente: saldoPendiente,
                estadoPago: estadoPago
            });
        }

        return tabla;
    }, [prestamo]);

    const formatearMoneda = (valor) => {
        return `S/ ${parseFloat(valor || 0).toLocaleString('es-PE', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        })}`;
    };

    const formatearFecha = (fecha) => {
        return fecha.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const obtenerEstiloEstado = (estado) => {
        switch (estado) {
            case 'vencido':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'proximo':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const obtenerIconoEstado = (estado) => {
        switch (estado) {
            case 'vencido':
                return '⚠️';
            case 'proximo':
                return '⏰';
            default:
                return '📅';
        }
    };

    const calcularTotales = () => {
        const totalCapital = tablaAmortizacion.reduce((sum, fila) => sum + fila.capital, 0);
        const totalIntereses = tablaAmortizacion.reduce((sum, fila) => sum + fila.interes, 0);
        const totalPagar = totalCapital + totalIntereses;

        return {
            totalCapital,
            totalIntereses,
            totalPagar
        };
    };

    const totales = calcularTotales();

    if (tablaAmortizacion.length === 0) {
        return (
            <div className="p-8 text-center">
                <span className="text-4xl mb-4 block">📊</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se puede generar la tabla de amortización
                </h3>
                <p className="text-gray-500">
                    Verifique que el préstamo tenga monto, tasa de interés y plazo definidos
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Resumen de Totales */}
            <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">📈 Resumen de Totales</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-sm text-blue-700">Capital Total</p>
                        <p className="text-lg font-bold text-green-600">{formatearMoneda(totales.totalCapital)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-blue-700">Intereses Total</p>
                        <p className="text-lg font-bold text-orange-600">{formatearMoneda(totales.totalIntereses)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-blue-700">Total a Pagar</p>
                        <p className="text-lg font-bold text-purple-600">{formatearMoneda(totales.totalPagar)}</p>
                    </div>
                </div>
            </div>

            {/* Tabla de Amortización */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cuota
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha Pago
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Capital
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Intereses
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cuota Mensual
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Saldo Pendiente
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tablaAmortizacion.map((fila, index) => (
                            <tr key={index} className={`hover:bg-gray-50 ${obtenerEstiloEstado(fila.estadoPago)}`}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        #{fila.cuota}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {formatearFecha(fila.fechaPago)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                    {formatearMoneda(fila.capital)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                                    {formatearMoneda(fila.interes)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                                    {formatearMoneda(fila.cuotaMensual)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                                    {formatearMoneda(fila.saldoPendiente)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${obtenerEstiloEstado(fila.estadoPago)}`}>
                                        {obtenerIconoEstado(fila.estadoPago)}
                                        <span className="ml-1 capitalize">
                                            {fila.estadoPago === 'proximo' ? 'Próximo' : fila.estadoPago}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                        <tr className="font-bold">
                            <td className="px-4 py-3 text-sm text-gray-900" colSpan="2">
                                TOTALES
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                {formatearMoneda(totales.totalCapital)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                {formatearMoneda(totales.totalIntereses)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                {formatearMoneda(totales.totalPagar)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                -
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                -
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Información adicional */}
            <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">ℹ️ Información Importante</h4>
                <div className="text-sm text-green-800 space-y-1">
                    <p>• <strong>Sistema de Amortización:</strong> Francés (cuotas fijas)</p>
                    <p>• <strong>Frecuencia de Pago:</strong> Mensual</p>
                    <p>• <strong>Tasa de Interés:</strong> {parseFloat(prestamo.tasaInteres || 0).toFixed(2)}% anual</p>
                    <p>• <strong>Método de Cálculo:</strong> Interés sobre saldo pendiente</p>
                    <p>• Los pagos marcados como "vencidos" requieren atención inmediata</p>
                    <p>• Los pagos "próximos" vencen en los próximos 7 días</p>
                </div>
            </div>
        </div>
    );
};

export default TablaAmortizacion;
