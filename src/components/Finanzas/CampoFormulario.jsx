import React from 'react';

/**
 * Componente para campos de formulario financiero
 */
const CampoFormulario = ({ 
    label, 
    name, 
    id,
    type = 'text', 
    tipo,
    value, 
    onChange, 
    error, 
    required = false,
    placeholder,
    options = [],
    opciones = [],
    disabled = false,
    help,
    prefix,
    suffix,
    min,
    max,
    step,
    filas,
    className = '',
    icono
}) => {
    // Usar id si se proporciona, sino name
    const fieldName = id || name;
    // Usar tipo si se proporciona, sino type
    const fieldType = tipo || type;
    // Usar opciones si se proporciona, sino options
    const fieldOptions = opciones.length > 0 ? opciones : options;

    // Debug temporal - mejorado
    console.log('🔧 CampoFormulario Debug MEJORADO:', {
        id, 
        name, 
        fieldName,
        value: JSON.stringify(value),
        onChange: typeof onChange,
        fieldType,
        error,
        hasError: !!error
    });
    const baseClassName = `
        w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        ${className}
    `;

    const renderInput = () => {
        switch (fieldType) {
            case 'select':
                return (
                    <select
                        name={fieldName}
                        value={value || ''}
                        onChange={onChange}
                        disabled={disabled}
                        className={baseClassName}
                        required={required}
                    >
                        <option value="">{placeholder || 'Seleccionar...'}</option>
                        {fieldOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'textarea':
                return (
                    <textarea
                        name={fieldName}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        rows={filas || 4}
                        className={baseClassName}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        name={fieldName}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        min={min}
                        max={max}
                        step={step || '0.01'}
                        className={baseClassName}
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        name={fieldName}
                        value={value || ''}
                        onChange={onChange}
                        disabled={disabled}
                        required={required}
                        min={min}
                        max={max}
                        className={baseClassName}
                    />
                );

            case 'checkbox':
                return (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name={fieldName}
                            checked={value || false}
                            onChange={onChange}
                            disabled={disabled}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        {label && (
                            <label className="ml-2 text-sm text-gray-700">
                                {label}
                                {required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        )}
                    </div>
                );

            default:
                return (
                    <input
                        type={fieldType}
                        name={fieldName}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        className={baseClassName}
                    />
                );
        }
    };

    if (fieldType === 'checkbox') {
        return (
            <div className="mb-4">
                {renderInput()}
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
                {help && (
                    <p className="mt-1 text-sm text-gray-500">{help}</p>
                )}
            </div>
        );
    }

    return (
        <div className="mb-4">
            {label && fieldType !== 'checkbox' && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="relative">
                {prefix && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {prefix}
                    </div>
                )}
                
                <div className={prefix ? 'pl-8' : ''}>
                    {renderInput()}
                </div>
                
                {suffix && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {suffix}
                    </div>
                )}
            </div>
            
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            
            {help && (
                <p className="mt-1 text-sm text-gray-500">{help}</p>
            )}
        </div>
    );
};

/**
 * Hook para manejar formularios
 */
export const useFormulario = (valoresIniciales = {}, validaciones = {}) => {
    const [valores, setValores] = React.useState(valoresIniciales);
    const [errores, setErrores] = React.useState({});
    const [tocados, setTocados] = React.useState({});

    // Helper para establecer valores anidados
    const establecerValorAnidado = (objeto, ruta, valor) => {
        const partes = ruta.split('.');
        const resultado = { ...objeto };
        let actual = resultado;
        
        for (let i = 0; i < partes.length - 1; i++) {
            if (!actual[partes[i]]) {
                actual[partes[i]] = {};
            } else {
                actual[partes[i]] = { ...actual[partes[i]] };
            }
            actual = actual[partes[i]];
        }
        
        actual[partes[partes.length - 1]] = valor;
        return resultado;
    };

    // Helper para obtener valores anidados
    const obtenerValorAnidado = (objeto, ruta) => {
        const partes = ruta.split('.');
        let actual = objeto;
        
        for (let i = 0; i < partes.length; i++) {
            if (actual === null || actual === undefined) {
                return '';
            }
            actual = actual[partes[i]];
        }
        
        return actual || '';
    };

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target;
        const nuevoValor = type === 'checkbox' ? checked : value;
        
        setValores(prev => {
            if (name.includes('.')) {
                return establecerValorAnidado(prev, name, nuevoValor);
            } else {
                return {
                    ...prev,
                    [name]: nuevoValor
                };
            }
        });

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
            const valorCampo = name.includes('.') ? 
                obtenerValorAnidado(valores, name) : 
                valores[name];
            const error = validaciones[name](valorCampo, valores);
            setErrores(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        
        console.log('🔍 ValidarFormulario - Valores actuales:', JSON.stringify(valores, null, 2));
        console.log('🔍 ValidarFormulario - Validaciones disponibles:', Object.keys(validaciones));
        
        Object.keys(validaciones).forEach(campo => {
            const valorCampo = campo.includes('.') ? 
                obtenerValorAnidado(valores, campo) : 
                valores[campo];
            console.log(`🔍 Validando campo ${campo}:`, {
                valorCampo: JSON.stringify(valorCampo),
                tieneValidacion: !!validaciones[campo]
            });
            const error = validaciones[campo](valorCampo, valores);
            if (error) {
                console.log(`❌ Error en campo ${campo}:`, error);
                nuevosErrores[campo] = error;
            } else {
                console.log(`✅ Campo ${campo} válido`);
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
        setValores,
        obtenerDatos
    };
};

export default CampoFormulario;
