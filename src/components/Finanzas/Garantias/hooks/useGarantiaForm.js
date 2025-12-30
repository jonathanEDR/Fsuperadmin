import { useState, useCallback, useMemo } from 'react';
import { formularioInicialGarantia, validacionesGarantia } from '../garantiasConfig';

/**
 * Hook para manejo de formularios de garantías
 * Incluye validación, manejo de cambios y estados del formulario
 */
export const useGarantiaForm = (valoresIniciales = null) => {
    // Estado del formulario
    const [valores, setValores] = useState(valoresIniciales || formularioInicialGarantia);
    const [errores, setErrores] = useState({});
    const [tocados, setTocados] = useState({});
    const [enviando, setEnviando] = useState(false);

    // ==================== MANEJO DE VALORES ====================

    /**
     * Obtener valor anidado de un objeto
     */
    const obtenerValorAnidado = useCallback((objeto, ruta) => {
        return ruta.split('.').reduce((obj, key) => obj?.[key], objeto);
    }, []);

    /**
     * Establecer valor anidado en un objeto
     */
    const establecerValorAnidado = useCallback((objeto, ruta, valor) => {
        const claves = ruta.split('.');
        const resultado = { ...objeto };
        let actual = resultado;

        for (let i = 0; i < claves.length - 1; i++) {
            const clave = claves[i];
            actual[clave] = { ...actual[clave] };
            actual = actual[clave];
        }

        actual[claves[claves.length - 1]] = valor;
        return resultado;
    }, []);

    /**
     * Manejar cambio en un campo
     */
    const manejarCambio = useCallback((campo, valor) => {
        setValores(prev => {
            if (campo.includes('.')) {
                return establecerValorAnidado(prev, campo, valor);
            }
            return { ...prev, [campo]: valor };
        });

        // Limpiar error del campo si existe
        if (errores[campo]) {
            setErrores(prev => {
                const nuevosErrores = { ...prev };
                delete nuevosErrores[campo];
                return nuevosErrores;
            });
        }
    }, [errores, establecerValorAnidado]);

    /**
     * Manejar evento de cambio del input
     */
    const manejarCambioInput = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const valorFinal = type === 'checkbox' ? checked : value;
        manejarCambio(name, valorFinal);
    }, [manejarCambio]);

    /**
     * Manejar blur (cuando pierde el foco)
     */
    const manejarBlur = useCallback((campo) => {
        setTocados(prev => ({ ...prev, [campo]: true }));

        // Validar campo individual
        if (validacionesGarantia[campo]) {
            const valor = obtenerValorAnidado(valores, campo);
            const error = validacionesGarantia[campo](valor);
            if (error) {
                setErrores(prev => ({ ...prev, [campo]: error }));
            }
        }
    }, [valores, obtenerValorAnidado]);

    // ==================== VALIDACIONES ====================

    /**
     * Validar un campo específico
     */
    const validarCampo = useCallback((campo) => {
        if (!validacionesGarantia[campo]) return '';

        const valor = obtenerValorAnidado(valores, campo);
        return validacionesGarantia[campo](valor);
    }, [valores, obtenerValorAnidado]);

    /**
     * Validar todo el formulario
     */
    const validarFormulario = useCallback(() => {
        const nuevosErrores = {};
        let esValido = true;

        // Validar todos los campos con validaciones definidas
        Object.keys(validacionesGarantia).forEach(campo => {
            const valor = obtenerValorAnidado(valores, campo);
            const error = validacionesGarantia[campo](valor);
            if (error) {
                nuevosErrores[campo] = error;
                esValido = false;
            }
        });

        setErrores(nuevosErrores);

        // Marcar todos los campos como tocados
        const todosTocados = {};
        Object.keys(validacionesGarantia).forEach(campo => {
            todosTocados[campo] = true;
        });
        setTocados(todosTocados);

        return esValido;
    }, [valores, obtenerValorAnidado]);

    /**
     * Verificar si el formulario es válido
     */
    const esFormularioValido = useMemo(() => {
        return Object.keys(validacionesGarantia).every(campo => {
            const valor = obtenerValorAnidado(valores, campo);
            const error = validacionesGarantia[campo](valor);
            return !error;
        });
    }, [valores, obtenerValorAnidado]);

    // ==================== FUNCIONES DE UTILIDAD ====================

    /**
     * Resetear el formulario
     */
    const resetearFormulario = useCallback((nuevosValores = null) => {
        setValores(nuevosValores || formularioInicialGarantia);
        setErrores({});
        setTocados({});
        setEnviando(false);
    }, []);

    /**
     * Establecer valores del formulario
     */
    const establecerValores = useCallback((nuevosValores) => {
        setValores(prev => ({
            ...formularioInicialGarantia,
            ...prev,
            ...nuevosValores
        }));
    }, []);

    /**
     * Cargar garantía para edición
     */
    const cargarGarantia = useCallback((garantia) => {
        if (!garantia) return;

        const valoresFormulario = {
            prestamoId: garantia.prestamoId?._id || garantia.prestamoId || '',
            tipo: garantia.tipo || '',
            descripcion: garantia.descripcion || '',
            bien: {
                nombre: garantia.bien?.nombre || '',
                descripcionDetallada: garantia.bien?.descripcionDetallada || '',
                marca: garantia.bien?.marca || '',
                modelo: garantia.bien?.modelo || '',
                año: garantia.bien?.año || '',
                numeroSerie: garantia.bien?.numeroSerie || '',
                numeroMotor: garantia.bien?.numeroMotor || '',
                numeroChasis: garantia.bien?.numeroChasis || '',
                color: garantia.bien?.color || '',
                estado: garantia.bien?.estado || 'usado_bueno'
            },
            ubicacion: {
                direccion: garantia.ubicacion?.direccion || '',
                distrito: garantia.ubicacion?.distrito || '',
                provincia: garantia.ubicacion?.provincia || '',
                departamento: garantia.ubicacion?.departamento || '',
                codigoPostal: garantia.ubicacion?.codigoPostal || '',
                referencia: garantia.ubicacion?.referencia || ''
            },
            valores: {
                comercial: garantia.valores?.comercial || '',
                tasacion: garantia.valores?.tasacion || '',
                realizacion: garantia.valores?.realizacion || '',
                seguro: garantia.valores?.seguro || '',
                moneda: garantia.valores?.moneda || 'PEN'
            },
            propietario: {
                nombre: garantia.propietario?.nombre || '',
                documento: {
                    tipo: garantia.propietario?.documento?.tipo || 'DNI',
                    numero: garantia.propietario?.documento?.numero || ''
                },
                email: garantia.propietario?.email || '',
                telefono: garantia.propietario?.telefono || '',
                direccion: garantia.propietario?.direccion || '',
                relacion: garantia.propietario?.relacion || 'titular'
            },
            informacionLegal: {
                numeroRegistro: garantia.informacionLegal?.numeroRegistro || '',
                oficina: garantia.informacionLegal?.oficina || '',
                folio: garantia.informacionLegal?.folio || '',
                asiento: garantia.informacionLegal?.asiento || '',
                partida: garantia.informacionLegal?.partida || '',
                zona: garantia.informacionLegal?.zona || '',
                fechaInscripcion: garantia.informacionLegal?.fechaInscripcion
                    ? new Date(garantia.informacionLegal.fechaInscripcion).toISOString().split('T')[0]
                    : '',
                vigenciaInscripcion: garantia.informacionLegal?.vigenciaInscripcion
                    ? new Date(garantia.informacionLegal.vigenciaInscripcion).toISOString().split('T')[0]
                    : ''
            },
            observaciones: garantia.observaciones || ''
        };

        setValores(valoresFormulario);
        setErrores({});
        setTocados({});
    }, []);

    /**
     * Preparar datos para envío al servidor
     */
    const prepararDatosEnvio = useCallback(() => {
        const datos = { ...valores };

        // Convertir valores numéricos
        if (datos.valores) {
            datos.valores = {
                ...datos.valores,
                comercial: parseFloat(datos.valores.comercial) || 0,
                tasacion: datos.valores.tasacion ? parseFloat(datos.valores.tasacion) : undefined,
                realizacion: datos.valores.realizacion ? parseFloat(datos.valores.realizacion) : undefined,
                seguro: datos.valores.seguro ? parseFloat(datos.valores.seguro) : undefined
            };
        }

        // Convertir año si existe
        if (datos.bien?.año) {
            datos.bien.año = parseInt(datos.bien.año) || undefined;
        }

        // Limpiar campos vacíos en objetos anidados
        Object.keys(datos).forEach(key => {
            if (typeof datos[key] === 'object' && datos[key] !== null) {
                Object.keys(datos[key]).forEach(subKey => {
                    if (datos[key][subKey] === '' || datos[key][subKey] === undefined) {
                        delete datos[key][subKey];
                    }
                });
            }
        });

        return datos;
    }, [valores]);

    /**
     * Obtener error de un campo
     */
    const obtenerError = useCallback((campo) => {
        return tocados[campo] ? errores[campo] : '';
    }, [errores, tocados]);

    /**
     * Verificar si un campo tiene error
     */
    const tieneError = useCallback((campo) => {
        return tocados[campo] && !!errores[campo];
    }, [errores, tocados]);

    // ==================== RETURN ====================

    return {
        // Estado del formulario
        valores,
        errores,
        tocados,
        enviando,
        esFormularioValido,

        // Manejo de valores
        manejarCambio,
        manejarCambioInput,
        manejarBlur,
        establecerValores,
        setValores,

        // Validaciones
        validarCampo,
        validarFormulario,

        // Utilidades
        resetearFormulario,
        cargarGarantia,
        prepararDatosEnvio,
        obtenerError,
        tieneError,
        obtenerValorAnidado,

        // Control de envío
        setEnviando
    };
};

export default useGarantiaForm;
