import React, { useState } from 'react';
import { 
    Eye, 
    CheckCircle, 
    XCircle, 
    Clock, 
    ArrowUpCircle, 
    ArrowDownCircle,
    MoreVertical,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { movimientosCajaService } from '../../../services/movimientosCajaService';
import ModalDetalleMovimiento from './ModalDetalleMovimiento';

const TablaMovimientosFinanzas = ({ 
    movimientos, 
    onRefresh,
    paginacion = null,
    mostrandoTodos = false,
    onCargarMas = null,
    loadingMas = false
}) => {
    const [menuAbierto, setMenuAbierto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
    
    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const formatearMonto = (monto) => {
        return monto.toLocaleString('es-PE', { 
            style: 'currency', 
            currency: 'PEN',
            minimumFractionDigits: 2 
        });
    };
    
    const obtenerIconoTipo = (tipo) => {
        return tipo === 'ingreso' 
            ? <ArrowUpCircle className="w-4 h-4 text-green-600" />
            : <ArrowDownCircle className="w-4 h-4 text-red-600" />;
    };
    
    const obtenerEstadoBadge = (estado) => {
        const config = movimientosCajaService.constructor.formatearEstado(estado);
        
        const colores = {
            yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            blue: 'bg-blue-100 text-blue-800 border-blue-200',
            green: 'bg-green-100 text-green-800 border-green-200',
            red: 'bg-red-100 text-red-800 border-red-200',
            gray: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colores[config.color]}`}>
                <span className="mr-1">{config.icon}</span>
                {config.label}
            </span>
        );
    };
    
    const obtenerMetodoPagoInfo = (movimiento) => {
        // Nuevo esquema: usa tipoMovimiento
        const tipoMovimiento = movimiento?.tipoMovimiento;
        
        if (tipoMovimiento) {
            const info = {
                efectivo: { icono: '💵', texto: 'EFECTIVO' },
                bancario: { icono: '🏦', texto: 'BANCARIO' }
            };
            return info[tipoMovimiento] || { icono: '❓', texto: tipoMovimiento?.toUpperCase() || 'DESCONOCIDO' };
        }
        
        // Compatibilidad con esquema antiguo (metodoPago)
        const metodoPago = movimiento?.metodoPago;
        if (typeof metodoPago === 'string') {
            return {
                icono: '💳',
                texto: metodoPago.toUpperCase()
            };
        }
        
        if (metodoPago?.tipo) {
            const iconos = {
                efectivo: '💵',
                yape: '📱',
                plin: '📲',
                transferencia: '🏦',
                tarjeta: '💳'
            };
            
            return {
                icono: iconos[metodoPago.tipo] || '❓',
                texto: metodoPago.tipo.toUpperCase()
            };
        }
        
        return { icono: '❓', texto: 'N/A' };
    };

    // Funciones para el modal de detalle
    const abrirModalDetalle = (movimiento) => {
        setMovimientoSeleccionado(movimiento);
        setModalDetalleAbierto(true);
        setMenuAbierto(null);
    };

    const cerrarModalDetalle = () => {
        setModalDetalleAbierto(false);
        setMovimientoSeleccionado(null);
    };
    
    const manejarValidarMovimiento = async (id) => {
        if (!confirm('¿Está seguro de validar este movimiento?')) return;
        
        try {
            setLoading(true);
            const response = await movimientosCajaService.validarMovimiento(id);
            
            if (response.success) {
                alert('✅ Movimiento validado exitosamente');
                onRefresh && onRefresh();
            } else {
                alert(`❌ Error: ${response.message}`);
            }
        } catch (error) {
            console.error('Error validando movimiento:', error);
            alert(`❌ Error: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
            setMenuAbierto(null);
        }
    };
    
    const manejarAnularMovimiento = async (id) => {
        const motivo = prompt('Ingrese el motivo de anulación:');
        if (!motivo || !motivo.trim()) return;
        
        try {
            setLoading(true);
            const response = await movimientosCajaService.anularMovimiento(id, motivo.trim());
            
            if (response.success) {
                alert('✅ Movimiento anulado exitosamente');
                onRefresh && onRefresh();
            } else {
                alert(`❌ Error: ${response.message}`);
            }
        } catch (error) {
            console.error('Error anulando movimiento:', error);
            alert(`❌ Error: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
            setMenuAbierto(null);
        }
    };
    
    if (!movimientos || movimientos.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
                <div className="text-gray-500">
                    <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-base sm:text-lg font-medium">No hay movimientos registrados</p>
                    <p className="text-xs sm:text-sm">Los movimientos aparecerán aquí cuando se registren</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        📋 Historial de Movimientos
                    </h3>
                    <span className="text-xs sm:text-sm text-gray-500">
                        {movimientos.length} movimientos
                    </span>
                </div>
            </div>
            
            {/* Vista móvil - Cards */}
            <div className="block lg:hidden">
                <div className="divide-y divide-gray-200">
                    {movimientos.map((movimiento) => (
                        <div key={movimiento._id} className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                    {obtenerIconoTipo(movimiento.tipo)}
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">
                                            #{movimiento.codigo}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatearFecha(movimiento.fecha)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${
                                        movimiento.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatearMonto(movimiento.monto)}
                                    </p>
                                    {obtenerEstadoBadge(movimiento.estado)}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-sm text-gray-700">
                                    {movimiento.descripcion}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                        {obtenerMetodoPagoInfo(movimiento).icono} {obtenerMetodoPagoInfo(movimiento).texto}
                                    </span>
                                    <span>{movimiento.categoria}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <span className="text-xs text-gray-400">
                                    Usuario: {movimiento.usuario}
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={() => setMenuAbierto(menuAbierto === movimiento._id ? null : movimiento._id)}
                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    
                                    {menuAbierto === movimiento._id && (
                                        <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                            <button
                                                onClick={() => abrirModalDetalle(movimiento)}
                                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                            >
                                                <Eye className="w-3 h-3 mr-2" />
                                                Ver detalle
                                            </button>
                                            {movimiento.estado !== 'anulado' && (
                                                <button
                                                    onClick={() => manejarAnularMovimiento(movimiento._id)}
                                                    className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                                                >
                                                    <XCircle className="w-3 h-3 mr-2" />
                                                    Anular
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Vista desktop - Tabla */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Código / Fecha
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo / Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Descripción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Método / Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {movimientos.map((movimiento) => (
                            <tr key={movimiento._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            #{movimiento.codigo}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {formatearFecha(movimiento.fecha)}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {obtenerIconoTipo(movimiento.tipo)}
                                        <div className="ml-3">
                                            <div className="text-sm text-gray-500 capitalize">
                                                {movimiento.tipo}
                                            </div>
                                            <div className={`text-sm font-medium ${
                                                movimiento.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {formatearMonto(movimiento.monto)}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                        {movimiento.descripcion}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm text-gray-900 flex items-center">
                                            <span className="mr-2">{obtenerMetodoPagoInfo(movimiento).icono}</span>
                                            {obtenerMetodoPagoInfo(movimiento).texto}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {movimiento.categoria}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {obtenerEstadoBadge(movimiento.estado)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {movimiento.usuario}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuAbierto(menuAbierto === movimiento._id ? null : movimiento._id)}
                                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        
                                        {menuAbierto === movimiento._id && (
                                            <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                                <button
                                                    onClick={() => abrirModalDetalle(movimiento)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                >
                                                    <Eye className="w-4 h-4 mr-3" />
                                                    Ver detalle completo
                                                </button>
                                                {movimiento.estado !== 'anulado' && (
                                                    <button
                                                        onClick={() => manejarAnularMovimiento(movimiento._id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                                                        disabled={loading}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-3" />
                                                        Anular movimiento
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Información de paginación y botón "Mostrar más" */}
            {paginacion && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-sm text-gray-600">
                            Mostrando <span className="font-semibold text-gray-900">{movimientos.length}</span> de{' '}
                            <span className="font-semibold text-gray-900">{paginacion.totalRegistros}</span> movimientos
                        </div>
                        
                        {!mostrandoTodos && onCargarMas && (
                            <button
                                onClick={onCargarMas}
                                disabled={loadingMas}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {loadingMas ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Cargando...
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 mr-2" />
                                        Mostrar más ({Math.min(paginacion.limite, paginacion.totalRegistros - movimientos.length)} más)
                                    </>
                                )}
                            </button>
                        )}
                        
                        {mostrandoTodos && movimientos.length > 0 && (
                            <span className="text-sm text-green-600 font-medium">
                                ✓ Todos los movimientos cargados
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de detalle del movimiento */}
            <ModalDetalleMovimiento
                isOpen={modalDetalleAbierto}
                onClose={cerrarModalDetalle}
                movimiento={movimientoSeleccionado}
            />
        </div>
    );
};

export default TablaMovimientosFinanzas;
