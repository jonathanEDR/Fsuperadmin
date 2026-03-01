import React, { useState } from 'react';
import {
    opcionesTipoGarantia,
    opcionesEstadoGarantia
} from '../garantiasConfig';

/**
 * Componente de filtros colapsables para la tabla de garantías
 * Inicia cerrado para mejor visibilidad del contenido principal
 */
const GarantiasFilters = ({
    filtros,
    onFiltroChange,
    onLimpiarFiltros,
    prestamos = [],
    loading = false
}) => {
    // Estado para controlar si los filtros están expandidos (inicia cerrado)
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
    
    const handleChange = (campo, valor) => {
        onFiltroChange({ [campo]: valor });
    };

    const tienesFiltrosActivos = Object.values(filtros).some(v => v !== '' && v !== null && v !== undefined);
    const cantidadFiltrosActivos = Object.values(filtros).filter(v => v !== '' && v !== null && v !== undefined).length;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
            {/* Header colapsable */}
            <button
                type="button"
                onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-sm sm:text-base font-medium text-gray-700">Filtros</span>
                    {tienesFiltrosActivos && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            {cantidadFiltrosActivos} activo{cantidadFiltrosActivos > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {tienesFiltrosActivos && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onLimpiarFiltros();
                            }}
                            className="text-xs sm:text-sm text-gray-500 hover:text-red-600 cursor-pointer"
                        >
                            Limpiar
                        </span>
                    )}
                    <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${filtrosAbiertos ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Contenido colapsable */}
            <div className={`transition-all duration-300 ease-in-out ${filtrosAbiertos ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-3 sm:p-4 pt-0 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 pt-3 sm:pt-4">
                        {/* Búsqueda */}
                        <div className="sm:col-span-2 lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Buscar
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={filtros.buscar || ''}
                                    onChange={(e) => handleChange('buscar', e.target.value)}
                                    placeholder="Código, descripción, propietario..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Préstamo asociado - si hay préstamos disponibles */}
                    {prestamos.length > 0 && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Préstamo asociado
                            </label>
                            <select
                                value={filtros.prestamoId || ''}
                                onChange={(e) => handleChange('prestamoId', e.target.value)}
                                className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            </div>
        </div>
    );
};

export default GarantiasFilters;
