import { useState, useCallback, useMemo } from 'react';

/**
 * Hook optimizado para gestión de formularios de préstamos
 * Maneja estado del formulario, validaciones y transformaciones de datos
 * Separado de la lógica principal para mejor modularidad
 */
export const usePrestamoForm = (initialData = null, validationSchema = {}) => {
    
    // Estado inicial del formulario
    const initialFormState = useMemo(() => ({
        entidadFinanciera: {
            nombre: '',
            codigo: '',
            tipo: 'banco'
        },
        tipoCredito: '',
        montoSolicitado: '',
        tasaInteres: {
            porcentaje: '',
            tipo: 'fija',
            periodo: 'anual'
        },
        plazo: {
            cantidad: '',
            unidad: 'meses'
        },
        proposito: '',
        observaciones: '',
        ...initialData
    }), [initialData]);
    
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Función memoizada para actualizar campos
    const updateField = useCallback((fieldPath, value) => {
        setFormData(prev => {
            const newData = { ...prev };
            const keys = fieldPath.split('.');
            let current = newData;
            
            // Navegar hasta el penúltimo nivel
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            // Asignar valor
            current[keys[keys.length - 1]] = value;
            return newData;
        });
        
        // Limpiar error específico si existe
        if (errors[fieldPath]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldPath];
                return newErrors;
            });
        }
    }, [errors]);
    
    // Validación memoizada
    const validationErrors = useMemo(() => {
        const newErrors = {};
        
        // Validación de monto
        if (!formData.montoSolicitado || parseFloat(formData.montoSolicitado) <= 0) {
            newErrors.montoSolicitado = 'El monto debe ser mayor a 0';
        }
        
        // Validación de entidad financiera
        if (!formData.entidadFinanciera?.nombre?.trim()) {
            newErrors['entidadFinanciera.nombre'] = 'La entidad financiera es obligatoria';
        }
        
        // Validación de tipo de crédito
        if (!formData.tipoCredito) {
            newErrors.tipoCredito = 'El tipo de crédito es obligatorio';
        }
        
        // Validación de tasa de interés
        if (!formData.tasaInteres?.porcentaje || parseFloat(formData.tasaInteres.porcentaje) <= 0) {
            newErrors['tasaInteres.porcentaje'] = 'La tasa de interés debe ser mayor a 0';
        }
        
        // Validación de plazo
        if (!formData.plazo?.cantidad || parseInt(formData.plazo.cantidad) <= 0) {
            newErrors['plazo.cantidad'] = 'El plazo debe ser mayor a 0';
        }
        
        // Validación de propósito
        if (!formData.proposito?.trim()) {
            newErrors.proposito = 'El propósito del préstamo es obligatorio';
        }
        
        return newErrors;
    }, [formData]);
    
    // Verificar si el formulario es válido
    const isValid = useMemo(() => {
        return Object.keys(validationErrors).length === 0;
    }, [validationErrors]);
    
    // Función para transformar datos del backend al formulario
    const transformFromBackend = useCallback((prestamoData) => {
        const transformedData = {
            entidadFinanciera: {
                nombre: prestamoData.entidadFinanciera?.nombre || '',
                codigo: prestamoData.entidadFinanciera?.codigo || '',
                tipo: prestamoData.entidadFinanciera?.tipo || 'banco'
            },
            tipoCredito: prestamoData.tipo || prestamoData.tipoCredito || '',
            montoSolicitado: prestamoData.montoSolicitado || '',
            tasaInteres: {
                porcentaje: prestamoData.tasaInteres || '',
                tipo: prestamoData.tipoTasa || 'fija',
                periodo: 'anual'
            },
            plazo: {
                cantidad: prestamoData.plazoMeses || '',
                unidad: 'meses'
            },
            proposito: prestamoData.proposito || prestamoData.descripcion || '',
            observaciones: prestamoData.observaciones || ''
        };
        
        setFormData(transformedData);
        setErrors({});
    }, []);
    
    // Función para transformar datos del formulario al backend
    const transformToBackend = useCallback(() => {
        const backendData = { ...formData };
        
        // Transformar estructura de tasa de interés
        if (backendData.tasaInteres && typeof backendData.tasaInteres === 'object') {
            backendData.tasaInteres = parseFloat(backendData.tasaInteres.porcentaje) || 0;
            backendData.tipoTasa = backendData.tasaInteres.tipo || 'fija';
        }
        
        // Transformar plazo a plazoMeses
        if (backendData.plazo && typeof backendData.plazo === 'object') {
            const cantidad = parseInt(backendData.plazo.cantidad) || 0;
            const unidad = backendData.plazo.unidad || 'meses';
            
            // Convertir todo a meses
            switch (unidad) {
                case 'años':
                    backendData.plazoMeses = cantidad * 12;
                    break;
                case 'semanas':
                    backendData.plazoMeses = Math.round(cantidad / 4.33);
                    break;
                case 'dias':
                    backendData.plazoMeses = Math.round(cantidad / 30);
                    break;
                default:
                    backendData.plazoMeses = cantidad;
                    break;
            }
            
            delete backendData.plazo;
        }
        
        // Asignar tipo de crédito
        if (backendData.tipoCredito) {
            backendData.tipo = backendData.tipoCredito;
            delete backendData.tipoCredito;
        }
        
        // Transformar monto a número
        if (backendData.montoSolicitado) {
            backendData.montoSolicitado = parseFloat(backendData.montoSolicitado) || 0;
        }
        
        return backendData;
    }, [formData]);
    
    // Función para resetear el formulario
    const resetForm = useCallback(() => {
        setFormData(initialFormState);
        setErrors({});
        setIsSubmitting(false);
    }, [initialFormState]);
    
    // Función para validar formulario
    const validateForm = useCallback(() => {
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    }, [validationErrors]);
    
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
        validateForm,
        validationErrors
    };
};
