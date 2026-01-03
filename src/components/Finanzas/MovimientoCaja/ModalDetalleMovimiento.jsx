import React from 'react';
import { 
    X, 
    ArrowUpCircle, 
    ArrowDownCircle,
    Calendar,
    DollarSign,
    FileText,
    User,
    CreditCard,
    Tag,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building,
    Hash,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    Zap
} from 'lucide-react';

/**
 * Modal para mostrar el detalle completo de un movimiento de caja
 */
const ModalDetalleMovimiento = ({ isOpen, onClose, movimiento }) => {
    if (!isOpen || !movimiento) return null;

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-PE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatearMonto = (monto) => {
        return (monto || 0).toLocaleString('es-PE', { 
            style: 'currency', 
            currency: 'PEN',
            minimumFractionDigits: 2 
        });
    };

    const obtenerConfigEstado = (estado) => {
        const config = {
            pendiente: { 
                color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
                icon: <Clock className="w-4 h-4" />,
                label: 'Pendiente'
            },
            aplicado: { 
                color: 'bg-green-100 text-green-800 border-green-300', 
                icon: <CheckCircle className="w-4 h-4" />,
                label: 'Aplicado'
            },
            anulado: { 
                color: 'bg-red-100 text-red-800 border-red-300', 
                icon: <XCircle className="w-4 h-4" />,
                label: 'Anulado'
            }
        };
        return config[estado] || { 
            color: 'bg-gray-100 text-gray-800 border-gray-300', 
            icon: <AlertCircle className="w-4 h-4" />,
            label: estado || 'Desconocido'
        };
    };

    const obtenerMetodoPagoInfo = () => {
        const tipoMovimiento = movimiento?.tipoMovimiento;
        
        if (tipoMovimiento) {
            const info = {
                efectivo: { icono: '💵', texto: 'Efectivo', color: 'text-green-600' },
                bancario: { icono: '🏦', texto: 'Bancario', color: 'text-blue-600' }
            };
            return info[tipoMovimiento] || { icono: '❓', texto: tipoMovimiento, color: 'text-gray-600' };
        }
        
        const metodoPago = movimiento?.metodoPago;
        if (typeof metodoPago === 'string') {
            const info = {
                efectivo: { icono: '💵', texto: 'Efectivo', color: 'text-green-600' },
                transferencia: { icono: '🏦', texto: 'Transferencia', color: 'text-blue-600' },
                yape: { icono: '📱', texto: 'Yape', color: 'text-purple-600' },
                plin: { icono: '📲', texto: 'Plin', color: 'text-cyan-600' },
                tarjeta: { icono: '💳', texto: 'Tarjeta', color: 'text-indigo-600' },
                deposito: { icono: '🏧', texto: 'Depósito', color: 'text-blue-600' },
                cheque: { icono: '📄', texto: 'Cheque', color: 'text-gray-600' }
            };
            return info[metodoPago] || { icono: '❓', texto: metodoPago, color: 'text-gray-600' };
        }
        
        return { icono: '❓', texto: 'No especificado', color: 'text-gray-600' };
    };

    const obtenerCategoriaFormateada = (categoria) => {
        if (!categoria) return 'Sin categoría';
        
        const categorias = {
            'venta_directa': 'Venta Directa',
            'venta_producto': 'Venta de Producto',
            'cobro': 'Cobro',
            'devolucion_proveedor': 'Devolución Proveedor',
            'prestamo_recibido': 'Préstamo Recibido',
            'ingreso_extra': 'Ingreso Extra',
            'pago_personal': 'Pago Personal',
            'pago_personal_finanzas': 'Pago Personal (Finanzas)',
            'pago_personal_produccion': 'Pago Personal (Producción)',
            'pago_personal_ventas': 'Pago Personal (Ventas)',
            'pago_personal_admin': 'Pago Personal (Admin)',
            'materia_prima': 'Materia Prima',
            'materia_prima_finanzas': 'Materia Prima (Finanzas)',
            'materia_prima_produccion': 'Materia Prima (Producción)',
            'materia_prima_ventas': 'Materia Prima (Ventas)',
            'materia_prima_admin': 'Materia Prima (Admin)',
            'otros': 'Otros',
            'otros_finanzas': 'Otros (Finanzas)',
            'otros_produccion': 'Otros (Producción)',
            'otros_ventas': 'Otros (Ventas)',
            'otros_admin': 'Otros (Admin)',
            'pago_proveedor': 'Pago a Proveedor',
            'gasto_operativo': 'Gasto Operativo',
            'servicio_basico': 'Servicio Básico',
            'alquiler': 'Alquiler',
            'transporte': 'Transporte',
            'marketing': 'Marketing',
            'impuestos': 'Impuestos',
            'egreso_extra': 'Egreso Extra',
            'pago_cuota_prestamo': 'Pago Cuota Préstamo',
            'cuota_prestamo': 'Cuota de Préstamo'
        };
        
        return categorias[categoria] || categoria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const esIngreso = movimiento.tipo === 'ingreso';
    const estadoConfig = obtenerConfigEstado(movimiento.estado);
    const metodoPagoInfo = obtenerMetodoPagoInfo();

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all">
                    
                    {/* Header */}
                    <div className={`${esIngreso ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-full p-2">
                                    {esIngreso 
                                        ? <ArrowUpCircle className="w-6 h-6 text-white" />
                                        : <ArrowDownCircle className="w-6 h-6 text-white" />
                                    }
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Detalle de {esIngreso ? 'Ingreso' : 'Egreso'}
                                    </h3>
                                    <p className="text-white/80 text-sm">
                                        #{movimiento.codigo}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Contenido con scroll */}
                    <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                        
                        {/* Monto Principal */}
                        <div className={`text-center py-6 rounded-xl mb-6 ${esIngreso ? 'bg-green-50' : 'bg-red-50'}`}>
                            <p className="text-sm text-gray-500 mb-1">Monto</p>
                            <p className={`text-4xl font-bold ${esIngreso ? 'text-green-600' : 'text-red-600'}`}>
                                {esIngreso ? '+' : '-'} {formatearMonto(movimiento.monto)}
                            </p>
                            <div className="mt-3">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${estadoConfig.color}`}>
                                    {estadoConfig.icon}
                                    {estadoConfig.label}
                                </span>
                            </div>
                        </div>

                        {/* Grid de información */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Fecha */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Fecha</span>
                                </div>
                                <p className="text-sm text-gray-900 capitalize">
                                    {formatearFecha(movimiento.fecha)}
                                </p>
                            </div>

                            {/* Método de Pago */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Método de Pago</span>
                                </div>
                                <p className={`text-sm font-medium ${metodoPagoInfo.color}`}>
                                    <span className="mr-2">{metodoPagoInfo.icono}</span>
                                    {metodoPagoInfo.texto}
                                </p>
                            </div>

                            {/* Categoría */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <Tag className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Categoría</span>
                                </div>
                                <p className="text-sm text-gray-900">
                                    {obtenerCategoriaFormateada(movimiento.categoria)}
                                </p>
                            </div>

                            {/* Usuario */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <User className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Registrado por</span>
                                </div>
                                <p className="text-sm text-gray-900">
                                    {movimiento.usuario || movimiento.creadorNombre || 'No especificado'}
                                </p>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="mt-4 bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <FileText className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Descripción</span>
                            </div>
                            <p className="text-sm text-gray-900">
                                {movimiento.descripcion || 'Sin descripción'}
                            </p>
                        </div>

                        {/* Información de saldos */}
                        {(movimiento.saldoAnterior !== undefined || movimiento.saldoActual !== undefined) && (
                            <div className="mt-4 bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-blue-600 mb-3">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Movimiento de Saldo</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-gray-500">Saldo Anterior</p>
                                        <p className="text-lg font-semibold text-gray-700">
                                            {formatearMonto(movimiento.saldoAnterior)}
                                        </p>
                                    </div>
                                    <div className="px-4">
                                        {esIngreso 
                                            ? <TrendingUp className="w-6 h-6 text-green-500" />
                                            : <TrendingDown className="w-6 h-6 text-red-500" />
                                        }
                                    </div>
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-gray-500">Saldo Actual</p>
                                        <p className="text-lg font-semibold text-gray-700">
                                            {formatearMonto(movimiento.saldoActual)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Información adicional condicional */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Colaborador */}
                            {movimiento.colaboradorNombre && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <User className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Colaborador</span>
                                    </div>
                                    <p className="text-sm text-gray-900">
                                        {movimiento.colaboradorNombre}
                                    </p>
                                </div>
                            )}

                            {/* Proveedor */}
                            {movimiento.proveedor && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Building className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Proveedor</span>
                                    </div>
                                    <p className="text-sm text-gray-900">
                                        {movimiento.proveedor}
                                    </p>
                                </div>
                            )}

                            {/* Número de Comprobante */}
                            {movimiento.numeroComprobante && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Hash className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Nº Comprobante</span>
                                    </div>
                                    <p className="text-sm text-gray-900 font-mono">
                                        {movimiento.numeroComprobante}
                                    </p>
                                </div>
                            )}

                            {/* Es Automático */}
                            {movimiento.esAutomatico && (
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                                        <Zap className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Generación</span>
                                    </div>
                                    <p className="text-sm text-amber-700">
                                        Movimiento automático del sistema
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Observaciones */}
                        {movimiento.observaciones && (
                            <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Observaciones</span>
                                </div>
                                <p className="text-sm text-gray-900">
                                    {movimiento.observaciones}
                                </p>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                {movimiento.createdAt && (
                                    <span>
                                        Creado: {new Date(movimiento.createdAt).toLocaleString('es-PE')}
                                    </span>
                                )}
                                {movimiento.updatedAt && movimiento.updatedAt !== movimiento.createdAt && (
                                    <span>
                                        Actualizado: {new Date(movimiento.updatedAt).toLocaleString('es-PE')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalDetalleMovimiento;
