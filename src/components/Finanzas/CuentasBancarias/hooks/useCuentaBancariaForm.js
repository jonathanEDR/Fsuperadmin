import { useState, useCallback, useMemo } from 'react';
import { useFormValidation } from './useFormValidation';
import { useFormOptions } from './useFormOptions';

/**
 * Hook optimizado para gestión de formularios de cuentas bancarias
 * Maneja estado del formulario, validaciones y transformaciones de datos
 * Separado de la lógica principal para mejor modularidad
 */
export const useCuentaBancariaForm = (initialData = null) => {
    
    // Estado inicial del formulario
    const initialFormState = useMemo(() => ({
        nombre: '',
        banco: '',
        tipoCuenta: 'corriente',
        numeroCuenta: '',
        moneda: 'PEN',
        saldoInicial: '',
        titular: '',
        descripcion: '',
        alertas: {
            saldoMinimo: 0,
            notificarMovimientos: true
        },
        activa: true,
        ...initialData
    }), [initialData]);
    
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Hooks especializados
    const { validateForm, validationErrors, isValid } = useFormValidation(formData);
    const { formOptions } = useFormOptions();
    
    // Función memoizada para actualizar campos
    const updateField = useCallback((fieldPath, value) => {
        setFormData(prev => {
            const newData = { ...prev };
            const keys = fieldPath.split('.');
            let current = newData;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            return newData;
        });
        
        if (errors[fieldPath]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldPath];
                return newErrors;
            });
        }
    }, [errors]);
    
    // Transformaciones de datos
    const transformFromBackend = useCallback((cuentaData) => {
        const transformedData = {
            nombre: cuentaData.nombre || '',
            banco: cuentaData.banco || '',
            tipoCuenta: cuentaData.tipoCuenta || 'corriente',
            numeroCuenta: cuentaData.numeroCuenta || '',
            moneda: cuentaData.moneda || 'PEN',
            saldoInicial: cuentaData.saldoInicial || '',
            titular: cuentaData.titular || '',
            descripcion: cuentaData.descripcion || '',
            alertas: {
                saldoMinimo: cuentaData.alertas?.saldoMinimo || 0,
                notificarMovimientos: cuentaData.alertas?.notificarMovimientos !== false
            },
            activa: cuentaData.activa !== false
        };
        
        setFormData(transformedData);
        setErrors({});
    }, []);
    
    const transformToBackend = useCallback(() => ({
        ...formData,
        saldoInicial: parseFloat(formData.saldoInicial) || 0,
        alertas: {
            ...formData.alertas,
            saldoMinimo: parseFloat(formData.alertas?.saldoMinimo) || 0
        }
    }), [formData]);
    
    const resetForm = useCallback(() => {
        setFormData(initialFormState);
        setErrors({});
        setIsSubmitting(false);
    }, [initialFormState]);
    
    const handleValidate = useCallback(() => {
        const result = validateForm();
        setErrors(result.errors);
        return result.isValid;
    }, [validateForm]);
    
    return {
        formData,
        errors,
        isValid,
        isSubmitting,
        setIsSubmitting,
        updateField,
        transformFromBackend,
        transformToBackend,
        resetForm,
        validateForm: handleValidate,
        validationErrors,
        formOptions
    };
};
