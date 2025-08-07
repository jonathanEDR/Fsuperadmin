import React from 'react';
import TablaPrestamosEspecifica from './TablaPrestamosEspecifica';
import { columnasAmortizacion } from './prestamosConfig.jsx';

const ModalTablaAmortizacion = ({ 
    isOpen, 
    onClose, 
    tablaAmortizacion, 
    prestamo 
}) => {
    if (!isOpen) return null;

    const totalCapital = tablaAmortizacion.reduce((sum, fila) => sum + (fila.capital || 0), 0);
    const totalInteres = tablaAmortizacion.reduce((sum, fila) => sum + (fila.interes || 0), 0);
    const totalCuotas = tablaAmortizacion.reduce((sum, fila) => sum + (fila.cuotaMensual || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-purple-600 text-white px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold flex items-center">
                                <span className="mr-2">📊</span>
                                Tabla de Amortización
                            </h2>
                            {prestamo && (
                                <p className="text-purple-100 text-sm mt-1">
                                    {prestamo.prestatario?.nombre} - {prestamo.entidadFinanciera?.nombre}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                </div>

                {/* Información del préstamo */}
                {prestamo && (
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-600">Monto:</span>
                                <p className="font-semibold text-green-600">
                                    S/ {parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado || 0).toLocaleString('es-PE', { 
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2 
                                    })}
                                </p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">Tasa:</span>
                                <p className="font-semibold text-blue-600">
                                    {parseFloat(prestamo.tasaInteres?.porcentaje || 0).toFixed(2)}% anual
                                </p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">Plazo:</span>
                                <p className="font-semibold text-purple-600">
                                    {prestamo.plazo?.cantidad} {prestamo.plazo?.unidad}
                                </p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">Estado:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    prestamo.estado === 'vigente' ? 'bg-green-100 text-green-800' :
                                    prestamo.estado === 'aprobado' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {prestamo.estado}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resumen de totales */}
                <div className="bg-blue-50 px-6 py-4 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <span className="block font-medium text-gray-600">Total Capital</span>
                            <span className="text-lg font-bold text-green-600">
                                S/ {totalCapital.toLocaleString('es-PE', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2 
                                })}
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="block font-medium text-gray-600">Total Intereses</span>
                            <span className="text-lg font-bold text-blue-600">
                                S/ {totalInteres.toLocaleString('es-PE', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2 
                                })}
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="block font-medium text-gray-600">Total a Pagar</span>
                            <span className="text-lg font-bold text-purple-600">
                                S/ {totalCuotas.toLocaleString('es-PE', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2 
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
                    {tablaAmortizacion && tablaAmortizacion.length > 0 ? (
                        <TablaPrestamosEspecifica
                            datos={tablaAmortizacion}
                            columnas={columnasAmortizacion}
                            loading={false}
                            sinAcciones={true}
                            className="text-sm"
                            estiloTabla="compacta"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-40 text-gray-500">
                            <div className="text-center">
                                <span className="text-4xl mb-2 block">📊</span>
                                <p>No hay datos de amortización disponibles</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{tablaAmortizacion?.length || 0}</span> cuotas programadas
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    // TODO: Implementar exportación a PDF
                                    console.log('Exportar a PDF');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                            >
                                📄 Exportar PDF
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Implementar exportación a Excel
                                    console.log('Exportar a Excel');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                            >
                                📊 Exportar Excel
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalTablaAmortizacion;
