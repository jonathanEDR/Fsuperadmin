import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import TablaAmortizacion from './TablaAmortizacion';

const ModalDetallesPrestamo = ({ isOpen, onClose, prestamo, loading = false }) => {
    if (!isOpen || !prestamo) return null;

    const calcularFechaVencimiento = (fechaInicio, plazoMeses) => {
        const fecha = new Date(fechaInicio);
        fecha.setMonth(fecha.getMonth() + parseInt(plazoMeses || 0));
        return fecha;
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Manejar diferentes nombres de campos para plazo
    const plazoMeses = prestamo.plazoMeses || prestamo.plazo?.cantidad || prestamo.plazo || 0;
    const fechaInicio = prestamo.fechaAprobacion || prestamo.fechaSolicitud || new Date();
    const fechaVencimiento = calcularFechaVencimiento(fechaInicio, plazoMeses);
    const diasRestantes = Math.ceil((fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">📋 Detalles del Préstamo</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Código: {prestamo.codigo} | {prestamo.entidadFinanciera?.nombre || 'Sin entidad'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/80 rounded-xl text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            <span className="ml-3 text-gray-600">Cargando detalles...</span>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Resumen del Préstamo */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    💰 Resumen Financiero
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-3 rounded-xl border">
                                        <p className="text-sm text-gray-600">Monto Aprobado</p>
                                        <p className="text-xl font-bold text-green-600">
                                            S/ {parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado || 0).toLocaleString('es-PE')}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border">
                                        <p className="text-sm text-gray-600">Tasa de Interés</p>
                                        <p className="text-xl font-bold text-blue-600">
                                            {parseFloat(prestamo.tasaInteres || 0).toFixed(2)}% anual
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border">
                                        <p className="text-sm text-gray-600">Plazo</p>
                                        <p className="text-xl font-bold text-purple-600">
                                            {plazoMeses} meses
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border">
                                        <p className="text-sm text-gray-600">Cuota Estimada</p>
                                        <p className="text-xl font-bold text-orange-600">
                                            S/ {prestamo.cuotaMensual ? 
                                                parseFloat(prestamo.cuotaMensual).toLocaleString('es-PE') : 
                                                'Calculando...'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Información de Fechas */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    📅 Cronología del Préstamo
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="bg-green-100 p-3 rounded-xl">
                                            <p className="text-sm text-green-700 font-medium">Fecha de Inicio</p>
                                            <p className="text-lg font-bold text-green-800">
                                                {formatearFecha(fechaInicio)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="bg-orange-100 p-3 rounded-xl">
                                            <p className="text-sm text-orange-700 font-medium">Fecha de Vencimiento</p>
                                            <p className="text-lg font-bold text-orange-800">
                                                {formatearFecha(fechaVencimiento)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`p-3 rounded-xl ${diasRestantes > 30 ? 'bg-blue-100' : diasRestantes > 0 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                            <p className={`text-sm font-medium ${diasRestantes > 30 ? 'text-blue-700' : diasRestantes > 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                                                {diasRestantes > 0 ? 'Días Restantes' : 'Días Vencido'}
                                            </p>
                                            <p className={`text-lg font-bold ${diasRestantes > 30 ? 'text-blue-800' : diasRestantes > 0 ? 'text-yellow-800' : 'text-red-800'}`}>
                                                {Math.abs(diasRestantes)} días
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de Amortización */}
                            <div className="bg-white rounded-xl border">
                                <div className="p-4 border-b bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                        📊 Tabla de Amortización - Flujo de Pagos
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Cronograma detallado de todos los pagos programados
                                    </p>
                                </div>
                                <TablaAmortizacion prestamo={prestamo} />
                            </div>

                            {/* Información del Prestatario */}
                            {prestamo.prestatario && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        👤 Información del Prestatario
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Nombre Completo</p>
                                            <p className="font-medium">{prestamo.prestatario.nombre}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Documento</p>
                                            <p className="font-medium">
                                                {prestamo.prestatario.documento?.tipo}: {prestamo.prestatario.documento?.numero}
                                            </p>
                                        </div>
                                        {prestamo.prestatario.email && (
                                            <div>
                                                <p className="text-sm text-gray-600">Email</p>
                                                <p className="font-medium">{prestamo.prestatario.email}</p>
                                            </div>
                                        )}
                                        {prestamo.prestatario.telefono && (
                                            <div>
                                                <p className="text-sm text-gray-600">Teléfono</p>
                                                <p className="font-medium">{prestamo.prestatario.telefono}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Observaciones */}
                            {prestamo.observaciones && (
                                <div className="bg-yellow-50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                        📝 Observaciones
                                    </h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{prestamo.observaciones}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 rounded-b-2xl">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors"
                        >
                            🖨️ Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalDetallesPrestamo;
