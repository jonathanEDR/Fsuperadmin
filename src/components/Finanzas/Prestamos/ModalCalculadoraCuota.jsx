import React from 'react';
import CampoFormulario from '../CampoFormulario';

const ModalCalculadoraCuota = ({ 
    isOpen, 
    onClose, 
    formulario, 
    calculoCuota, 
    onCalcular 
}) => {
    if (!isOpen) return null;

    const manejarSubmit = (e) => {
        e.preventDefault();
        onCalcular();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center">
                            <span className="mr-2">🧮</span>
                            Calculadora de Cuotas
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form onSubmit={manejarSubmit} className="space-y-4">
                        <CampoFormulario
                            id="monto"
                            label="Monto del Préstamo"
                            tipo="number"
                            value={formulario.valores.monto || ''}
                            onChange={formulario.manejarCambio}
                            error={formulario.errores.monto}
                            required
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            icono="💰"
                        />
                        
                        <CampoFormulario
                            id="tasaInteres"
                            label="Tasa de Interés Anual (%)"
                            tipo="number"
                            value={formulario.valores.tasaInteres || ''}
                            onChange={formulario.manejarCambio}
                            error={formulario.errores.tasaInteres}
                            required
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            max="100"
                            icono="📈"
                        />
                        
                        <CampoFormulario
                            id="plazoMeses"
                            label="Plazo en Meses"
                            tipo="number"
                            value={formulario.valores.plazoMeses || ''}
                            onChange={formulario.manejarCambio}
                            error={formulario.errores.plazoMeses}
                            required
                            placeholder="12"
                            min="1"
                            icono="📅"
                        />
                        
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Calcular Cuota
                        </button>
                    </form>

                    {/* Resultados */}
                    {calculoCuota && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-800 mb-3">
                                📊 Resultados del Cálculo
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white rounded border">
                                    <span className="font-medium text-gray-700">Cuota Mensual:</span>
                                    <span className="text-xl font-bold text-green-600">
                                        S/ {calculoCuota.cuotaMensual.toLocaleString('es-PE', { 
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2 
                                        })}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-white rounded border">
                                    <span className="font-medium text-gray-700">Monto Total a Pagar:</span>
                                    <span className="text-lg font-semibold text-blue-600">
                                        S/ {calculoCuota.montoTotal.toLocaleString('es-PE', { 
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2 
                                        })}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-white rounded border">
                                    <span className="font-medium text-gray-700">Total de Intereses:</span>
                                    <span className="text-lg font-semibold text-orange-600">
                                        S/ {calculoCuota.totalIntereses.toLocaleString('es-PE', { 
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2 
                                        })}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Información adicional */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-700">
                                    <strong>💡 Nota:</strong> Este cálculo es aproximado y puede variar según las condiciones específicas del préstamo, seguros adicionales, comisiones, etc.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalCalculadoraCuota;
