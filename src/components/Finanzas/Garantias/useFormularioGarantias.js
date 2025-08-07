import { useState } from 'react';

/**
 * Hook para manejar formularios de garantías
 */
export const useFormularioGarantias = (valoresIniciales = {}, validaciones = {}) => {
    const [valores, setValores] = useState(valoresIniciales);
    const [errores, setErrores] = useState({});
    const [tocados, setTocados] = useState({});

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target;
        const nuevoValor = type === 'checkbox' ? checked : value;
        
        setValores(prev => ({
            ...prev,
            [name]: nuevoValor
        }));

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
            const error = validaciones[name](valores[name], valores);
            setErrores(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        
        Object.keys(validaciones).forEach(campo => {
            const error = validaciones[campo](valores[campo], valores);
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

    return {
        valores,
        errores,
        tocados,
        manejarCambio,
        manejarBlur,
        validarFormulario,
        resetear,
        setValores: establecerValores
    };
};
