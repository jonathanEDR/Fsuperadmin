import { useState, useCallback, useMemo } from 'react';

/**
 * Hook optimizado para gestión de formularios de préstamos
 * Maneja estado del formulario, validaciones y transformaciones de datos
 * Separado de la lógica principal para mejor modularidad
 */
export const usePrestamoForm = (initialData = null, validationSchema = {}) => {
    
    // Estado inicial del formulario (compatible con préstamos recibidos y otorgados)
    const initialFormState = useMemo(() => ({
        // Tipo de prestatario (para préstamos otorgados)
        tipoPrestatario: 'particular',
        prestatarioRef: null,
        prestatarioInfo: null,
        // Información del prestatario
        prestatario: {
            nombre: '',
            tipoDocumento: 'DNI',
            documento: '',
            telefono: '',
            email: '',
            direccion: ''
        },
        // Entidad financiera (para préstamos recibidos)
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
        // Descuento de nómina (para trabajadores)
        descuentoNomina: {
            aplicable: false,
            tipoDescuento: 'cuota_completa',
            porcentaje: 100,
            montoFijo: 0,
            periodoDescuento: 'mensual'
        },
        // === NUEVO: Tipo de movimiento y desglose de efectivo ===
        tipoMovimiento: 'efectivo', // 'efectivo' o 'bancario'
        desgloseEfectivo: {
            billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
            monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
        },
        datosBancarios: {
            banco: '',
            numeroCuenta: '',
            numeroOperacion: '',
            cuentaBancariaId: '',
            fechaTransferencia: ''
        },
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
            // Tipo de prestatario
            tipoPrestatario: prestamoData.tipoPrestatario || 'particular',
            prestatarioRef: prestamoData.prestatarioRef || null,
            prestatarioInfo: prestamoData.prestatarioInfo || null,
            // Prestatario
            prestatario: {
                nombre: prestamoData.prestatario?.nombre || '',
                tipoDocumento: prestamoData.prestatario?.documento?.tipo || 'DNI',
                documento: prestamoData.prestatario?.documento?.numero || prestamoData.prestatario?.documento || '',
                telefono: prestamoData.prestatario?.telefono || '',
                email: prestamoData.prestatario?.email || '',
                direccion: prestamoData.prestatario?.direccion || ''
            },
            // Entidad financiera
            entidadFinanciera: {
                nombre: prestamoData.entidadFinanciera?.nombre || '',
                codigo: prestamoData.entidadFinanciera?.codigo || '',
                tipo: prestamoData.entidadFinanciera?.tipo || 'banco'
            },
            tipoCredito: prestamoData.tipo || prestamoData.tipoCredito || '',
            montoSolicitado: prestamoData.montoSolicitado || '',
            tasaInteres: {
                porcentaje: prestamoData.tasaInteres?.porcentaje || prestamoData.tasaInteres || '',
                tipo: prestamoData.tipoTasa || prestamoData.tasaInteres?.tipo || 'fija',
                periodo: prestamoData.tasaInteres?.periodo || 'anual'
            },
            plazo: {
                cantidad: prestamoData.plazoMeses || prestamoData.plazo?.cantidad || '',
                unidad: prestamoData.plazo?.unidad || 'meses'
            },
            proposito: prestamoData.proposito || prestamoData.descripcion || '',
            observaciones: prestamoData.observaciones || '',
            // Descuento de nómina
            descuentoNomina: {
                aplicable: prestamoData.descuentoNomina?.aplicable || false,
                tipoDescuento: prestamoData.descuentoNomina?.tipoDescuento || 'cuota_completa',
                porcentaje: prestamoData.descuentoNomina?.porcentaje || 100,
                montoFijo: prestamoData.descuentoNomina?.montoFijo || 0,
                periodoDescuento: prestamoData.descuentoNomina?.periodoDescuento || 'mensual'
            }
        };

        setFormData(transformedData);
        setErrors({});
    }, []);
    
    // Función para transformar datos del formulario al backend
    const transformToBackend = useCallback(() => {
        const backendData = { ...formData };

        // Preservar tipoPrestatario
        backendData.tipoPrestatario = formData.tipoPrestatario || 'particular';

        // Preservar prestatarioRef si existe
        if (formData.prestatarioRef) {
            backendData.prestatarioRef = formData.prestatarioRef;
        }

        // Transformar prestatario
        if (formData.prestatario) {
            backendData.prestatario = {
                nombre: formData.prestatario.nombre || '',
                tipoDocumento: formData.prestatario.tipoDocumento || 'DNI',
                documento: formData.prestatario.documento || '',
                telefono: formData.prestatario.telefono || '',
                email: formData.prestatario.email || '',
                direccion: formData.prestatario.direccion || ''
            };
        }

        // Limpiar prestatarioInfo ya que solo es para mostrar en el form
        delete backendData.prestatarioInfo;

        // Transformar estructura de tasa de interés
        if (backendData.tasaInteres && typeof backendData.tasaInteres === 'object') {
            const tasaPorcentaje = parseFloat(backendData.tasaInteres.porcentaje) || 0;
            backendData.tipoTasa = backendData.tasaInteres.tipo || 'fija';
            backendData.tasaInteres = tasaPorcentaje;
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

        // Preservar descuentoNomina si aplica
        if (formData.descuentoNomina) {
            backendData.descuentoNomina = {
                aplicable: formData.descuentoNomina.aplicable || false,
                tipoDescuento: formData.descuentoNomina.tipoDescuento || 'cuota_completa',
                porcentaje: parseFloat(formData.descuentoNomina.porcentaje) || 0,
                montoFijo: parseFloat(formData.descuentoNomina.montoFijo) || 0,
                periodoDescuento: formData.descuentoNomina.periodoDescuento || 'mensual'
            };
        }

        // === NUEVO: Incluir tipo de movimiento y desglose de efectivo ===
        backendData.tipoMovimiento = formData.tipoMovimiento || 'efectivo';
        
        // SIEMPRE incluir desgloseEfectivo si es efectivo (incluso si está vacío)
        if (formData.tipoMovimiento === 'efectivo') {
            backendData.desgloseEfectivo = {
                billetes: { 
                    b200: formData.desgloseEfectivo?.billetes?.b200 || 0,
                    b100: formData.desgloseEfectivo?.billetes?.b100 || 0,
                    b50: formData.desgloseEfectivo?.billetes?.b50 || 0,
                    b20: formData.desgloseEfectivo?.billetes?.b20 || 0,
                    b10: formData.desgloseEfectivo?.billetes?.b10 || 0
                },
                monedas: { 
                    m5: formData.desgloseEfectivo?.monedas?.m5 || 0,
                    m2: formData.desgloseEfectivo?.monedas?.m2 || 0,
                    m1: formData.desgloseEfectivo?.monedas?.m1 || 0,
                    c50: formData.desgloseEfectivo?.monedas?.c50 || 0,
                    c20: formData.desgloseEfectivo?.monedas?.c20 || 0,
                    c10: formData.desgloseEfectivo?.monedas?.c10 || 0
                }
            };
        } else if (formData.tipoMovimiento === 'bancario' && formData.datosBancarios) {
            backendData.datosBancarios = {
                banco: formData.datosBancarios.banco || '',
                numeroCuenta: formData.datosBancarios.numeroCuenta || '',
                numeroOperacion: formData.datosBancarios.numeroOperacion || '',
                cuentaBancariaId: formData.datosBancarios.cuentaBancariaId || null,
                fechaTransferencia: formData.datosBancarios.fechaTransferencia || null
            };
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
    
    // Función manejarCambio compatible con los modales existentes
    const manejarCambio = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const actualValue = type === 'checkbox' ? checked : value;
        updateField(name, actualValue);
    }, [updateField]);

    return {
        // Datos del formulario
        formData,
        valores: formData, // Alias para compatibilidad con modales
        // Errores
        errors,
        errores: errors, // Alias para compatibilidad con modales
        // Validación
        isValid,
        isSubmitting,
        setIsSubmitting,
        // Funciones de actualización
        updateField,
        manejarCambio, // Función compatible con modales existentes
        // Transformaciones
        transformFromBackend,
        transformToBackend,
        // Utilidades
        resetForm,
        validateForm,
        validarFormulario: validateForm, // Alias para compatibilidad
        validationErrors
    };
};
