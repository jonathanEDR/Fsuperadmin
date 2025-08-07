import { useState } from 'react';

/**
 * Hook para manejar formularios de préstamos
 */
export const useFormularioPrestamos = (valoresIniciales = {}, validaciones = {}) => {
    const [valores, setValores] = useState(valoresIniciales);
    const [errores, setErrores] = useState({});
    const [tocados, setTocados] = useState({});

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target;
        const nuevoValor = type === 'checkbox' ? checked : value;
        
        // Manejar campos anidados (ej: "entidadFinanciera.nombre")
        if (name.includes('.')) {
            const [padre, hijo] = name.split('.');
            setValores(prev => ({
                ...prev,
                [padre]: {
                    ...prev[padre],
                    [hijo]: nuevoValor
                }
            }));
        } else {
            setValores(prev => ({
                ...prev,
                [name]: nuevoValor
            }));
        }

        // Limpiar error cuando el usuario empiece a escribir
        if (errores[name]) {
            setErrores(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const manejarBlur = (e) => {
        const { name } = e.target;
        setTocados(prev => ({
            ...prev,
            [name]: true
        }));

        // Validar campo al perder el foco
        if (validaciones[name]) {
            // Función helper para obtener valor anidado
            const obtenerValor = (objeto, ruta) => {
                return ruta.split('.').reduce((valor, clave) => valor && valor[clave], objeto);
            };
            
            const valor = obtenerValor(valores, name);
            const error = validaciones[name](valor, valores);
            setErrores(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        
        // Función helper para obtener valor anidado
        const obtenerValor = (objeto, ruta) => {
            return ruta.split('.').reduce((valor, clave) => valor && valor[clave], objeto);
        };
        
        Object.keys(validaciones).forEach(campo => {
            const valor = obtenerValor(valores, campo);
            const error = validaciones[campo](valor, valores);
            if (error) {
                nuevosErrores[campo] = error;
            }
        });

        setErrores(nuevosErrores);
        setTocados(Object.keys(validaciones).reduce((acc, campo) => {
            acc[campo] = true;
            return acc;
        }, {}));

        return Object.keys(nuevosErrores).length === 0;
    };

    const resetear = (nuevosValores = valoresIniciales) => {
        setValores(nuevosValores);
        setErrores({});
        setTocados({});
    };

    const establecerValores = (nuevosValores) => {
        setValores(nuevosValores);
        setErrores({});
        setTocados({});
    };

    const obtenerDatos = () => {
        return valores;
    };

    return {
        valores,
        errores,
        tocados,
        manejarCambio,
        manejarBlur,
        validarFormulario,
        resetear,
        setValores: establecerValores,
        obtenerDatos
    };
};
