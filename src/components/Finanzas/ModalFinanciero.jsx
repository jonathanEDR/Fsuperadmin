import React from 'react';

/**
 * Modal reutilizable para formularios financieros
 */
const ModalFinanciero = ({ 
    isOpen, 
    onClose, 
    titulo, 
    children, 
    onSubmit,
    onCancel,
    submitText = 'Guardar',
    cancelText = 'Cancelar',
    size = 'md',
    loading = false,
    submitDisabled = false
}) => {
    if (!isOpen) return null;

    const tamaños = {
        xs: 'max-w-sm',     // 384px - Ultra compacto
        sm: 'max-w-md',     // 448px - Compacto
        md: 'max-w-lg',     // 512px - Mediano
        lg: 'max-w-2xl',    // 672px - Grande
        xl: 'max-w-4xl',    // 896px - Extra grande
        full: 'max-w-full mx-4'
    };

    const manejarSubmit = (e) => {
        e.preventDefault();
        if (onSubmit && !loading && !submitDisabled) {
            onSubmit(e);
        }
    };

    const manejarCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
            <div className="flex items-center justify-center min-h-screen p-4">
                {/* Overlay - click to close */}
                <div 
                    className="absolute inset-0"
                    onClick={onClose}
                ></div>

                {/* Modal Container - Centrado y responsivo */}
                <div className={`
                    ${tamaños[size]} 
                    w-full 
                    bg-white 
                    rounded-lg 
                    shadow-2xl 
                    relative 
                    z-10 
                    transform 
                    transition-all 
                    duration-200 
                    ease-out
                    max-h-[90vh] 
                    overflow-hidden
                    mx-auto
                `}>
                    <form onSubmit={manejarSubmit}>
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {titulo}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <span className="sr-only">Cerrar</span>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Body - Scroll interno optimizado */}
                            <div className="px-4 sm:px-6 py-4 max-h-[60vh] overflow-y-auto">
                                {children}
                            </div>

                            {/* Footer - Botones responsivos */}
                            <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50">
                                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                                    <button
                                        type="button"
                                        onClick={manejarCancel}
                                        disabled={loading}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                    
                                    {onSubmit && (
                                        <button
                                            type="submit"
                                            disabled={loading || submitDisabled}
                                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loading ? (
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Procesando...
                                                </div>
                                            ) : (
                                                submitText
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
        </div>
    );
};

export default ModalFinanciero;
