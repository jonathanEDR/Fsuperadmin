import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Tabla específica para datos de préstamos
 */
const TablaPrestamos = ({ 
    datos = [], 
    columnas = [], 
    titulo,
    loading = false,
    acciones = []
}) => {
    const datosSeguro = Array.isArray(datos) ? datos : [];

    const formatearValor = (valor, tipo) => {
        if (valor === null || valor === undefined) return '-';
        
        switch (tipo) {
            case 'fecha':
                return new Date(valor).toLocaleDateString();
            case 'moneda':
                return new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                }).format(valor);
            case 'numero':
                return Number(valor).toLocaleString();
            default:
                return valor;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            {titulo && (
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
                </div>
            )}
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columnas.map((columna, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {columna.titulo}
                                </th>
                            ))}
                            {acciones.length > 0 && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {datosSeguro.length === 0 ? (
                            <tr>
                                <td 
                                    colSpan={columnas.length + (acciones.length > 0 ? 1 : 0)} 
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    No hay datos disponibles
                                </td>
                            </tr>
                        ) : (
                            datosSeguro.map((fila, filaIndex) => (
                                <tr key={fila.id || fila._id || filaIndex} className="hover:bg-gray-50">
                                    {columnas.map((columna, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatearValor(fila[columna.campo], columna.tipo)}
                                        </td>
                                    ))}
                                    {acciones.length > 0 && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {acciones.map((accion, accionIndex) => {
                                                    const Icono = accion.icono;
                                                    return (
                                                        <button
                                                            key={accionIndex}
                                                            onClick={() => accion.onClick(fila)}
                                                            className={accion.className || "text-blue-600 hover:text-blue-900"}
                                                            title={accion.titulo}
                                                        >
                                                            {typeof Icono === 'function' ? <Icono size={16} /> : (Icono || accion.texto)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TablaPrestamos;
