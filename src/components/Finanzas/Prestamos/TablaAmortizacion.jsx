import React, { useMemo, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import FinanzasService from '../../../services/finanzasService';

const TablaAmortizacion = ({ prestamo }) => {
    const [pagosReales, setPagosReales] = useState([]);
    const [loadingPagos, setLoadingPagos] = useState(false);

    // Cargar los pagos reales del préstamo desde la BD
    useEffect(() => {
        const cargarPagosReales = async () => {
            if (!prestamo?._id) return;

            try {
                setLoadingPagos(true);
                const response = await FinanzasService.obtenerPagosPrestamo(prestamo._id);
                if (response.success && Array.isArray(response.data)) {
                    setPagosReales(response.data);
                } else {
                    setPagosReales([]);
                }
            } catch (error) {
                console.error('Error cargando pagos reales:', error);
                setPagosReales([]);
            } finally {
                setLoadingPagos(false);
            }
        };

        cargarPagosReales();
    }, [prestamo?._id]);

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

            // Buscar si existe un pago real para esta cuota
            const pagoReal = pagosReales.find(p => p.numeroCuota === i);

            // Determinar estado del pago basado en pagos reales
            const hoy = new Date();
            let estadoPago = 'pendiente';
            let fechaPagoReal = null;
            let montoPagado = 0;

            if (pagoReal) {
                if (pagoReal.estado === 'procesado') {
                    estadoPago = 'pagado';
                    fechaPagoReal = pagoReal.fechaPago;
                    montoPagado = pagoReal.montoPagado || pagoReal.montoTotal;
                } else if (pagoReal.estado === 'pendiente' || pagoReal.estado === 'programado') {
                    if (fechaPago < hoy) {
                        estadoPago = 'vencido';
                    } else if (fechaPago.getTime() - hoy.getTime() <= 7 * 24 * 60 * 60 * 1000) {
                        estadoPago = 'proximo';
                    }
                }
            } else {
                // Sin registro de pago - verificar por fecha
                if (fechaPago < hoy) {
                    estadoPago = 'vencido';
                } else if (fechaPago.getTime() - hoy.getTime() <= 7 * 24 * 60 * 60 * 1000) {
                    estadoPago = 'proximo';
                }
            }

            tabla.push({
                cuota: i,
                fechaPago: fechaPago,
                capital: capital,
                interes: interes,
                cuotaMensual: cuotaMensual,
                saldoPendiente: saldoPendiente,
                estadoPago: estadoPago,
                fechaPagoReal: fechaPagoReal,
                montoPagado: montoPagado,
                pagoId: pagoReal?._id || null
            });
        }

        return tabla;
    }, [prestamo, pagosReales]);

    const formatearMoneda = (valor) => {
        return `S/ ${parseFloat(valor || 0).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
        return fechaObj.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const obtenerEstiloEstado = (estado) => {
        switch (estado) {
            case 'pagado':
                return 'bg-green-50 text-green-700 border-green-200';
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
            case 'pagado':
                return '✅';
            case 'vencido':
                return '⚠️';
            case 'proximo':
                return '⏰';
            default:
                return '📅';
        }
    };

    const obtenerTextoEstado = (estado) => {
        switch (estado) {
            case 'pagado':
                return 'Pagado';
            case 'vencido':
                return 'Vencido';
            case 'proximo':
                return 'Próximo';
            default:
                return 'Pendiente';
        }
    };

    const calcularTotales = () => {
        const totalCapital = tablaAmortizacion.reduce((sum, fila) => sum + fila.capital, 0);
        const totalIntereses = tablaAmortizacion.reduce((sum, fila) => sum + fila.interes, 0);
        const totalPagar = totalCapital + totalIntereses;
        const cuotasPagadas = tablaAmortizacion.filter(f => f.estadoPago === 'pagado').length;
        const cuotasPendientes = tablaAmortizacion.filter(f => f.estadoPago !== 'pagado').length;
        const cuotasVencidas = tablaAmortizacion.filter(f => f.estadoPago === 'vencido').length;
        const totalPagado = tablaAmortizacion.reduce((sum, fila) => sum + (fila.montoPagado || 0), 0);

        return {
            totalCapital,
            totalIntereses,
            totalPagar,
            cuotasPagadas,
            cuotasPendientes,
            cuotasVencidas,
            totalPagado
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
            <div className="bg-blue-50 p-4 rounded-xl">
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

            {/* Resumen de Estado de Pagos */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border">
                <h4 className="font-semibold text-gray-800 mb-3">📊 Estado de Pagos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-green-100 p-3 rounded-xl text-center">
                        <p className="text-2xl font-bold text-green-700">{totales.cuotasPagadas}</p>
                        <p className="text-xs text-green-600">Cuotas Pagadas</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-700">{totales.cuotasPendientes}</p>
                        <p className="text-xs text-gray-600">Cuotas Pendientes</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-xl text-center">
                        <p className="text-2xl font-bold text-red-700">{totales.cuotasVencidas}</p>
                        <p className="text-xs text-red-600">Cuotas Vencidas</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl text-center">
                        <p className="text-lg font-bold text-blue-700">{formatearMoneda(totales.totalPagado)}</p>
                        <p className="text-xs text-blue-600">Total Pagado</p>
                    </div>
                </div>
            </div>

            {/* Loading indicator */}
            {loadingPagos && (
                <div className="flex justify-center items-center py-4">
                    <Loader2 className="animate-spin h-6 w-6 text-blue-500 mr-2" />
                    <span className="text-gray-600 text-sm">Actualizando estado de pagos...</span>
                </div>
            )}

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
                            <tr key={index} className={`hover:bg-gray-50 ${fila.estadoPago === 'pagado' ? 'bg-green-50' : ''}`}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        fila.estadoPago === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        #{fila.cuota}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    <div>
                                        {formatearFecha(fila.fechaPago)}
                                        {fila.fechaPagoReal && (
                                            <div className="text-xs text-green-600">
                                                Pagado: {formatearFecha(fila.fechaPagoReal)}
                                            </div>
                                        )}
                                    </div>
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
                                    {fila.estadoPago === 'pagado' ? (
                                        <span className="text-green-600">-</span>
                                    ) : (
                                        formatearMoneda(fila.saldoPendiente)
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${obtenerEstiloEstado(fila.estadoPago)}`}>
                                        {obtenerIconoEstado(fila.estadoPago)}
                                        <span className="ml-1">
                                            {obtenerTextoEstado(fila.estadoPago)}
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
            <div className="bg-green-50 p-4 rounded-xl">
                <h4 className="font-medium text-green-900 mb-2">ℹ️ Información Importante</h4>
                <div className="text-sm text-green-800 space-y-1">
                    <p>• <strong>Sistema de Amortización:</strong> Francés (cuotas fijas)</p>
                    <p>• <strong>Frecuencia de Pago:</strong> Mensual</p>
                    <p>• <strong>Tasa de Interés:</strong> {parseFloat(prestamo.tasaInteres || 0).toFixed(2)}% anual</p>
                    <p>• <strong>Método de Cálculo:</strong> Interés sobre saldo pendiente</p>
                    <p>• Los pagos con ✅ han sido registrados correctamente en el sistema</p>
                    <p>• Los pagos marcados como "vencidos" ⚠️ requieren atención inmediata</p>
                    <p>• Los pagos "próximos" ⏰ vencen en los próximos 7 días</p>
                </div>
            </div>
        </div>
    );
};

export default TablaAmortizacion;
