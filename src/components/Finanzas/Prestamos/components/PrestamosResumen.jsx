import React, { useCallback } from 'react';
import { ClipboardList, CheckCircle, AlertTriangle, Coins } from 'lucide-react';

/**
 * Componente memoizado para mostrar resumen de préstamos
 * Muestra estadísticas clave de manera visual y clara
 */
const PrestamosResumen = React.memo(({ resumen, loading }) => {
    
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-3 sm:p-6 rounded-xl shadow border">
                        <div className="animate-pulse">
                            <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-6 sm:h-8 bg-gray-200 rounded"></div>
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
            icono: ClipboardList,
            color: 'blue',
            formato: 'numero'
        },
        {
            titulo: 'Préstamos Activos',
            valor: resumen.prestamosActivos || 0,
            icono: CheckCircle,
            color: 'green',
            formato: 'numero'
        },
        {
            titulo: 'Préstamos Vencidos',
            valor: resumen.prestamosVencidos || 0,
            icono: AlertTriangle,
            color: 'red',
            formato: 'numero'
        },
        {
            titulo: 'Monto Total',
            valor: resumen.montoTotal || 0,
            icono: Coins,
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
    
    // Títulos cortos para móvil
    const titulosCortos = {
        'Total Préstamos': 'Total',
        'Préstamos Activos': 'Activos',
        'Préstamos Vencidos': 'Vencidos',
        'Monto Total': 'Monto'
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {tarjetas.map((tarjeta, index) => {
                const Icono = tarjeta.icono;
                return (
                    <div 
                        key={index}
                        className={`p-3 sm:p-4 lg:p-6 rounded-xl shadow border-2 ${obtenerColores(tarjeta.color)}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] sm:text-xs lg:text-sm font-medium opacity-80 truncate">
                                    <span className="sm:hidden">{titulosCortos[tarjeta.titulo] || tarjeta.titulo}</span>
                                    <span className="hidden sm:inline">{tarjeta.titulo}</span>
                                </p>
                                <p className="text-sm sm:text-lg lg:text-2xl font-bold mt-0.5 sm:mt-1 truncate">
                                    {formatearValor(tarjeta.valor, tarjeta.formato)}
                                </p>
                            </div>
                            <div className="opacity-60 ml-1 sm:ml-2 flex-shrink-0">
                                <Icono className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

PrestamosResumen.displayName = 'PrestamosResumen';

export { PrestamosResumen };
