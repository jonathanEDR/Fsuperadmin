import React from 'react';

/**
 * Componente memoizado para campos de formulario de ingreso
 * Evita re-renders innecesarios cuando otros campos cambian
 */
const IngresoFormField = React.memo(({ 
    label, 
    name, 
    type, 
    value, 
    onChange, 
    error, 
    required = false,
    options = [],
    placeholder = '',
    min,
    max,
    step,
    rows = 3,
    className = ''
}) => {
    
    const handleChange = (e) => {
        const newValue = type === 'number' ? e.target.value : e.target.value;
        onChange(name, newValue);
    };
    
    const inputClasses = `
        w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500
        ${error ? 'border-red-500' : 'border-gray-200'}
        ${className}
    `;
    
    const renderInput = () => {
        switch (type) {
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={handleChange}
                        className={inputClasses}
                        required={required}
                    >
                        <option value="">Seleccionar...</option>
                        {options.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );
                
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder={placeholder}
                        required={required}
                        rows={rows}
                    />
                );
                
            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder={placeholder}
                        required={required}
                        min={min}
                        max={max}
                        step={step}
                    />
                );
                
            default:
                return (
                    <input
                        type={type}
                        value={value}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder={placeholder}
                        required={required}
                        min={min}
                        max={max}
                    />
                );
        }
    };
    
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderInput()}
            
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
});

IngresoFormField.displayName = 'IngresoFormField';

export { IngresoFormField };
