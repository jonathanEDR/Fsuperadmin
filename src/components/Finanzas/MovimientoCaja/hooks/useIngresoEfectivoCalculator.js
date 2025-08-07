import { useMemo, useCallback } from 'react';
import { movimientosCajaService } from '../../../../services/movimientosCajaService';

/**
 * Hook optimizado para cálculos de efectivo en ingresos
 * Reutiliza lógica común pero con validaciones específicas para ingresos
 */
export const useIngresoEfectivoCalculator = (formData, handleInputChange) => {
    
    // Calcular total de efectivo - MEMOIZADO
    const totalCalculado = useMemo(() => {
        if (formData.metodoPago.tipo !== 'efectivo') return 0;
        
        return movimientosCajaService.constructor.calcularTotalEfectivo(
            formData.metodoPago.detalles.billetes,
            formData.metodoPago.detalles.monedas
        );
    }, [
        formData.metodoPago.tipo,
        formData.metodoPago.detalles.billetes,
        formData.metodoPago.detalles.monedas
    ]);

    // Verificar si hay diferencia entre monto y efectivo - MEMOIZADO
    const diferenciaMonto = useMemo(() => {
        if (formData.metodoPago.tipo !== 'efectivo' || !formData.monto) return 0;
        
        return Math.abs(parseFloat(formData.monto) - totalCalculado);
    }, [formData.metodoPago.tipo, formData.monto, totalCalculado]);

    // Verificar si hay error en el desglose - MEMOIZADO
    const tieneErrorDesglose = useMemo(() => {
        return formData.metodoPago.tipo === 'efectivo' && diferenciaMonto > 0.01;
    }, [formData.metodoPago.tipo, diferenciaMonto]);

    // Auto-completar monto basado en efectivo - CALLBACK MEMOIZADO
    const autoCompletarMonto = useCallback(() => {
        if (formData.metodoPago.tipo === 'efectivo' && 
            (!formData.monto || formData.monto === '0') && 
            totalCalculado > 0) {
            handleInputChange('monto', totalCalculado.toString());
        }
    }, [formData.metodoPago.tipo, formData.monto, totalCalculado, handleInputChange]);

    // Configuración de denominaciones - MEMOIZADA
    const denominaciones = useMemo(() => ({
        billetes: [
            { key: 'b200', label: 'S/ 200', valor: 200 },
            { key: 'b100', label: 'S/ 100', valor: 100 },
            { key: 'b50', label: 'S/ 50', valor: 50 },
            { key: 'b20', label: 'S/ 20', valor: 20 },
            { key: 'b10', label: 'S/ 10', valor: 10 }
        ],
        monedas: [
            { key: 'm5', label: 'S/ 5', valor: 5 },
            { key: 'm2', label: 'S/ 2', valor: 2 },
            { key: 'm1', label: 'S/ 1', valor: 1 },
            { key: 'c50', label: '50¢', valor: 0.5 },
            { key: 'c20', label: '20¢', valor: 0.2 },
            { key: 'c10', label: '10¢', valor: 0.1 }
        ]
    }), []);

    // Calcular resumen de efectivo - MEMOIZADO
    const resumenEfectivo = useMemo(() => {
        const { billetes, monedas } = formData.metodoPago.detalles;
        
        const totalBilletes = denominaciones.billetes.reduce((sum, denom) => {
            const cantidad = billetes[denom.key] || 0;
            return sum + (cantidad * denom.valor);
        }, 0);

        const totalMonedas = denominaciones.monedas.reduce((sum, denom) => {
            const cantidad = monedas[denom.key] || 0;
            return sum + (cantidad * denom.valor);
        }, 0);

        const cantidadTotalItems = [
            ...Object.values(billetes),
            ...Object.values(monedas)
        ].reduce((sum, cantidad) => sum + (cantidad || 0), 0);

        return {
            totalBilletes,
            totalMonedas,
            totalGeneral: totalBilletes + totalMonedas,
            cantidadItems: cantidadTotalItems
        };
    }, [formData.metodoPago.detalles, denominaciones]);

    // Validación de efectivo específica para ingresos - MEMOIZADA
    const validacionEfectivo = useMemo(() => {
        if (formData.metodoPago.tipo !== 'efectivo') {
            return { esValido: true, mensaje: '' };
        }

        if (tieneErrorDesglose) {
            return {
                esValido: false,
                mensaje: `El desglose de efectivo (S/ ${totalCalculado.toFixed(2)}) no coincide con el monto del ingreso (S/ ${parseFloat(formData.monto || 0).toFixed(2)})`
            };
        }

        if (totalCalculado === 0 && parseFloat(formData.monto || 0) > 0) {
            return {
                esValido: false,
                mensaje: 'Debe especificar el desglose del efectivo recibido'
            };
        }

        // Validación específica para ingresos: el efectivo debe ser exacto o mayor
        if (totalCalculado > 0 && parseFloat(formData.monto || 0) > 0) {
            const diferencia = totalCalculado - parseFloat(formData.monto);
            
            if (diferencia < -0.01) {
                return {
                    esValido: false,
                    mensaje: `El efectivo recibido (S/ ${totalCalculado.toFixed(2)}) es menor al monto de venta (S/ ${parseFloat(formData.monto).toFixed(2)})`
                };
            }
            
            if (diferencia > 0.01) {
                return {
                    esValido: true,
                    mensaje: `Cambio a devolver: S/ ${diferencia.toFixed(2)}`,
                    cambio: diferencia
                };
            }
        }

        return { esValido: true, mensaje: '' };
    }, [formData.metodoPago.tipo, tieneErrorDesglose, totalCalculado, formData.monto]);

    // Calcular cambio a devolver - MEMOIZADO
    const cambioDevolver = useMemo(() => {
        if (formData.metodoPago.tipo !== 'efectivo') return 0;
        
        const diferencia = totalCalculado - parseFloat(formData.monto || 0);
        return Math.max(0, diferencia);
    }, [formData.metodoPago.tipo, totalCalculado, formData.monto]);

    return {
        totalCalculado,
        diferenciaMonto,
        tieneErrorDesglose,
        denominaciones,
        resumenEfectivo,
        validacionEfectivo,
        autoCompletarMonto,
        cambioDevolver
    };
};
