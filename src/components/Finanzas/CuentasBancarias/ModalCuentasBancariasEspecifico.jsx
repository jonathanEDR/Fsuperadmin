import React from 'react';
import { Loader2, X } from 'lucide-react';

/**
 * Modal específico para operaciones de cuentas bancarias
 */
const ModalCuentasBancarias = ({ 
    isOpen, 
    onClose, 
    titulo, 
    children, 
    onSubmit,
    submitText = 'Guardar',
    cancelText = 'Cancelar',
    size = 'md',
    loading = false 
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        xs: 'max-w-xs',
        sm: 'max-w-sm', 
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl'
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {titulo}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/80 rounded-xl transition-colors text-gray-500"
                                disabled={loading}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Content + Footer */}
                    {onSubmit ? (
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="px-5 py-4 overflow-y-auto flex-1">
                                {children}
                            </div>
                            <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 rounded-b-2xl flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-4 py-2 text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && (
                                        <Loader2 className="animate-spin h-4 w-4" />
                                    )}
                                    {submitText}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="px-5 py-4 overflow-y-auto flex-1">
                                {children}
                            </div>
                            <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 rounded-b-2xl flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalCuentasBancarias;
