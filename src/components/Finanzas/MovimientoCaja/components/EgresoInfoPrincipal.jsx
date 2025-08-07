import React, { memo } from 'react';

/**
 * Componente optimizado para información principal del egreso
 * Memoizado para evitar re-renders innecesarios
 */
const EgresoInfoPrincipal = memo(({ 
    formData, 
    categorias, 
    onInputChange,
    className = ""
}) => {
    console.log('🔄 [EgresoInfoPrincipal] Render');

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                📝 Información Principal
            </h3>
            
            {/* Monto y Concepto en 2 columnas */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Monto *
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.monto}
                        onChange={(e) => onInputChange('monto', e.target.value)}
                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                        placeholder="0.00"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Concepto *
                    </label>
                    <input
                        type="text"
                        value={formData.concepto}
                        onChange={(e) => onInputChange('concepto', e.target.value)}
                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Concepto del egreso"
                        required
                    />
                </div>
            </div>
            
            {/* Descripción a ancho completo */}
            <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Descripción
                </label>
                <textarea
                    value={formData.descripcion}
                    onChange={(e) => onInputChange('descripcion', e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Descripción detallada del egreso"
                    rows="3"
                />
            </div>
            
            {/* Categoría */}
            <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Categoría *
                </label>
                <select
                    value={formData.categoria}
                    onChange={(e) => onInputChange('categoria', e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((categoria) => (
                        <option key={categoria.value} value={categoria.value}>
                            {categoria.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
});

EgresoInfoPrincipal.displayName = 'EgresoInfoPrincipal';

export default EgresoInfoPrincipal;
