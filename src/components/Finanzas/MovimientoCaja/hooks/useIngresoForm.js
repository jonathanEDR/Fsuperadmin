import { useState, useCallback, useMemo } from 'react';

/**
 * Hook optimizado para gestión de formularios de ingreso
 * Implementa memoización y callbacks optimizados para evitar re-renders
 * Similar a useEgresoForm pero específico para ingresos
 */
export const useIngresoForm = () => {
    const [formData, setFormData] = useState({
        monto: '',
        concepto: '',
        descripcion: '',
        categoria: 'venta_producto',
        tipoMovimiento: 'efectivo',
        cuentaBancariaId: '',
        metodoPago: {
            tipo: 'efectivo',
            detalles: {
                billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 },
                numeroOperacion: '',
                cuentaOrigen: '',
                banco: ''
            }
        },
        cliente: {
            nombre: '',
            documento: '',
            telefono: ''
        },
        documento: {
            tipo: 'boleta',
            numero: '',
            serie: ''
        },
        observaciones: '',
        afectaCuentaBancaria: false
    });

    const [loading, setLoading] = useState(false);

    // Memoizar función de actualización de campos simples
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Memoizar función de actualización de campos anidados
    const handleNestedChange = useCallback((path, value) => {
        setFormData(prev => {
            const newData = { ...prev };
            const keys = path.split('.');
            let current = newData;
            
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    }, []);

    // Memoizar función de manejo de billetes y monedas
    const handleBilleteMonedaChange = useCallback((tipo, denominacion, operation) => {
        const path = `metodoPago.detalles.${tipo}.${denominacion}`;
        const currentValue = formData.metodoPago.detalles[tipo][denominacion] || 0;
        const newValue = operation === 'add' ? currentValue + 1 : Math.max(0, currentValue - 1);
        handleNestedChange(path, newValue);
    }, [formData.metodoPago.detalles, handleNestedChange]);

    // Memoizar función de actualización de cuenta bancaria
    const handleCuentaBancariaChange = useCallback((cuentaId) => {
        setFormData(prev => ({
            ...prev,
            cuentaBancariaId: cuentaId,
            afectaCuentaBancaria: !!(cuentaId && cuentaId.trim()),
            tipoMovimiento: cuentaId ? 'bancario' : 'efectivo'
        }));
    }, []);

    // Memoizar función de reset del formulario
    const resetForm = useCallback(() => {
        setFormData({
            monto: '',
            concepto: '',
            descripcion: '',
            categoria: 'venta_producto',
            tipoMovimiento: 'efectivo',
            cuentaBancariaId: '',
            metodoPago: {
                tipo: 'efectivo',
                detalles: {
                    billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                    monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 },
                    numeroOperacion: '',
                    cuentaOrigen: '',
                    banco: ''
                }
            },
            cliente: {
                nombre: '',
                documento: '',
                telefono: ''
            },
            documento: {
                tipo: 'boleta',
                numero: '',
                serie: ''
            },
            observaciones: '',
            afectaCuentaBancaria: false
        });
        setLoading(false);
    }, []);

    // Memoizar validaciones del formulario
    const validationErrors = useMemo(() => {
        const errors = [];
        
        if (!formData.monto || parseFloat(formData.monto) <= 0) {
            errors.push('El monto debe ser mayor a 0');
        }
        
        if (!formData.concepto.trim()) {
            errors.push('El concepto es obligatorio');
        }
        
        if (formData.metodoPago.tipo !== 'efectivo' && !formData.metodoPago.detalles.numeroOperacion) {
            errors.push('El número de operación es obligatorio para pagos no efectivo');
        }
        
        return errors;
    }, [formData.monto, formData.concepto, formData.metodoPago]);

    // Memoizar si el formulario es válido
    const isFormValid = useMemo(() => {
        return validationErrors.length === 0;
    }, [validationErrors]);

    // Memoizar datos preparados para envío
    const preparedData = useMemo(() => {
        const data = {
            ...formData,
            monto: parseFloat(formData.monto || 0),
            afectaCuentaBancaria: formData.afectaCuentaBancaria && !!formData.cuentaBancariaId
        };

        // Limpiar campos opcionales vacíos
        if (!data.cliente.nombre) delete data.cliente;
        if (!data.documento.numero) delete data.documento;

        return data;
    }, [formData]);

    return {
        formData,
        loading,
        setLoading,
        handleInputChange,
        handleNestedChange,
        handleBilleteMonedaChange,
        handleCuentaBancariaChange,
        resetForm,
        validationErrors,
        isFormValid,
        preparedData
    };
};
