import React from 'react';
import { ClipboardList } from 'lucide-react';
import {
    columnasGarantias,
    accionesGarantias,
    getAccionesDisponibles,
    estadosColor,
    tiposColor,
    formatearMoneda,
    formatearFecha
} from '../garantiasConfig';

/**
 * Componente de tabla para mostrar garantías
 */
const GarantiasTable = ({
    garantias = [],
    loading = false,
    onVerDetalles,
    onEditarGarantia,
    onAprobarGarantia,
    onRechazarGarantia,
    onActivarGarantia,
    onLiberarGarantia,
    onEjecutarGarantia,
    onEliminarGarantia,
    onAgregarSeguro,
    columnas = columnasGarantias
}) => {
    // Mapa de handlers
    const handlers = {
        verDetalles: onVerDetalles,
        editarGarantia: onEditarGarantia,
        aprobarGarantia: onAprobarGarantia,
        rechazarGarantia: onRechazarGarantia,
        activarGarantia: onActivarGarantia,
        liberarGarantia: onLiberarGarantia,
        ejecutarGarantia: onEjecutarGarantia,
        eliminarGarantia: onEliminarGarantia,
        agregarSeguro: onAgregarSeguro
    };

    // Obtener valor anidado de un objeto
    const obtenerValor = (objeto, ruta) => {
        if (!ruta.includes('.')) return objeto[ruta];
        return ruta.split('.').reduce((obj, key) => obj?.[key], objeto);
    };

    // Renderizar celda
    const renderizarCelda = (garantia, columna) => {
        const valor = obtenerValor(garantia, columna.key);

        if (columna.render) {
            return columna.render(valor, garantia, handlers);
        }

        if (valor === null || valor === undefined) {
            return <span className="text-gray-400">-</span>;
        }

        return valor;
    };

    // Renderizar acciones
    const renderizarAcciones = (garantia) => {
        const accionesDisponibles = getAccionesDisponibles(garantia.estado);

        return (
            <div className="flex items-center justify-end gap-1">
                {accionesDisponibles.map((accion) => {
                    const handler = handlers[accion.handler];
                    if (!handler) return null;

                    return (
                        <button
                            key={accion.key}
                            onClick={() => handler(garantia)}
                            className={`${accion.className} text-sm transition-all duration-200`}
                            title={accion.tooltip}
                        >
                            <span>{accion.icono}</span>
                        </button>
                    );
                })}
            </div>
        );
    };

    // Estado de carga
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {columnas.map((columna, index) => (
                                    <th
                                        key={index}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {columna.titulo}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[...Array(5)].map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    {columnas.map((_, colIndex) => (
                                        <td key={colIndex} className="px-4 py-4">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        </td>
                                    ))}
                                    <td className="px-4 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Estado vacío
    if (garantias.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-12 text-center">
                    <ClipboardList size={48} className="mb-4 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay garantías
                    </h3>
                    <p className="text-gray-500">
                        No se encontraron garantías con los filtros aplicados.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columnas.map((columna, index) => (
                                <th
                                    key={index}
                                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columna.ordenable ? 'cursor-pointer hover:bg-gray-100' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-1">
                                        <span>{columna.titulo}</span>
                                        {columna.ordenable && (
                                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                            </svg>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {garantias.map((garantia, index) => (
                            <tr
                                key={garantia._id || index}
                                className="hover:bg-gray-50 transition-colors duration-150"
                            >
                                {columnas.map((columna, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        {renderizarCelda(garantia, columna)}
                                    </td>
                                ))}
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                    {renderizarAcciones(garantia)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GarantiasTable;
