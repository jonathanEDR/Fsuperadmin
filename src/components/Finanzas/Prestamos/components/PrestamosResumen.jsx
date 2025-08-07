import React, { useCallback } from 'react';

/**
 * Componente memoizado para mostrar resumen de préstamos
 * Muestra estadísticas clave de manera visual y clara
 */
const PrestamosResumen = React.memo(({ resumen, loading }) => {
    
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow border">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (!resumen) {
        return null;
    }
    
    const tarjetas = [
        {
            titulo: 'Total Préstamos',
            valor: resumen.totalPrestamos || 0,
            icono: '📋',
            color: 'blue',
            formato: 'numero'
        },
        {
            titulo: 'Préstamos Activos',
            valor: resumen.prestamosActivos || 0,
            icono: '✅',
            color: 'green',
            formato: 'numero'
        },
        {
            titulo: 'Préstamos Vencidos',
            valor: resumen.prestamosVencidos || 0,
            icono: '⚠️',
            color: 'red',
            formato: 'numero'
        },
        {
            titulo: 'Monto Total',
            valor: resumen.montoTotal || 0,
            icono: '💰',
            color: 'yellow',
            formato: 'moneda'
        }
    ];
    
    // Formatear valores memoizado
    const formatearValor = useCallback((valor, formato) => {
        switch (formato) {
            case 'moneda':
                return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
            case 'numero':
                return valor.toLocaleString('es-PE');
            default:
                return valor;
        }
    }, []);
    
    // Obtener colores memoizado
    const obtenerColores = useCallback((color) => {
        const colores = {
            blue: 'bg-blue-50 border-blue-200 text-blue-800',
            green: 'bg-green-50 border-green-200 text-green-800',
            red: 'bg-red-50 border-red-200 text-red-800',
            yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };
        return colores[color] || colores.blue;
    }, []);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tarjetas.map((tarjeta, index) => (
                <div 
                    key={index}
                    className={`p-6 rounded-lg shadow border-2 ${obtenerColores(tarjeta.color)}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium opacity-80">
                                {tarjeta.titulo}
                            </p>
                            <p className="text-2xl font-bold mt-1">
                                {formatearValor(tarjeta.valor, tarjeta.formato)}
                            </p>
                        </div>
                        <div className="text-3xl opacity-60">
                            {tarjeta.icono}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
});

PrestamosResumen.displayName = 'PrestamosResumen';

export { PrestamosResumen };
