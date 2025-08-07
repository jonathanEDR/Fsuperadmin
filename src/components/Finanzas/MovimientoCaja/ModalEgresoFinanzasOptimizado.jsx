import React, { memo, useCallback, useEffect } from 'react';
import { X, MinusCircle } from 'lucide-react';

// Hooks optimizados
import { useEgresoForm } from './hooks/useEgresoForm';
import { useEgresoOptions } from './hooks/useEgresoOptions';
import { useEfectivoCalculator } from './hooks/useEfectivoCalculator';

// Componentes memoizados
import EgresoInfoPrincipal from './components/EgresoInfoPrincipal';
import EgresoMetodoPago from './components/EgresoMetodoPago';
import EgresoDesgloseEfectivo from './components/EgresoDesgloseEfectivo';

// Servicios optimizados
import { movimientosCajaService } from '../../../services/finanzas';

/**
 * Modal optimizado para registro de egresos
 * REFACTORIZADO: De 885 líneas a ~150 líneas
 * OPTIMIZACIONES:
 * - Hooks especializados y memoizados
 * - Componentes divididos y memoizados  
 * - useCallback para event handlers
 * - useMemo para cálculos pesados
 * - Eliminación de re-renders innecesarios
 */
const ModalEgresoFinanzasOptimizado = memo(({ isOpen, onClose, onSuccess }) => {
    console.log('🔄 [ModalEgresoFinanzasOptimizado] Render');

    // Hooks optimizados
    const {
        formData,
        loading,
        setLoading,
        handleInputChange,
        handleNestedChange,
        handleBilleteMonedaChange,
        resetForm,
        validationErrors,
        isFormValid
    } = useEgresoForm();

    const {
        categorias,
        metodosPago,
        cuentasBancarias,
        loading: optionsLoading,
        tieneCuentasBancarias
    } = useEgresoOptions(isOpen);

    const {
        totalCalculado,
        diferenciaMonto,
        tieneErrorDesglose,
        denominaciones,
        resumenEfectivo,
        validacionEfectivo,
        autoCompletarMonto
    } = useEfectivoCalculator(formData, handleInputChange);

    // Reset form cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    // Memoizar handler de submit
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        // Validaciones básicas
        if (!isFormValid) {
            alert(validationErrors.join('\n'));
            return;
        }

        // Validación específica de efectivo
        if (!validacionEfectivo.esValido) {
            alert(validacionEfectivo.mensaje);
            return;
        }

        try {
            setLoading(true);

            // Preparar datos para envío
            const dataToSend = {
                ...formData,
                monto: parseFloat(formData.monto),
                afectaCuentaBancaria: !!(formData.cuentaBancariaId && formData.cuentaBancariaId.trim())
            };

            console.log('📊 [DEBUG] Datos enviados al backend:', dataToSend);

            // Limpiar campos opcionales vacíos
            if (!dataToSend.proveedor.nombre) delete dataToSend.proveedor;
            if (!dataToSend.documento.numero) delete dataToSend.documento;

            const response = await movimientosCajaService.registrarEgreso(dataToSend);

            if (response.success) {
                alert('✅ Egreso registrado exitosamente');
                onSuccess && onSuccess();
                resetForm();
                onClose();
            } else {
                alert(`❌ Error: ${response.message}`);
            }

        } catch (error) {
            console.error('Error registrando egreso:', error);
            alert(`❌ Error: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    }, [
        isFormValid, 
        validationErrors, 
        validacionEfectivo, 
        formData, 
        setLoading, 
        onSuccess, 
        resetForm, 
        onClose
    ]);

    // Memoizar handler de cierre
    const handleClose = useCallback(() => {
        if (!loading) {
            resetForm();
            onClose();
        }
    }, [loading, resetForm, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header optimizado */}
                <header className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <MinusCircle className="w-5 h-5 mr-2 text-red-600" />
                        Registrar Egreso
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {/* Loading state */}
                {optionsLoading && (
                    <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando opciones...</p>
                    </div>
                )}

                {/* Form principal */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna 1: Información Principal */}
                        <EgresoInfoPrincipal
                            formData={formData}
                            categorias={categorias}
                            onInputChange={handleInputChange}
                        />

                        {/* Columna 2: Método de Pago */}
                        <EgresoMetodoPago
                            formData={formData}
                            metodosPago={metodosPago}
                            cuentasBancarias={cuentasBancarias}
                            tieneCuentasBancarias={tieneCuentasBancarias}
                            onInputChange={handleInputChange}
                            onNestedChange={handleNestedChange}
                        />
                    </div>

                    {/* Desglose de Efectivo */}
                    <EgresoDesgloseEfectivo
                        formData={formData}
                        denominaciones={denominaciones}
                        totalCalculado={totalCalculado}
                        diferenciaMonto={diferenciaMonto}
                        tieneErrorDesglose={tieneErrorDesglose}
                        resumenEfectivo={resumenEfectivo}
                        onBilleteMonedaChange={handleBilleteMonedaChange}
                        onAutoCompletarMonto={autoCompletarMonto}
                        className="mt-6"
                    />

                    {/* Información Adicional (Proveedor y Documento) */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Proveedor */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                                🏢 Información de Proveedor (Opcional)
                            </h3>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Nombre del Proveedor
                                </label>
                                <input
                                    type="text"
                                    value={formData.proveedor.nombre}
                                    onChange={(e) => handleNestedChange('proveedor.nombre', e.target.value)}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Nombre o razón social"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        RUC/DNI
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.proveedor.ruc}
                                        onChange={(e) => handleNestedChange('proveedor.ruc', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="RUC o DNI"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Contacto
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.proveedor.contacto}
                                        onChange={(e) => handleNestedChange('proveedor.contacto', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Teléfono o email"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Documento */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                                📄 Información de Documento (Opcional)
                            </h3>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Tipo de Documento
                                </label>
                                <select
                                    value={formData.documento.tipo}
                                    onChange={(e) => handleNestedChange('documento.tipo', e.target.value)}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="recibo">Recibo</option>
                                    <option value="factura">Factura</option>
                                    <option value="boleta">Boleta</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Serie
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.documento.serie}
                                        onChange={(e) => handleNestedChange('documento.serie', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Ej: F001"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Número
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.documento.numero}
                                        onChange={(e) => handleNestedChange('documento.numero', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Ej: 00001234"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="mt-6">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Observaciones
                        </label>
                        <textarea
                            value={formData.observaciones}
                            onChange={(e) => handleInputChange('observaciones', e.target.value)}
                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Observaciones adicionales..."
                            rows="3"
                        />
                    </div>

                    {/* Footer con botones */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center"
                            disabled={loading || !isFormValid}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    <MinusCircle className="w-4 h-4 mr-2" />
                                    Registrar Egreso
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

ModalEgresoFinanzasOptimizado.displayName = 'ModalEgresoFinanzasOptimizado';

export default ModalEgresoFinanzasOptimizado;
