import React, { useState } from 'react';

/**
 * Tabla reutilizable para datos financieros
 */
const TablaFinanciera = ({ 
    datos = [], 
    columnas = [], 
    titulo,
    loading = false,
    paginacion = null,
    onPaginaChange,
    onFiltar,
    filtros = {},
    acciones = [],
    seleccionMultiple = false,
    onSeleccionChange
}) => {
    const [filasSeleccionadas, setFilasSeleccionadas] = useState(new Set());
    const [ordenamiento, setOrdenamiento] = useState({ campo: null, direccion: 'asc' });

    // Asegurar que datos sea siempre un array
    const datosSeguro = Array.isArray(datos) ? datos : [];

    const manejarSeleccionFila = (id) => {
        const nuevasSeleccionadas = new Set(filasSeleccionadas);
        if (nuevasSeleccionadas.has(id)) {
            nuevasSeleccionadas.delete(id);
        } else {
            nuevasSeleccionadas.add(id);
        }
        setFilasSeleccionadas(nuevasSeleccionadas);
        if (onSeleccionChange) {
            onSeleccionChange(Array.from(nuevasSeleccionadas));
        }
    };

    const manejarSeleccionTodos = () => {
        if (filasSeleccionadas.size === datosSeguro.length) {
            setFilasSeleccionadas(new Set());
            if (onSeleccionChange) onSeleccionChange([]);
        } else {
            const todasLasIds = new Set(datosSeguro.map(item => item.id || item._id));
            setFilasSeleccionadas(todasLasIds);
            if (onSeleccionChange) onSeleccionChange(Array.from(todasLasIds));
        }
    };

    const manejarOrdenamiento = (campo) => {
        const nuevaDireccion = 
            ordenamiento.campo === campo && ordenamiento.direccion === 'asc' 
                ? 'desc' 
                : 'asc';
        setOrdenamiento({ campo, direccion: nuevaDireccion });
    };

    const obtenerValorCelda = (item, columna) => {
        // Validación defensiva
        if (!columna || !columna.key || !item) {
            return '-';
        }

        if (columna.render) {
            return columna.render(item[columna.key], item);
        }
        
        if (typeof columna.key === 'string' && columna.key.includes('.')) {
            return columna.key.split('.').reduce((obj, key) => obj?.[key], item);
        }
        
        return item[columna.key];
    };

    const formatearValor = (valor, tipo) => {
        if (valor === null || valor === undefined) return '-';
        
        switch (tipo) {
            case 'moneda':
                return typeof valor === 'number' 
                    ? `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                    : valor;
            case 'porcentaje':
                return typeof valor === 'number' ? `${valor.toFixed(2)}%` : valor;
            case 'fecha':
                return valor ? new Date(valor).toLocaleDateString('es-PE') : '-';
            case 'estado':
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorEstado(valor)}`}>
                        {valor}
                    </span>
                );
            default:
                return valor;
        }
    };

    const obtenerColorEstado = (estado) => {
        const colores = {
            'activo': 'bg-green-100 text-green-800',
            'activa': 'bg-green-100 text-green-800',
            'vigente': 'bg-green-100 text-green-800',
            'aprobado': 'bg-blue-100 text-blue-800',
            'pendiente': 'bg-yellow-100 text-yellow-800',
            'vencido': 'bg-red-100 text-red-800',
            'rechazado': 'bg-red-100 text-red-800',
            'cancelado': 'bg-gray-100 text-gray-800',
            'inactivo': 'bg-gray-100 text-gray-800',
            'inactiva': 'bg-gray-100 text-gray-800'
        };
        return colores[estado?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border">
                {titulo && (
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
                    </div>
                )}
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex space-x-4">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {titulo && (
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
                </div>
            )}
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {seleccionMultiple && (
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={datosSeguro.length > 0 && filasSeleccionadas.size === datosSeguro.length}
                                        onChange={manejarSeleccionTodos}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                            )}
                            
                            {columnas.map((columna) => (
                                <th
                                    key={columna.key}
                                    className={`
                                        px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                        ${columna.ordenable ? 'cursor-pointer hover:bg-gray-100' : ''}
                                    `}
                                    onClick={() => columna.ordenable && manejarOrdenamiento(columna.key)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{columna.titulo}</span>
                                        {columna.ordenable && (
                                            <span className="text-gray-400">
                                                {ordenamiento.campo === columna.key ? (
                                                    ordenamiento.direccion === 'asc' ? '↑' : '↓'
                                                ) : '↕️'}
                                            </span>
                                        )}
                                    </div>
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
                                    colSpan={columnas.length + (seleccionMultiple ? 1 : 0) + (acciones.length > 0 ? 1 : 0)}
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    No hay datos disponibles
                                </td>
                            </tr>
                        ) : (
                            datosSeguro.map((item, index) => (
                                <tr 
                                    key={item.id || item._id || index}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {seleccionMultiple && (
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={filasSeleccionadas.has(item.id || item._id)}
                                                onChange={() => manejarSeleccionFila(item.id || item._id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                    )}
                                    
                                    {columnas.map((columna) => (
                                        <td key={columna.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {columna.render 
                                                ? columna.render(obtenerValorCelda(item, columna), item)
                                                : formatearValor(obtenerValorCelda(item, columna), columna.tipo)
                                            }
                                        </td>
                                    ))}
                                    
                                    {acciones.length > 0 && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {acciones.map((accion, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => accion.handler(item)}
                                                        className={`
                                                            px-3 py-1 rounded text-sm font-medium transition-colors
                                                            ${accion.color === 'red' 
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : accion.color === 'green'
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                            }
                                                        `}
                                                        title={accion.titulo}
                                                    >
                                                        {accion.icono || accion.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {paginacion && (
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Mostrando {((paginacion.paginaActual - 1) * paginacion.registrosPorPagina) + 1} a{' '}
                        {Math.min(paginacion.paginaActual * paginacion.registrosPorPagina, paginacion.totalRegistros)} de{' '}
                        {paginacion.totalRegistros} registros
                    </div>
                    
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onPaginaChange && onPaginaChange(paginacion.paginaActual - 1)}
                            disabled={paginacion.paginaActual <= 1}
                            className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
                            {paginacion.paginaActual} de {paginacion.totalPaginas}
                        </span>
                        
                        <button
                            onClick={() => onPaginaChange && onPaginaChange(paginacion.paginaActual + 1)}
                            disabled={paginacion.paginaActual >= paginacion.totalPaginas}
                            className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablaFinanciera;
