import React from 'react';

/**
 * Componente de campo de formulario específico para Cuentas Bancarias
 */
const CampoCuentasBancarias = ({ 
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
    min,
    max,
    step,
    rows = 4,
    className = ''
}) => {
    const baseClassName = `
        w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}
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
                        rows={rows}
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
                            className="w-4 h-4 text-blue-600 border-gray-200 rounded focus:ring-blue-500"
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
            </div>
        );
    }

    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            {renderInput()}
            
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default CampoCuentasBancarias;
