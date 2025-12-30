import React, { useCallback } from 'react';

/**
 * Componente memoizado para filtros de préstamos
 * Interfaz optimizada para filtrado y búsqueda
 */
const PrestamosFilters = React.memo(({ 
    filtros, 
    onFiltrosChange, 
    onLimpiarFiltros, 
    loading 
}) => {
    
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
    
    return (
        <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                <button
                    onClick={handleLimpiar}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                    disabled={loading}
                >
                    Limpiar filtros
                </button>
            </div>
            
            {/* NUEVO: Filtro principal por Tipo de Préstamo */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Préstamo
                </label>
                <div className="flex flex-wrap gap-2">
                    {tiposPrestamo.map(tipo => (
                        <button
                            key={tipo.value}
                            type="button"
                            onClick={() => handleInputChange('tipoPrestamo', tipo.value)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                (filtros.tipoPrestamo || '') === tipo.value
                                    ? tipo.value === 'recibido'
                                        ? 'bg-indigo-600 text-white'
                                        : tipo.value === 'otorgado'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {tipo.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                {/* Estado */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                    </label>
                    <select
                        value={filtros.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Crédito
                    </label>
                    <select
                        value={filtros.tipoCredito}
                        onChange={(e) => handleInputChange('tipoCredito', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {filtros.tipoPrestamo === 'otorgado' ? 'Prestatario' : 'Entidad Financiera'}
                    </label>
                    <input
                        type="text"
                        value={filtros.entidadFinanciera}
                        onChange={(e) => handleInputChange('entidadFinanciera', e.target.value)}
                        placeholder={filtros.tipoPrestamo === 'otorgado' ? 'Nombre del prestatario...' : 'Nombre de la entidad...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>

                {/* Búsqueda General */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Búsqueda
                    </label>
                    <input
                        type="text"
                        value={filtros.busqueda}
                        onChange={(e) => handleInputChange('busqueda', e.target.value)}
                        placeholder="Buscar en préstamos..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>

            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Fecha Desde */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Desde
                    </label>
                    <input
                        type="date"
                        value={filtros.fechaDesde}
                        onChange={(e) => handleInputChange('fechaDesde', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                
                {/* Fecha Hasta */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Hasta
                    </label>
                    <input
                        type="date"
                        value={filtros.fechaHasta}
                        onChange={(e) => handleInputChange('fechaHasta', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                
                {/* Monto Mínimo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto Mínimo
                    </label>
                    <input
                        type="number"
                        value={filtros.montoMinimo}
                        onChange={(e) => handleInputChange('montoMinimo', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                
                {/* Monto Máximo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto Máximo
                    </label>
                    <input
                        type="number"
                        value={filtros.montoMaximo}
                        onChange={(e) => handleInputChange('montoMaximo', e.target.value)}
                        placeholder="999999.99"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                
            </div>
        </div>
    );
});

PrestamosFilters.displayName = 'PrestamosFilters';

export { PrestamosFilters };
