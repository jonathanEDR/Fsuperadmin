import { useMemo } from 'react';

/**
 * Hook para validación de formularios de cuentas bancarias
 * Separado para mejor modularidad y reutilización
 */
export const useFormValidation = (formData) => {
    
    // Validación memoizada
    const validationErrors = useMemo(() => {
        const newErrors = {};
        
        // Validación de nombre
        if (!formData.nombre?.trim()) {
            newErrors.nombre = 'El nombre de la cuenta es obligatorio';
        }
        
        // Validación de banco
        if (!formData.banco?.trim()) {
            newErrors.banco = 'El banco es obligatorio';
        }
        
        // Validación de tipo de cuenta
        if (!formData.tipoCuenta) {
            newErrors.tipoCuenta = 'El tipo de cuenta es obligatorio';
        }
        
        // Validación de número de cuenta
        if (!formData.numeroCuenta?.trim()) {
            newErrors.numeroCuenta = 'El número de cuenta es obligatorio';
        } else if (formData.numeroCuenta.length < 10) {
            newErrors.numeroCuenta = 'El número de cuenta debe tener al menos 10 dígitos';
        }
        
        // Validación de moneda
        if (!formData.moneda) {
            newErrors.moneda = 'La moneda es obligatoria';
        }
        
        // Validación de saldo inicial
        if (formData.saldoInicial !== '' && isNaN(parseFloat(formData.saldoInicial))) {
            newErrors.saldoInicial = 'El saldo inicial debe ser un número válido';
        }
        
        // Validación de titular
        if (!formData.titular?.trim()) {
            newErrors.titular = 'El titular de la cuenta es obligatorio';
        }
        
        // Validación de alertas
        if (formData.alertas?.saldoMinimo !== undefined && 
            isNaN(parseFloat(formData.alertas.saldoMinimo))) {
            newErrors['alertas.saldoMinimo'] = 'El saldo mínimo debe ser un número válido';
        }
        
        return newErrors;
    }, [formData]);
    
    // Verificar si el formulario es válido
    const isValid = useMemo(() => {
        return Object.keys(validationErrors).length === 0;
    }, [validationErrors]);
    
    // Función para validar formulario
    const validateForm = useMemo(() => () => {
        return {
            isValid: Object.keys(validationErrors).length === 0,
            errors: validationErrors
        };
    }, [validationErrors]);
    
    return {
        validationErrors,
        isValid,
        validateForm
    };
};
