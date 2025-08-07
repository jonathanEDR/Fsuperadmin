import { useState, useCallback, useMemo } from 'react';

/**
 * Hook optimizado para gestión de formularios de egreso
 * Implementa memoización y callbacks optimizados para evitar re-renders
 */
export const useEgresoForm = () => {
    const [formData, setFormData] = useState({
        monto: '',
        concepto: '',
        descripcion: '',
        categoria: 'gasto_operativo',
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
        proveedor: {
            nombre: '',
            ruc: '',
            contacto: ''
        },
        documento: {
            tipo: 'recibo',
            numero: '',
            serie: ''
        },
        observaciones: '',
        incluirDesglose: false,
        desgloseEfectivo: {
            '200': 0, '100': 0, '50': 0, '20': 0, '10': 0,
            '5': 0, '2': 0, '1': 0, '0.50': 0, '0.20': 0, '0.10': 0, '0.05': 0, '0.01': 0
        }
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

    // Memoizar función de reset del formulario
    const resetForm = useCallback(() => {
        setFormData({
            monto: '',
            concepto: '',
            descripcion: '',
            categoria: 'gasto_operativo',
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
            proveedor: {
                nombre: '',
                ruc: '',
                contacto: ''
            },
            documento: {
                tipo: 'recibo',
                numero: '',
                serie: ''
            },
            observaciones: '',
            incluirDesglose: false,
            desgloseEfectivo: {
                '200': 0, '100': 0, '50': 0, '20': 0, '10': 0,
                '5': 0, '2': 0, '1': 0, '0.50': 0, '0.20': 0, '0.10': 0, '0.05': 0, '0.01': 0
            }
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
        
        return errors;
    }, [formData.monto, formData.concepto]);

    // Memoizar si el formulario es válido
    const isFormValid = useMemo(() => {
        return validationErrors.length === 0;
    }, [validationErrors]);

    return {
        formData,
        loading,
        setLoading,
        handleInputChange,
        handleNestedChange,
        handleBilleteMonedaChange,
        resetForm,
        validationErrors,
        isFormValid
    };
};
