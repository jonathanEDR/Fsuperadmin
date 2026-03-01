import React, { memo, useMemo } from 'react';
import { finanzasService } from '../../../../services/finanzas/finanzasService';

/**
 * Componente memoizado para fila de tabla de cuenta bancaria
 * Optimizado para máximo rendimiento con memoización inteligente
 */
const CuentasBancariasTableRow = memo(({
    cuenta,
    seleccionMultiple,
    estaSeleccionada,
    onSeleccion,
    acciones,
    columnas
}) => {
    
    const cuentaId = useMemo(() => cuenta.id || cuenta._id, [cuenta.id, cuenta._id]);

    // Handlers memoizados
    const handleSeleccion = useMemo(() => () => {
        onSeleccion(cuentaId);
    }, [onSeleccion, cuentaId]);

    // Funciones de renderizado memoizadas
    const renderers = useMemo(() => ({
        codigo: (valor) => (
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {valor}
            </span>
        ),
        
        nombre: (valor) => (
            <span className="font-medium text-gray-900">
                {valor}
            </span>
        ),
        
        banco: (valor) => (
            <span className="text-gray-900">
                {valor}
            </span>
        ),
        
        tipoCuenta: (valor) => (
            <span className="text-gray-900">
                {valor}
            </span>
        ),
        
        numeroCuenta: (valor) => (
            <span className="font-mono text-gray-500">
                ***{String(valor).slice(-4)}
            </span>
        ),
        
        saldoActual: (valor, cuenta) => {
            const saldoNum = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
            return (
                <span className={`font-semibold ${saldoNum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {finanzasService.formatearMoneda(saldoNum, cuenta.moneda)}
                </span>
            );
        },
        
        moneda: (valor) => (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {valor}
            </span>
        ),
        
        activa: (valor) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                valor ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {valor ? 'Activa' : 'Inactiva'}
            </span>
        )
    }), []);

    // Renderizar acciones
    const renderAcciones = useMemo(() => {
        if (!acciones.length) return null;
        
        return (
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
                            aria-label={accion.titulo}
                        >
                            {accion.icono || accion.label}
                        </button>
                    ))}
                </div>
            </td>
        );
    }, [acciones, cuenta]);

    // Renderizar celda por columna
    const renderCelda = (columna) => {
        const valor = cuenta[columna.key];
        const renderer = renderers[columna.key];
        
        if (renderer) {
            return renderer(valor, cuenta);
        }
        
        // Fallback para columnas no definidas
        return <span className="text-gray-900">{String(valor || '')}</span>;
    };

    return (
        <tr 
            className="hover:bg-gray-50 transition-colors"
            role="row"
            aria-selected={estaSeleccionada}
        >
            {/* Checkbox de selección */}
            {seleccionMultiple && (
                <td className="px-6 py-4 whitespace-nowrap">
                    <input
                        type="checkbox"
                        checked={estaSeleccionada}
                        onChange={handleSeleccion}
                        className="rounded border-gray-200 text-blue-600 focus:ring-blue-500"
                        aria-label={`Seleccionar cuenta ${cuenta.nombre}`}
                    />
                </td>
            )}
            
            {/* Celdas de datos */}
            {columnas.map((columna) => (
                <td 
                    key={columna.key}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                >
                    {renderCelda(columna)}
                </td>
            ))}
            
            {/* Acciones */}
            {renderAcciones}
        </tr>
    );
});

CuentasBancariasTableRow.displayName = 'CuentasBancariasTableRow';

export default CuentasBancariasTableRow;
