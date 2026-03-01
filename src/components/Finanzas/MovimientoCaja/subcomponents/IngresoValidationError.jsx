import React from 'react';
import { Info, AlertCircle } from 'lucide-react';

/**
 * Componente memoizado para mostrar errores de validación específicos de ingresos
 * Maneja validaciones de efectivo, cambio, y otros aspectos específicos
 */
const IngresoValidationError = React.memo(({ 
    validacion, 
    className = '' 
}) => {
    
    if (!validacion || validacion.esValido) {
        // Si hay un mensaje pero es válido, puede ser informativo (como mostrar cambio)
        if (validacion?.mensaje) {
            return (
                <div className={`
                    flex items-center space-x-2 p-3 rounded-xl
                    bg-blue-50 border border-blue-200 text-blue-800
                    ${className}
                `}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{validacion.mensaje}</span>
                    
                    {validacion.cambio > 0 && (
                        <div className="ml-auto bg-blue-100 px-2 py-1 rounded text-sm font-bold">
                            Vuelto: S/ {validacion.cambio.toFixed(2)}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    }
    
    return (
        <div className={`
            flex items-center space-x-2 p-3 rounded-xl
            bg-red-50 border border-red-200 text-red-800
            ${className}
        `}>
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{validacion.mensaje}</span>
        </div>
    );
});

IngresoValidationError.displayName = 'IngresoValidationError';

export { IngresoValidationError };
