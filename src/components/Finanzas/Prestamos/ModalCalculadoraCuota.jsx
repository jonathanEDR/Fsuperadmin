import React, { useState } from 'react';

const ModalCalculadoraCuota = ({ 
    isOpen, 
    onClose, 
    calculoCuota, 
    onCalcular 
}) => {
    // Estado local para la calculadora (simple, no necesita el hook complejo)
    const [valores, setValores] = useState({
        monto: '',
        tasaInteres: '',
        plazoMeses: ''
    });
    const [errores, setErrores] = useState({});
    const [resultado, setResultado] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValores(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error cuando el usuario escribe
        if (errores[name]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        
        if (!valores.monto || parseFloat(valores.monto) <= 0) {
            nuevosErrores.monto = 'El monto debe ser mayor a 0';
        }
        if (!valores.tasaInteres || parseFloat(valores.tasaInteres) < 0) {
            nuevosErrores.tasaInteres = 'La tasa de interés debe ser 0 o mayor';
        }
        if (!valores.plazoMeses || parseInt(valores.plazoMeses) <= 0) {
            nuevosErrores.plazoMeses = 'El plazo debe ser mayor a 0';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const calcularCuota = () => {
        const monto = parseFloat(valores.monto);
        const tasaAnual = parseFloat(valores.tasaInteres);
        const plazo = parseInt(valores.plazoMeses);

        // Tasa mensual
        const tasaMensual = tasaAnual / 100 / 12;

        let cuotaMensual;
        if (tasaMensual === 0) {
            // Sin interés, cuota simple
            cuotaMensual = monto / plazo;
        } else {
            // Fórmula de cuota fija (sistema francés)
            cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazo)) / 
                          (Math.pow(1 + tasaMensual, plazo) - 1);
        }

        const montoTotal = cuotaMensual * plazo;
        const totalIntereses = montoTotal - monto;

        return {
            cuotaMensual,
            montoTotal,
            totalIntereses
        };
    };

    const manejarSubmit = (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) {
            return;
        }

        const result = calcularCuota();
        setResultado(result);
        
        // También llamar al callback si existe
        if (onCalcular) {
            onCalcular(result);
        }
    };

    const handleClose = () => {
        // Resetear estado al cerrar
        setValores({ monto: '', tasaInteres: '', plazoMeses: '' });
        setErrores({});
        setResultado(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                {/* Header - responsive */}
                <div className="bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base sm:text-xl font-bold flex items-center">
                            <span className="mr-2">🧮</span>
                            Calculadora<span className="hidden xs:inline"> de Cuotas</span>
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-white hover:text-gray-200 transition-colors p-1"
                        >
                            <span className="text-xl sm:text-2xl">&times;</span>
                        </button>
                    </div>
                </div>

                {/* Body - scrollable */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-100px)]">
                    <form onSubmit={manejarSubmit} className="space-y-4">
                        {/* Monto del Préstamo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Monto del Préstamo <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                                <input
                                    type="number"
                                    name="monto"
                                    value={valores.monto}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errores.monto ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            {errores.monto && (
                                <p className="text-red-500 text-xs mt-1">{errores.monto}</p>
                            )}
                        </div>
                        
                        {/* Tasa de Interés */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tasa de Interés Anual (%) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="tasaInteres"
                                    value={valores.tasaInteres}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errores.tasaInteres ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="12.00"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                            {errores.tasaInteres && (
                                <p className="text-red-500 text-xs mt-1">{errores.tasaInteres}</p>
                            )}
                        </div>
                        
                        {/* Plazo en Meses */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Plazo en Meses <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="plazoMeses"
                                value={valores.plazoMeses}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errores.plazoMeses ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="12"
                                min="1"
                            />
                            {errores.plazoMeses && (
                                <p className="text-red-500 text-xs mt-1">{errores.plazoMeses}</p>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>🧮</span> Calcular Cuota
                        </button>
                    </form>

                    {/* Resultados */}
                    {resultado && (
                        <div className="mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-3">
                                📊 Resultados
                            </h3>
                            
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex justify-between items-center p-2 sm:p-3 bg-white rounded border">
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">Cuota Mensual:</span>
                                    <span className="text-lg sm:text-xl font-bold text-green-600">
                                        S/ {resultado.cuotaMensual.toLocaleString('es-PE', { 
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2 
                                        })}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center p-2 sm:p-3 bg-white rounded border">
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">Total a Pagar:</span>
                                    <span className="text-base sm:text-lg font-semibold text-blue-600">
                                        S/ {resultado.montoTotal.toLocaleString('es-PE', { 
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2 
                                        })}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center p-2 sm:p-3 bg-white rounded border">
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">Total Intereses:</span>
                                    <span className="text-base sm:text-lg font-semibold text-orange-600">
                                        S/ {resultado.totalIntereses.toLocaleString('es-PE', { 
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2 
                                        })}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Información adicional */}
                            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-xs sm:text-sm text-blue-700">
                                    <strong>💡 Nota:</strong> Cálculo aproximado usando sistema de cuota fija (francés).
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end mt-4 sm:mt-6">
                        <button
                            onClick={handleClose}
                            className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
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
