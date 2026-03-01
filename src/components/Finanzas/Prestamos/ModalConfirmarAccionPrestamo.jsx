import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Modal para confirmar acción sobre un préstamo
 * Permite elegir entre cancelar el préstamo o eliminarlo definitivamente
 */
const ModalConfirmarAccionPrestamo = ({
    isOpen,
    onClose,
    onCancelar,
    onEliminar,
    prestamo,
    loading = false
}) => {
    if (!isOpen || !prestamo) return null;

    const nombrePrestamo = prestamo.prestatario?.nombre || 
                          prestamo.entidadFinanciera?.nombre || 
                          'este préstamo';

    const monto = prestamo.montoAprobado || prestamo.montoSolicitado || 0;
    const montoFormateado = `S/ ${parseFloat(monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full transform transition-all">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 rounded-full p-2">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    ¿Qué desea hacer con el préstamo?
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {nombrePrestamo} - {montoFormateado}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-6 space-y-4">
                        <p className="text-gray-600 text-sm">
                            Seleccione la acción que desea realizar:
                        </p>

                        {/* Opción Cancelar */}
                        <button
                            onClick={onCancelar}
                            disabled={loading}
                            className="w-full p-4 border-2 border-yellow-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-start gap-3">
                                <div className="bg-yellow-100 rounded-xl p-2 group-hover:bg-yellow-200 transition-colors">
                                    <span className="text-2xl">🚫</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">
                                        Cancelar Préstamo
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        El préstamo se marcará como <strong className="text-yellow-600">cancelado</strong> pero 
                                        se conservará en el historial para referencia futura.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Opción Eliminar */}
                        <button
                            onClick={onEliminar}
                            disabled={loading}
                            className="w-full p-4 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-start gap-3">
                                <div className="bg-red-100 rounded-xl p-2 group-hover:bg-red-200 transition-colors">
                                    <span className="text-2xl">🗑️</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">
                                        Eliminar Definitivamente
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        El préstamo se eliminará <strong className="text-red-600">permanentemente</strong> del sistema. 
                                        Ideal para registros de prueba o errores.
                                    </p>
                                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Esta acción no se puede deshacer
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 rounded-b-2xl flex justify-end">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cerrar
                        </button>
                    </div>

                    {/* Loading overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                                <span className="text-sm text-gray-600">Procesando...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalConfirmarAccionPrestamo;
