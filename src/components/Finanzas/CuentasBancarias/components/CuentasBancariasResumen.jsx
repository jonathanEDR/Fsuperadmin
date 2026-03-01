import React, { memo, useMemo } from 'react';
import { Landmark, CheckCircle, Coins, CheckSquare, Banknote } from 'lucide-react';

/**
 * Componente optimizado para mostrar tarjetas de resumen de cuentas bancarias
 * Memoizado para evitar renders innecesarios
 * Separado para mejor modularidad y reutilización
 */
const CuentasBancariasResumen = memo(({ computedData, loading }) => {
    
    // Formatear números con separadores de miles
    const formatCurrency = (amount, currency = 'PEN') => {
        const symbols = {
            'PEN': 'S/',
            'USD': '$',
            'EUR': '€'
        };
        
        return `${symbols[currency] || 'S/'} ${Number(amount).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };
    
    // Tarjetas de resumen principales memoizadas
    const summaryCards = useMemo(() => [
        {
            title: 'Total Cuentas',
            value: computedData.totalCuentas,
            icon: Landmark,
            color: 'primary',
            subtitle: `${computedData.cuentasActivas} activas, ${computedData.cuentasInactivas} inactivas`
        },
        {
            title: 'Cuentas Activas',
            value: computedData.cuentasActivas,
            icon: CheckCircle,
            color: 'success',
            subtitle: `${((computedData.cuentasActivas / computedData.totalCuentas) * 100 || 0).toFixed(1)}% del total`
        },
        {
            title: 'Saldo Total',
            value: formatCurrency(computedData.totalSaldo),
            icon: Coins,
            color: 'info',
            subtitle: 'Todas las monedas'
        },
        {
            title: 'Seleccionadas',
            value: computedData.selectedCount,
            icon: CheckSquare,
            color: computedData.hasSelection ? 'warning' : 'secondary',
            subtitle: computedData.hasSelection ? 'cuentas seleccionadas' : 'ninguna selección'
        }
    ], [computedData, formatCurrency]);
    
    const hasMultipleCurrencies = Object.keys(computedData.saldoPorMoneda).length > 1;
    
    if (loading) {
        return (
            <div className="row mb-4">
                {[1, 2, 3, 4].map(index => (
                    <div key={index} className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-primary shadow h-100 py-2">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-6"></span>
                                            <br />
                                            <span className="placeholder col-8"></span>
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-12" style={{ width: '40px', height: '40px' }}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    return (
        <div className="row mb-4">
            {summaryCards.map((card, index) => (
                <div key={index} className="col-xl-3 col-md-6 mb-4">
                    <div className={`card border-left-${card.color} shadow h-100 py-2`}>
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className={`text-xs font-weight-bold text-${card.color} text-uppercase mb-1`}>
                                        {card.title}
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {card.value}
                                    </div>
                                    {card.subtitle && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            {card.subtitle}
                                        </div>
                                    )}
                                </div>
                                <div className="col-auto">
                                    <card.icon size={24} className="text-gray-300" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Resumen por moneda si hay múltiples monedas */}
            {hasMultipleCurrencies && (
                <div className="col-12">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 font-weight-bold text-primary">
                                <Coins size={16} className="mr-2" />
                                Saldos por Moneda
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {Object.entries(computedData.saldoPorMoneda).map(([moneda, saldo]) => (
                                    <div key={moneda} className="col-md-4 mb-3">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <div className="small font-weight-bold text-primary text-uppercase">
                                                    {moneda}
                                                </div>
                                                <div className="h6 mb-0 font-weight-bold text-gray-800">
                                                    {formatCurrency(saldo, moneda)}
                                                </div>
                                            </div>
                                            <div className="text-gray-400">
                                                <Banknote size={24} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

CuentasBancariasResumen.displayName = 'CuentasBancariasResumen';

export default CuentasBancariasResumen;
