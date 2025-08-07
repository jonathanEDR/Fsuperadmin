import React from 'react';
import CampoPrestamos from './CampoPrestamos';
import { 
    opcionesTipoEntidad, 
    opcionesTipoInteres, 
    opcionesPeriodoInteres,
    opcionesUnidadPlazo 
} from './prestamosConfig.jsx';
import PrestamosService from '../../../services/prestamosService';

const ModalPrestamo = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    formulario, 
    prestamoEditando, 
    loading 
}) => {
    if (!isOpen) return null;

    const tiposPrestamo = PrestamosService.obtenerTiposPrestamo();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            {prestamoEditando ? 'Editar Préstamo' : 'Nuevo Préstamo'}
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
                <form onSubmit={onSubmit} className="p-6">
                    {/* Información de la Entidad Financiera */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">
                            🏦 Entidad Financiera
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CampoPrestamos
                                name="entidadFinanciera.nombre"
                                label="Nombre de la Entidad"
                                value={formulario.valores.entidadFinanciera?.nombre || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['entidadFinanciera.nombre']}
                                required
                                placeholder="Ej: Banco de Crédito del Perú"
                            />
                            
                            <CampoPrestamos
                                name="entidadFinanciera.codigo"
                                label="Código de la Entidad"
                                value={formulario.valores.entidadFinanciera?.codigo || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['entidadFinanciera.codigo']}
                                placeholder="Ej: BCP"
                            />
                            
                            <CampoPrestamos
                                name="entidadFinanciera.tipo"
                                label="Tipo de Entidad"
                                type="select"
                                value={formulario.valores.entidadFinanciera?.tipo || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['entidadFinanciera.tipo']}
                                options={opcionesTipoEntidad}
                            />
                        </div>
                    </div>

                    {/* Información del Préstamo */}
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                            💰 Detalles del Préstamo
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <CampoPrestamos
                                name="tipoCredito"
                                label="Tipo de Crédito"
                                type="select"
                                value={formulario.valores.tipoCredito || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores.tipoCredito}
                                required
                                options={tiposPrestamo}
                            />
                            
                            <CampoPrestamos
                                name="montoSolicitado"
                                label="Monto Solicitado"
                                type="number"
                                value={formulario.valores.montoSolicitado || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores.montoSolicitado}
                                required
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                            
                            <CampoPrestamos
                                name="tasaInteres.porcentaje"
                                label="Tasa de Interés (%)"
                                type="number"
                                value={formulario.valores.tasaInteres?.porcentaje || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['tasaInteres.porcentaje']}
                                required
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                max="100"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <CampoPrestamos
                                name="tasaInteres.tipo"
                                label="Tipo de Tasa"
                                type="select"
                                value={formulario.valores.tasaInteres?.tipo || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['tasaInteres.tipo']}
                                options={opcionesTipoInteres}
                            />
                            
                            <CampoPrestamos
                                name="tasaInteres.periodo"
                                label="Período de Tasa"
                                type="select"
                                value={formulario.valores.tasaInteres?.periodo || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['tasaInteres.periodo']}
                                options={opcionesPeriodoInteres}
                            />
                            
                            <CampoPrestamos
                                name="plazo.cantidad"
                                label="Plazo"
                                type="number"
                                value={formulario.valores.plazo?.cantidad || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['plazo.cantidad']}
                                required
                                placeholder="12"
                                min="1"
                            />
                            
                            <CampoPrestamos
                                name="plazo.unidad"
                                label="Unidad de Plazo"
                                type="select"
                                value={formulario.valores.plazo?.unidad || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['plazo.unidad']}
                                options={opcionesUnidadPlazo}
                            />
                        </div>
                    </div>

                    {/* Información Adicional */}
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                            📝 Información Adicional
                        </h3>
                        
                        <CampoPrestamos
                            name="proposito"
                            label="Propósito del Préstamo"
                            type="textarea"
                            value={formulario.valores.proposito || ''}
                            onChange={formulario.manejarCambio}
                            error={formulario.errores.proposito}
                            placeholder="Describe el propósito del préstamo..."
                            rows={3}
                        />
                        
                        <CampoPrestamos
                            name="observaciones"
                            label="Observaciones"
                            type="textarea"
                            value={formulario.valores.observaciones || ''}
                            onChange={formulario.manejarCambio}
                            error={formulario.errores.observaciones}
                            placeholder="Observaciones adicionales..."
                            rows={3}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Guardando...' : (prestamoEditando ? 'Actualizar' : 'Crear')} Préstamo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalPrestamo;
