import React from 'react';
import { formatearMoneda } from '../garantiasConfig';

/**
 * Componente que muestra tarjetas de resumen de garantías
 */
const GarantiasResumen = ({ resumen, loading = false }) => {
    // Datos por defecto si no hay resumen
    const datos = resumen || {
        totalGarantias: 0,
        garantiasActivas: 0,
        garantiasPendientes: 0,
        garantiasEjecutadas: 0,
        valorComercialTotal: 0,
        valorTasacionTotal: 0
    };

    const tarjetas = [
        {
            titulo: 'Total Garantías',
            valor: datos.totalGarantias || 0,
            icono: '📋',
            color: 'bg-blue-50 border-blue-200',
            textoColor: 'text-blue-700',
            formato: 'numero'
        },
        {
            titulo: 'Activas',
            valor: datos.garantiasActivas || 0,
            icono: '🔒',
            color: 'bg-green-50 border-green-200',
            textoColor: 'text-green-700',
            formato: 'numero'
        },
        {
            titulo: 'Pendientes',
            valor: datos.garantiasPendientes || 0,
            icono: '⏳',
            color: 'bg-yellow-50 border-yellow-200',
            textoColor: 'text-yellow-700',
            formato: 'numero'
        },
        {
            titulo: 'Ejecutadas',
            valor: datos.garantiasEjecutadas || 0,
            icono: '⚖️',
            color: 'bg-purple-50 border-purple-200',
            textoColor: 'text-purple-700',
            formato: 'numero'
        },
        {
            titulo: 'Valor Comercial Total',
            valor: datos.valorComercialTotal || 0,
            icono: '💰',
            color: 'bg-emerald-50 border-emerald-200',
            textoColor: 'text-emerald-700',
            formato: 'moneda'
        },
        {
            titulo: 'Valor Tasación Total',
            valor: datos.valorTasacionTotal || 0,
            icono: '📊',
            color: 'bg-indigo-50 border-indigo-200',
            textoColor: 'text-indigo-700',
            formato: 'moneda'
        }
    ];

    const formatearValor = (valor, formato) => {
        if (formato === 'moneda') {
            return formatearMoneda(valor);
        }
        return valor.toLocaleString('es-PE');
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {[...Array(6)].map((_, index) => (
                    <div
                        key={index}
                        className="bg-gray-100 rounded-lg p-4 animate-pulse"
                    >
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {tarjetas.map((tarjeta, index) => (
                <div
                    key={index}
                    className={`${tarjeta.color} border rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600 truncate">
                            {tarjeta.titulo}
                        </span>
                        <span className="text-lg">{tarjeta.icono}</span>
                    </div>
                    <div className={`text-xl font-bold ${tarjeta.textoColor} truncate`}>
                        {formatearValor(tarjeta.valor, tarjeta.formato)}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GarantiasResumen;
