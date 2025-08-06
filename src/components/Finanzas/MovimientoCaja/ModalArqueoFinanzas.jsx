import React, { useState, useEffect } from 'react';
import { X, Calculator, Banknote, Coins } from 'lucide-react';
import { movimientosCajaService } from '../../../services/movimientosCajaService';

const ModalArqueoFinanzas = ({ isOpen, onClose }) => {
    const [arqueo, setArqueo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
    
    useEffect(() => {
        if (isOpen) {
            cargarArqueo();
        }
    }, [isOpen, fechaSeleccionada]);
    
    const cargarArqueo = async () => {
        try {
            setLoading(true);
            const response = await movimientosCajaService.obtenerArqueo(fechaSeleccionada);
            
            if (response.success) {
                setArqueo(response.data);
            }
        } catch (error) {
            console.error('Error cargando arqueo:', error);
            alert('Error al cargar el arqueo de caja');
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                        Arqueo de Caja
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6">
                    {/* Selector de fecha */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha del Arqueo
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="date"
                                value={fechaSeleccionada}
                                onChange={(e) => setFechaSeleccionada(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={cargarArqueo}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                disabled={loading}
                            >
                                {loading ? 'Cargando...' : 'Actualizar'}
                            </button>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-gray-600">Cargando arqueo...</div>
                        </div>
                    ) : arqueo ? (
                        <div className="space-y-6">
                            {/* Resumen */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h3 className="font-medium text-green-800 mb-2">Efectivo Esperado</h3>
                                    <p className="text-2xl font-bold text-green-600">
                                        S/ {arqueo.efectivoEsperado?.toLocaleString('es-PE', { minimumFractionDigits: 2 }) || '0.00'}
                                    </p>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h3 className="font-medium text-blue-800 mb-2">Efectivo Calculado</h3>
                                    <p className="text-2xl font-bold text-blue-600">
                                        S/ {arqueo.valorCalculado?.toLocaleString('es-PE', { minimumFractionDigits: 2 }) || '0.00'}
                                    </p>
                                </div>
                                
                                <div className={`p-4 rounded-lg border ${
                                    Math.abs(arqueo.diferencia || 0) < 0.01
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                }`}>
                                    <h3 className={`font-medium mb-2 ${
                                        Math.abs(arqueo.diferencia || 0) < 0.01
                                            ? 'text-green-800'
                                            : 'text-red-800'
                                    }`}>
                                        Diferencia
                                    </h3>
                                    <p className={`text-2xl font-bold ${
                                        Math.abs(arqueo.diferencia || 0) < 0.01
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}>
                                        {arqueo.diferencia >= 0 ? '+' : ''}S/ {arqueo.diferencia?.toLocaleString('es-PE', { minimumFractionDigits: 2 }) || '0.00'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Desglose detallado */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Billetes */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                                        <Banknote className="w-5 h-5 mr-2 text-green-600" />
                                        Billetes
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {[
                                            { key: 'b200', valor: 200, label: 'S/ 200' },
                                            { key: 'b100', valor: 100, label: 'S/ 100' },
                                            { key: 'b50', valor: 50, label: 'S/ 50' },
                                            { key: 'b20', valor: 20, label: 'S/ 20' },
                                            { key: 'b10', valor: 10, label: 'S/ 10' }
                                        ].map(billete => {
                                            const cantidad = arqueo.desglose?.billetes?.[billete.key] || 0;
                                            const valor = cantidad * billete.valor;
                                            
                                            return (
                                                <div key={billete.key} className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <span className="font-medium">{billete.label}</span>
                                                    <div className="text-right">
                                                        <div className="font-medium">{cantidad} unidades</div>
                                                        <div className="text-sm text-gray-600">
                                                            S/ {valor.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <div className="flex justify-between items-center font-semibold">
                                            <span>Total Billetes:</span>
                                            <span className="text-green-600">
                                                S/ {(
                                                    (arqueo.desglose?.billetes?.b200 || 0) * 200 +
                                                    (arqueo.desglose?.billetes?.b100 || 0) * 100 +
                                                    (arqueo.desglose?.billetes?.b50 || 0) * 50 +
                                                    (arqueo.desglose?.billetes?.b20 || 0) * 20 +
                                                    (arqueo.desglose?.billetes?.b10 || 0) * 10
                                                ).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Monedas */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                                        <Coins className="w-5 h-5 mr-2 text-yellow-600" />
                                        Monedas
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {[
                                            { key: 'm5', valor: 5, label: 'S/ 5' },
                                            { key: 'm2', valor: 2, label: 'S/ 2' },
                                            { key: 'm1', valor: 1, label: 'S/ 1' },
                                            { key: 'c50', valor: 0.5, label: '50 céntimos' },
                                            { key: 'c20', valor: 0.2, label: '20 céntimos' },
                                            { key: 'c10', valor: 0.1, label: '10 céntimos' }
                                        ].map(moneda => {
                                            const cantidad = arqueo.desglose?.monedas?.[moneda.key] || 0;
                                            const valor = cantidad * moneda.valor;
                                            
                                            return (
                                                <div key={moneda.key} className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <span className="font-medium">{moneda.label}</span>
                                                    <div className="text-right">
                                                        <div className="font-medium">{cantidad} unidades</div>
                                                        <div className="text-sm text-gray-600">
                                                            S/ {valor.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <div className="flex justify-between items-center font-semibold">
                                            <span>Total Monedas:</span>
                                            <span className="text-yellow-600">
                                                S/ {(
                                                    (arqueo.desglose?.monedas?.m5 || 0) * 5 +
                                                    (arqueo.desglose?.monedas?.m2 || 0) * 2 +
                                                    (arqueo.desglose?.monedas?.m1 || 0) * 1 +
                                                    (arqueo.desglose?.monedas?.c50 || 0) * 0.5 +
                                                    (arqueo.desglose?.monedas?.c20 || 0) * 0.2 +
                                                    (arqueo.desglose?.monedas?.c10 || 0) * 0.1
                                                ).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Resumen de movimientos */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-medium text-blue-900 mb-3">📊 Resumen de Movimientos del Día</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">Ingresos en Efectivo:</span>
                                        <div className="font-semibold text-green-600">
                                            S/ {arqueo.movimientos?.ingresos?.toLocaleString('es-PE', { minimumFractionDigits: 2 }) || '0.00'}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-blue-700">Egresos en Efectivo:</span>
                                        <div className="font-semibold text-red-600">
                                            S/ {arqueo.movimientos?.egresos?.toLocaleString('es-PE', { minimumFractionDigits: 2 }) || '0.00'}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-blue-700">Total Movimientos:</span>
                                        <div className="font-semibold text-blue-600">
                                            {arqueo.movimientos?.cantidad || 0} transacciones
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Alertas */}
                            {Math.abs(arqueo.diferencia || 0) > 0.01 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <div className="text-yellow-800">
                                            <span className="font-medium">⚠️ Atención:</span> Existe una diferencia de{' '}
                                            <span className="font-bold">
                                                S/ {Math.abs(arqueo.diferencia).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </span>{' '}
                                            entre el efectivo esperado y el calculado.
                                            {arqueo.diferencia > 0 ? ' (Sobrante)' : ' (Faltante)'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No hay datos de arqueo para la fecha seleccionada
                        </div>
                    )}
                    
                    {/* Botón de cerrar */}
                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalArqueoFinanzas;
