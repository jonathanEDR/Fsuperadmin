import React from 'react';
import { columnasPrestamos, estadosColor, accionesPrestamos } from './prestamosConfig.jsx';
import ModalDetallesPrestamo from './ModalDetallesPrestamo';

const TablaPrestamos = ({ 
    prestamos, 
    loading, 
    onEdit, 
    onCancel, 
    onDelete,
    onVerAmortizacion,
    // Estados del modal de detalles
    modalDetallesPrestamo,
    prestamoViendoDetalles,
    onAbrirModalDetalles,
    onCerrarModalDetalles
}) => {
    // Validar estados de préstamos en modo desarrollo
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'development' && prestamos && prestamos.length > 0) {
            prestamos.forEach((prestamo, index) => {
                if (prestamo.estado && !['aprobado', 'cancelado'].includes(prestamo.estado)) {
                    console.warn(`⚠️ Préstamo ${index} con estado inválido:`, {
                        id: prestamo._id,
                        codigo: prestamo.codigo,
                        estado: prestamo.estado
                    });
                }
            });
        }
    }, [prestamos]);
    
    // Calcular totales y estadísticas
    const estadisticas = React.useMemo(() => {
        if (!prestamos || prestamos.length === 0) {
            return {
                totalPrestamos: 0,
                montoTotal: 0,
                montoAprobado: 0,
                pendientePago: 0,
                interesesGenerados: 0,
                promedioTasa: 0
            };
        }

        const totalPrestamos = prestamos.length;
        const montoTotal = prestamos.reduce((sum, p) => sum + (parseFloat(p.montoSolicitado) || 0), 0);
        const montoAprobado = prestamos.reduce((sum, p) => sum + (parseFloat(p.montoAprobado) || 0), 0);
        
        // Calcular pendiente de pago (solo préstamos aprobados)
        const prestamosAprobados = prestamos.filter(p => p.estado === 'aprobado');
        const pendientePago = prestamosAprobados.reduce((sum, p) => {
            const monto = parseFloat(p.montoAprobado) || 0;
            const pagado = parseFloat(p.montoPagado) || 0;
            return sum + Math.max(0, monto - pagado);
        }, 0);

        // Calcular intereses generados (estimado)
        const interesesGenerados = prestamosAprobados.reduce((sum, p) => {
            const monto = parseFloat(p.montoAprobado) || 0;
            const tasa = parseFloat(p.tasaInteres) || 0;
            const plazoMeses = parseFloat(p.plazoMeses) || 0;
            return sum + (monto * (tasa / 100) * (plazoMeses / 12));
        }, 0);

        // Promedio de tasa de interés
        const prestamosConTasa = prestamos.filter(p => p.tasaInteres);
        const promedioTasa = prestamosConTasa.length > 0 ?
            prestamosConTasa.reduce((sum, p) => sum + (parseFloat(p.tasaInteres) || 0), 0) / prestamosConTasa.length :
            0;

        return {
            totalPrestamos,
            montoTotal,
            montoAprobado,
            pendientePago,
            interesesGenerados,
            promedioTasa
        };
    }, [prestamos]);

    // Configurar columnas con acciones
    const columnasConAcciones = React.useMemo(() => [
        ...columnasPrestamos,
        {
            key: 'acciones',
            titulo: 'Acciones',
            ancho: '120px',
            render: (prestamo) => (
                <div className="flex space-x-1 justify-center">
                    {prestamo ? (
                        <>
                            {accionesPrestamos.length > 0 ? (
                                accionesPrestamos.map((accion, index) => {
                                    // Determinar la función a ejecutar
                                    let handleClick = () => {
                                        // Handler por defecto - no hace nada
                                    };
                                    
                                    switch (accion.handler) {
                                        case 'verTablaAmortizacion':
                                            handleClick = () => {
                                                onVerAmortizacion(prestamo);
                                            };
                                            break;
                                        case 'abrirModalEditarPrestamo':
                                            handleClick = () => {
                                                onEdit(prestamo);
                                            };
                                            break;
                                        case 'cancelarPrestamo':
                                            handleClick = () => {
                                                onCancel(prestamo);
                                            };
                                            break;
                                        case 'eliminarPrestamo':
                                            handleClick = () => {
                                                onDelete && onDelete(prestamo);
                                            };
                                            break;
                                        default:
                                            break;
                                    }

                                    return (
                                        <button
                                            key={`${accion.handler}-${index}`}
                                            onClick={handleClick}
                                            className={accion.className}
                                            title={accion.tooltip}
                                        >
                                            <span className="text-sm">{accion.icono}</span>
                                        </button>
                                    );
                                })
                            ) : (
                                <span className="text-red-500 text-xs">No hay acciones configuradas</span>
                            )}
                        </>
                    ) : (
                        <span className="text-gray-400 text-sm">Sin datos</span>
                    )}
                </div>
            )
        }
    ], [onEdit, onCancel, onDelete, onVerAmortizacion]);

    return (
        <div className="space-y-6">
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Total de préstamos */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Préstamos</p>
                            <p className="text-2xl font-bold">{estadisticas.totalPrestamos}</p>
                        </div>
                        <div className="text-blue-200">
                            <span className="text-2xl">📋</span>
                        </div>
                    </div>
                </div>

                {/* Monto solicitado */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Monto Solicitado</p>
                            <p className="text-xl font-bold">
                                S/ {estadisticas.montoTotal.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="text-green-200">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                {/* Monto aprobado */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Monto Aprobado</p>
                            <p className="text-xl font-bold">
                                S/ {estadisticas.montoAprobado.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="text-emerald-200">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                {/* Pendiente de pago */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Pendiente Pago</p>
                            <p className="text-xl font-bold">
                                S/ {estadisticas.pendientePago.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="text-orange-200">
                            <span className="text-2xl">⏳</span>
                        </div>
                    </div>
                </div>

                {/* Intereses generados */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Intereses (Est.)</p>
                            <p className="text-xl font-bold">
                                S/ {estadisticas.interesesGenerados.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="text-purple-200">
                            <span className="text-2xl">📈</span>
                        </div>
                    </div>
                </div>

                {/* Tasa promedio */}
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Tasa Promedio</p>
                            <p className="text-xl font-bold">
                                {estadisticas.promedioTasa.toFixed(1)}%
                            </p>
                        </div>
                        <div className="text-indigo-200">
                            <span className="text-2xl">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de préstamos */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="mr-2">📋</span>
                        Lista de Préstamos
                        {estadisticas.totalPrestamos > 0 && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                {estadisticas.totalPrestamos}
                            </span>
                        )}
                    </h3>
                </div>
                
                <div className="overflow-auto">
                    {/* 🔥 TABLA CUSTOMIZADA PARA PRESTAMOS */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600">Cargando préstamos...</span>
                        </div>
                    ) : prestamos && prestamos.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {columnasPrestamos.map((columna) => (
                                        <th
                                            key={columna.key}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {columna.titulo}
                                        </th>
                                    ))}
                                    <th 
                                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        style={{ width: '120px' }}
                                    >
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {prestamos.map((prestamo, index) => {
                                    return (
                                        <tr key={prestamo._id || index} className="hover:bg-gray-50">
                                            {columnasPrestamos.map((columna) => {
                                                // Obtener valor de la columna
                                                const valor = columna.key.includes('.') 
                                                    ? columna.key.split('.').reduce((obj, key) => obj?.[key], prestamo)
                                                    : prestamo[columna.key];
                                                
                                                // Crear objeto de handlers para pasar a la función render
                                                const handlers = {
                                                    abrirModalEditarPrestamo: onEdit,
                                                    verTablaAmortizacion: onVerAmortizacion,
                                                    cancelarPrestamo: onCancel,
                                                    abrirModalDetallesPrestamo: onAbrirModalDetalles
                                                };
                                                
                                                // Debug: verificar que el handler existe para la columna de vencimiento
                                                if (columna.key === 'fechaVencimiento' && typeof onAbrirModalDetalles !== 'function') {
                                                    console.warn('🚨 Handler abrirModalDetallesPrestamo no está definido como función:', onAbrirModalDetalles);
                                                }
                                                
                                                return (
                                                    <td key={`${prestamo._id}-${columna.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {columna.render ? columna.render(valor, prestamo, handlers) : valor || '-'}
                                                    </td>
                                                );
                                            })}
                                            
                                            {/* Columna de Acciones */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex space-x-1 justify-center">
                                                    {accionesPrestamos.map((accion, accionIndex) => {
                                                        // Verificar si la acción debe mostrarse
                                                        const debeMostrar = accion.mostrar ? accion.mostrar(prestamo) : true;
                                                        
                                                        if (!debeMostrar) {
                                                            return null;
                                                        }

                                                        // Determinar la función a ejecutar
                                                        let handleClick = () => {
                                                            // Handler por defecto - no hace nada
                                                        };
                                                        
                                                        switch (accion.handler) {
                                                            case 'verTablaAmortizacion':
                                                                handleClick = () => onVerAmortizacion(prestamo);
                                                                break;
                                                            case 'abrirModalEditarPrestamo':
                                                                handleClick = () => onEdit(prestamo);
                                                                break;
                                                            case 'cancelarPrestamo':
                                                                handleClick = () => onCancel(prestamo);
                                                                break;
                                                            case 'eliminarPrestamo':
                                                                handleClick = () => {
                                                                    onDelete && onDelete(prestamo);
                                                                };
                                                                break;
                                                            default:
                                                                break;
                                                        }

                                                        return (
                                                            <button
                                                                key={`${accion.handler}-${accionIndex}`}
                                                                onClick={handleClick}
                                                                className={accion.className}
                                                                title={accion.tooltip}
                                                            >
                                                                <span className="text-sm">{accion.icono}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-12">
                            <span className="text-6xl mb-4 block">💳</span>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay préstamos registrados
                            </h3>
                            <p className="text-gray-500">
                                Comienza agregando tu primer préstamo
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Información adicional */}
            {prestamos && prestamos.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                        <p>• Los montos están expresados en soles peruanos (PEN)</p>
                        <p>• Los intereses estimados se calculan en base al plazo total del préstamo</p>
                        <p>• El pendiente de pago solo incluye préstamos con estado "vigente"</p>
                        <p>• Usa las acciones para editar, ver amortización o eliminar préstamos</p>
                    </div>
                </div>
            )}

            {/* Modal de Detalles del Préstamo */}
            <ModalDetallesPrestamo
                isOpen={modalDetallesPrestamo}
                onClose={onCerrarModalDetalles}
                prestamo={prestamoViendoDetalles}
                loading={loading}
            />
        </div>
    );
};

export default TablaPrestamos;
