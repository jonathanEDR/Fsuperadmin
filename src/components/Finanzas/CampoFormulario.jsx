import React from 'react';

/**
 * Componente para campos de formulario financiero
 */
const CampoFormulario = ({ 
    label, 
    name, 
    type = 'text', 
    value, 
    onChange, 
    error, 
    required = false,
    placeholder,
    options = [],
    disabled = false,
    help,
    prefix,
    suffix,
    min,
    max,
    step,
    className = ''
}) => {
    const baseClassName = `
        w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        ${className}
    `;

    const renderInput = () => {
        switch (type) {
            case 'select':
                return (
                    <select
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        disabled={disabled}
                        className={baseClassName}
                        required={required}
                    >
                        <option value="">{placeholder || 'Seleccionar...'}</option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'textarea':
                return (
                    <textarea
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        rows={4}
                        className={baseClassName}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        name={name}
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
                        name={name}
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
                            name={name}
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
                        type={type}
                        name={name}
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

    if (type === 'checkbox') {
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
            {label && type !== 'checkbox' && (
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

    return {
        valores,
        errores,
        tocados,
        manejarCambio,
        manejarBlur,
        validarFormulario,
        resetear,
        setValores
    };
};

export default CampoFormulario;
