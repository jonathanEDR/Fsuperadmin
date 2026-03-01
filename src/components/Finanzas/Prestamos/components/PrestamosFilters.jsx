import React, { useCallback, useState } from 'react';

/**
 * Componente memoizado para filtros de préstamos
 * Colapsable - inicia cerrado para mejor visibilidad del contenido principal
 */
const PrestamosFilters = React.memo(({ 
    filtros, 
    onFiltrosChange, 
    onLimpiarFiltros, 
    loading 
}) => {
    // Estado para controlar si los filtros están expandidos (inicia cerrado)
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
    
    const handleInputChange = useCallback((campo, valor) => {
        onFiltrosChange({ [campo]: valor });
    }, [onFiltrosChange]);
    
    const handleLimpiar = useCallback(() => {
        onLimpiarFiltros();
    }, [onLimpiarFiltros]);
    
    // NUEVO: Tipos de préstamo (Recibido vs Otorgado)
    const tiposPrestamo = [
        { value: '', label: 'Todos los préstamos' },
        { value: 'recibido', label: '💰 Préstamos Recibidos' },
        { value: 'otorgado', label: '💸 Préstamos Otorgados' }
    ];

    const tiposCredito = [
        { value: '', label: 'Todos los tipos' },
        { value: 'personal', label: 'Personal' },
        { value: 'vehicular', label: 'Vehicular' },
        { value: 'hipotecario', label: 'Hipotecario' },
        { value: 'comercial', label: 'Comercial' },
        { value: 'microempresa', label: 'Microempresa' }
    ];

    const estados = [
        { value: '', label: 'Todos los estados' },
        { value: 'aprobado', label: 'Aprobado' },
        { value: 'cancelado', label: 'Cancelado' }
    ];
    
    // Labels cortos para móvil
    const tiposPrestamoCortosMovil = {
        'Todos los préstamos': 'Todos',
        '💰 Préstamos Recibidos': '💰 Recibidos',
        '💸 Préstamos Otorgados': '💸 Otorgados'
    };

    // Calcular filtros activos
    const filtrosActivos = Object.entries(filtros).filter(([key, value]) => value !== '' && value !== null && value !== undefined);
    const tieneFiltrosActivos = filtrosActivos.length > 0;

    return (
        <div className="bg-white rounded-xl shadow border overflow-hidden">
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
                    <span className="text-sm sm:text-base font-medium text-gray-900">Filtros</span>
                    {tieneFiltrosActivos && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            {filtrosActivos.length} activo{filtrosActivos.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {tieneFiltrosActivos && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLimpiar();
                            }}
                            className="text-xs sm:text-sm text-gray-600 hover:text-red-600 cursor-pointer"
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
            <div className={`transition-all duration-300 ease-in-out ${filtrosAbiertos ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-3 sm:p-4 lg:p-6 pt-0 border-t border-gray-200">
                    {/* Filtro principal por Tipo de Préstamo */}
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-xl border mt-3 sm:mt-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Tipo de Préstamo
                        </label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {tiposPrestamo.map(tipo => (
                                <button
                                    key={tipo.value}
                                    type="button"
                                    onClick={() => handleInputChange('tipoPrestamo', tipo.value)}
                                    disabled={loading}
                                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                                        (filtros.tipoPrestamo || '') === tipo.value
                                            ? tipo.value === 'recibido'
                                                ? 'bg-indigo-600 text-white'
                                                : tipo.value === 'otorgado'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-700 text-white'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="sm:hidden">{tiposPrestamoCortosMovil[tipo.label] || tipo.label}</span>
                                    <span className="hidden sm:inline">{tipo.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">

                        {/* Estado */}
                        <div>
                            <label className="block text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                value={filtros.estado}
                                onChange={(e) => handleInputChange('estado', e.target.value)}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            >
                                {estados.map(estado => (
                                    <option key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tipo de Crédito */}
                        <div>
                            <label className="block text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1">
                                <span className="sm:hidden">Tipo</span>
                                <span className="hidden sm:inline">Tipo de Crédito</span>
                            </label>
                            <select
                                value={filtros.tipoCredito}
                                onChange={(e) => handleInputChange('tipoCredito', e.target.value)}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            >
                                {tiposCredito.map(tipo => (
                                    <option key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Entidad/Prestatario */}
                        <div>
                            <label className="block text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1">
                                <span className="sm:hidden">{filtros.tipoPrestamo === 'otorgado' ? 'Nombre' : 'Entidad'}</span>
                                <span className="hidden sm:inline">{filtros.tipoPrestamo === 'otorgado' ? 'Prestatario' : 'Entidad Financiera'}</span>
                            </label>
                            <input
                                type="text"
                                value={filtros.entidadFinanciera}
                                onChange={(e) => handleInputChange('entidadFinanciera', e.target.value)}
                                placeholder={filtros.tipoPrestamo === 'otorgado' ? 'Nombre...' : 'Entidad...'}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            />
                        </div>

                        {/* Búsqueda General */}
                <div>
                    <label className="block text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1">
                        Buscar
                    </label>
                    <input
                        type="text"
                        value={filtros.busqueda}
                        onChange={(e) => handleInputChange('busqueda', e.target.value)}
                        placeholder="Buscar..."
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>

            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                
                {/* Fecha Desde */}
                <div>
                    <label className="block text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1">
                        <span className="sm:hidden">Desde</span>
                        <span className="hidden sm:inline">Fecha Desde</span>
                    </label>
                    <input
                        type="date"
                        value={filtros.fechaDesde}
                        onChange={(e) => handleInputChange('fechaDesde', e.target.value)}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                
                {/* Fecha Hasta */}
                <div>
                    <label className="block text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1">
                        <span className="sm:hidden">Hasta</span>
                        <span className="hidden sm:inline">Fecha Hasta</span>
                    </label>
                    <input
                        type="date"
                        value={filtros.fechaHasta}
                        onChange={(e) => handleInputChange('fechaHasta', e.target.value)}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                
                {/* Monto Mínimo */}
                <div>
                    <label className="block text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1">
                        <span className="sm:hidden">Mín.</span>
                        <span className="hidden sm:inline">Monto Mínimo</span>
                    </label>
                    <input
                        type="number"
                        value={filtros.montoMinimo}
                        onChange={(e) => handleInputChange('montoMinimo', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                
                {/* Monto Máximo */}
                <div>
                    <label className="block text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1">
                        <span className="sm:hidden">Máx.</span>
                        <span className="hidden sm:inline">Monto Máximo</span>
                    </label>
                    <input
                        type="number"
                        value={filtros.montoMaximo}
                        onChange={(e) => handleInputChange('montoMaximo', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                
            </div>
                </div>
            </div>
        </div>
    );
});

PrestamosFilters.displayName = 'PrestamosFilters';

export { PrestamosFilters };
