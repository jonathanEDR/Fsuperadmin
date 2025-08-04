import React from 'react';

/**
 * Componente para mostrar tarjetas de resumen financiero
 */
const TarjetaFinanciera = ({ 
    titulo, 
    valor, 
    moneda = 'PEN', 
    icono, 
    tendencia, 
    porcentajeCambio,
    color = 'blue',
    onClick,
    loading = false
}) => {
    const formatearValor = (valor, moneda) => {
        const simbolos = {
            'PEN': 'S/',
            'USD': '$',
            'EUR': '€'
        };
        
        if (typeof valor === 'number') {
            return `${simbolos[moneda] || 'S/'} ${valor.toLocaleString('es-PE', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
            })}`;
        }
        return valor;
    };

    const obtenerColorTendencia = (tendencia) => {
        switch (tendencia) {
            case 'up': return 'text-green-600';
            case 'down': return 'text-red-600';
            default: return 'text-gray-500';
        }
    };

    const obtenerIconoTendencia = (tendencia) => {
        switch (tendencia) {
            case 'up': return '↗️';
            case 'down': return '↘️';
            default: return '➡️';
        }
    };

    const colores = {
        blue: 'bg-blue-50 border-blue-200 text-blue-800',
        green: 'bg-green-50 border-green-200 text-green-800',
        red: 'bg-red-50 border-red-200 text-red-800',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        purple: 'bg-purple-50 border-purple-200 text-purple-800',
        gray: 'bg-gray-50 border-gray-200 text-gray-800'
    };

    return (
        <div 
            className={`
                p-6 rounded-lg border-2 shadow-sm transition-all duration-200
                ${colores[color]}
                ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
                ${loading ? 'animate-pulse' : ''}
            `}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                        {titulo}
                    </p>
                    <p className="text-2xl font-bold mb-2">
                        {loading ? (
                            <span className="bg-gray-200 h-8 w-32 rounded animate-pulse block"></span>
                        ) : (
                            formatearValor(valor, moneda)
                        )}
                    </p>
                    
                    {porcentajeCambio && tendencia && !loading && (
                        <div className={`flex items-center text-sm ${obtenerColorTendencia(tendencia)}`}>
                            <span className="mr-1">{obtenerIconoTendencia(tendencia)}</span>
                            <span>{Math.abs(porcentajeCambio)}%</span>
                        </div>
                    )}
                </div>
                
                {icono && (
                    <div className="text-3xl opacity-80">
                        {icono}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TarjetaFinanciera;
