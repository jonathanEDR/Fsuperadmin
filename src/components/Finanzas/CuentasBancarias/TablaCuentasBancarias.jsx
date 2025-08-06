import React, { useState } from 'react';
import { finanzasService } from '../../../services/finanzasService';

/**
 * Componente completo para cuentas bancarias - Tarjetas + Tabla optimizada
 */
const TablaCuentasBancarias = ({ 
    cuentas = [], 
    resumenCuentas = null,
    loading = false,
    paginacion = null,
    onPaginaChange,
    acciones = [],
    seleccionMultiple = false,
    onSeleccionChange
}) => {
    const [filasSeleccionadas, setFilasSeleccionadas] = useState(new Set());
    const [ordenamiento, setOrdenamiento] = useState({ campo: null, direccion: 'asc' });

    // Asegurar que cuentas sea siempre un array
    const cuentasSeguras = Array.isArray(cuentas) ? cuentas : [];

    const manejarSeleccionFila = (id) => {
        const nuevasSeleccionadas = new Set(filasSeleccionadas);
        if (nuevasSeleccionadas.has(id)) {
            nuevasSeleccionadas.delete(id);
        } else {
            nuevasSeleccionadas.add(id);
        }
        setFilasSeleccionadas(nuevasSeleccionadas);
        if (onSeleccionChange) {
            onSeleccionChange(Array.from(nuevasSeleccionadas));
        }
    };

    const manejarSeleccionTodos = () => {
        if (filasSeleccionadas.size === cuentasSeguras.length) {
            setFilasSeleccionadas(new Set());
            if (onSeleccionChange) onSeleccionChange([]);
        } else {
            const todasLasIds = new Set(cuentasSeguras.map(cuenta => cuenta.id || cuenta._id));
            setFilasSeleccionadas(todasLasIds);
            if (onSeleccionChange) onSeleccionChange(Array.from(todasLasIds));
        }
    };

    const manejarOrdenamiento = (campo) => {
        const nuevaDireccion = 
            ordenamiento.campo === campo && ordenamiento.direccion === 'asc' 
                ? 'desc' 
                : 'asc';
        setOrdenamiento({ campo, direccion: nuevaDireccion });
    };

    const renderCodigo = (codigo) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {codigo}
        </span>
    );

    const renderNumeroCuenta = (numero) => `***${numero.slice(-4)}`;

    const renderSaldo = (saldo, moneda) => {
        const saldoNum = typeof saldo === 'number' ? saldo : parseFloat(saldo) || 0;
        return (
            <span className={`font-semibold ${saldoNum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {finanzasService.formatearMoneda(saldoNum, moneda)}
            </span>
        );
    };

    const renderMoneda = (moneda) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            {moneda}
        </span>
    );

    const renderEstado = (activa) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
            {activa ? 'Activa' : 'Inactiva'}
        </span>
    );

    // Componente para las tarjetas de resumen
    const TarjetaResumen = ({ titulo, valor, moneda, icono, color }) => {
        const colorClasses = {
            green: 'bg-green-50 border-green-200',
            blue: 'bg-blue-50 border-blue-200',
            purple: 'bg-purple-50 border-purple-200',
            gray: 'bg-gray-50 border-gray-200',
            yellow: 'bg-yellow-50 border-yellow-200'
        };

        const iconColorClasses = {
            green: 'text-green-600',
            blue: 'text-blue-600',
            purple: 'text-purple-600',
            gray: 'text-gray-600',
            yellow: 'text-yellow-600'
        };

        const valorFormateado = moneda 
            ? finanzasService.formatearMoneda(valor || 0, moneda)
            : (valor || 0).toString();

        return (
            <div className={`p-4 sm:p-6 rounded-lg border ${colorClasses[color] || colorClasses.gray}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">{titulo}</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                            {valorFormateado}
                        </p>
                    </div>
                    <div className={`text-2xl sm:text-3xl ${iconColorClasses[color] || iconColorClasses.gray}`}>
                        {icono}
                    </div>
                </div>
            </div>
        );
    };

    // Renderizar las tarjetas de resumen
    const renderTarjetasResumen = () => {
        if (!resumenCuentas || !resumenCuentas.estadisticas) return null;

        const stats = resumenCuentas.estadisticas;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <TarjetaResumen
                    titulo="Total en Soles"
                    valor={stats.saldoTotalPEN}
                    moneda="PEN"
                    icono="💰"
                    color="green"
                />
                
                <TarjetaResumen
                    titulo="Total en Dólares"
                    valor={stats.saldoTotalUSD}
                    moneda="USD"
                    icono="💵"
                    color="blue"
                />
                
                <TarjetaResumen
                    titulo="Cuentas Activas"
                    valor={stats.cuentasActivas}
                    icono="🏦"
                    color="purple"
                />
                
                <TarjetaResumen
                    titulo="Total Cuentas"
                    valor={stats.totalCuentas}
                    icono="📊"
                    color="gray"
                />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Skeleton para tarjetas de resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-4 sm:p-6 bg-white rounded-lg border animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Skeleton para tabla */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b">
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex space-x-4">
                                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tarjetas de resumen */}
            {renderTarjetasResumen()}
            
            {/* Tabla de cuentas */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                    🏦 Cuentas Bancarias ({cuentasSeguras.length})
                </h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {seleccionMultiple && (
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={cuentasSeguras.length > 0 && filasSeleccionadas.size === cuentasSeguras.length}
                                        onChange={manejarSeleccionTodos}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                            )}
                            
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => manejarOrdenamiento('codigo')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Código</span>
                                    <span className="text-gray-400">
                                        {ordenamiento.campo === 'codigo' ? (
                                            ordenamiento.direccion === 'asc' ? '↑' : '↓'
                                        ) : '↕️'}
                                    </span>
                                </div>
                            </th>
                            
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => manejarOrdenamiento('nombre')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Nombre</span>
                                    <span className="text-gray-400">
                                        {ordenamiento.campo === 'nombre' ? (
                                            ordenamiento.direccion === 'asc' ? '↑' : '↓'
                                        ) : '↕️'}
                                    </span>
                                </div>
                            </th>
                            
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Banco
                            </th>
                            
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Número
                            </th>
                            
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => manejarOrdenamiento('saldoActual')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Saldo</span>
                                    <span className="text-gray-400">
                                        {ordenamiento.campo === 'saldoActual' ? (
                                            ordenamiento.direccion === 'asc' ? '↑' : '↓'
                                        ) : '↕️'}
                                    </span>
                                </div>
                            </th>
                            
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Moneda
                            </th>
                            
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            
                            {acciones.length > 0 && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cuentasSeguras.length === 0 ? (
                            <tr>
                                <td 
                                    colSpan={8 + (seleccionMultiple ? 1 : 0) + (acciones.length > 0 ? 1 : 0)}
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="text-4xl mb-2">🏦</div>
                                        <div className="text-lg font-medium">No hay cuentas bancarias</div>
                                        <div className="text-sm">Crea tu primera cuenta para comenzar</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            cuentasSeguras.map((cuenta, index) => (
                                <tr 
                                    key={cuenta.id || cuenta._id || index}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {seleccionMultiple && (
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={filasSeleccionadas.has(cuenta.id || cuenta._id)}
                                                onChange={() => manejarSeleccionFila(cuenta.id || cuenta._id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                    )}
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {renderCodigo(cuenta.codigo)}
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {cuenta.nombre}
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {cuenta.banco}
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {cuenta.tipoCuenta}
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {renderNumeroCuenta(cuenta.numeroCuenta)}
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {renderSaldo(cuenta.saldoActual, cuenta.moneda)}
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {renderMoneda(cuenta.moneda)}
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {renderEstado(cuenta.activa)}
                                    </td>
                                    
                                    {acciones.length > 0 && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {acciones.map((accion, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => accion.handler(cuenta)}
                                                        className={`
                                                            px-3 py-1 rounded text-sm font-medium transition-colors
                                                            ${accion.color === 'red' 
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : accion.color === 'green'
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : accion.color === 'blue'
                                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                : accion.color === 'yellow'
                                                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }
                                                        `}
                                                        title={accion.titulo}
                                                    >
                                                        {accion.icono || accion.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {paginacion && (
                <div className="px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-500">
                        Mostrando {((paginacion.paginaActual - 1) * paginacion.registrosPorPagina) + 1} a{' '}
                        {Math.min(paginacion.paginaActual * paginacion.registrosPorPagina, paginacion.totalRegistros)} de{' '}
                        {paginacion.totalRegistros} registros
                    </div>
                    
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onPaginaChange && onPaginaChange(paginacion.paginaActual - 1)}
                            disabled={paginacion.paginaActual <= 1}
                            className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
                            {paginacion.paginaActual} de {paginacion.totalPaginas}
                        </span>
                        
                        <button
                            onClick={() => onPaginaChange && onPaginaChange(paginacion.paginaActual + 1)}
                            disabled={paginacion.paginaActual >= paginacion.totalPaginas}
                            className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default TablaCuentasBancarias;
