import React from 'react';
import {
    opcionesTipoGarantia,
    opcionesEstadoGarantia
} from '../garantiasConfig';

/**
 * Componente de filtros para la tabla de garantías
 */
const GarantiasFilters = ({
    filtros,
    onFiltroChange,
    onLimpiarFiltros,
    prestamos = [],
    loading = false
}) => {
    const handleChange = (campo, valor) => {
        onFiltroChange({ [campo]: valor });
    };

    const tienesFiltrosActivos = Object.values(filtros).some(v => v !== '' && v !== null && v !== undefined);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>Filtros</span>
                    {tienesFiltrosActivos && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            Activos
                        </span>
                    )}
                </h3>
                {tienesFiltrosActivos && (
                    <button
                        onClick={onLimpiarFiltros}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        disabled={loading}
                    >
                        <span>Limpiar filtros</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {/* Búsqueda */}
                <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Buscar
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={filtros.buscar || ''}
                            onChange={(e) => handleChange('buscar', e.target.value)}
                            placeholder="Código, descripción, propietario..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Tipo de Garantía */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tipo
                    </label>
                    <select
                        value={filtros.tipo || ''}
                        onChange={(e) => handleChange('tipo', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    >
                        <option value="">Todos los tipos</option>
                        {opcionesTipoGarantia.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Estado */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Estado
                    </label>
                    <select
                        value={filtros.estado || ''}
                        onChange={(e) => handleChange('estado', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    >
                        <option value="">Todos los estados</option>
                        {opcionesEstadoGarantia.map(estado => (
                            <option key={estado.value} value={estado.value}>
                                {estado.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Valor Mínimo */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Valor mínimo
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                            S/
                        </span>
                        <input
                            type="number"
                            value={filtros.valorMin || ''}
                            onChange={(e) => handleChange('valorMin', e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Valor Máximo */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Valor máximo
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                            S/
                        </span>
                        <input
                            type="number"
                            value={filtros.valorMax || ''}
                            onChange={(e) => handleChange('valorMax', e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Préstamo asociado - si hay préstamos disponibles */}
            {prestamos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Préstamo asociado
                    </label>
                    <select
                        value={filtros.prestamoId || ''}
                        onChange={(e) => handleChange('prestamoId', e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    >
                        <option value="">Todos los préstamos</option>
                        {prestamos.map(prestamo => (
                            <option key={prestamo._id} value={prestamo._id}>
                                {prestamo.codigo} - {prestamo.entidadFinanciera?.nombre || 'Sin entidad'}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default GarantiasFilters;
