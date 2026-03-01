import React, { useState, useEffect, useCallback } from 'react';
import { Lock, XCircle, CheckCircle, Info } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useGarantiasData, useGarantiasModals } from './hooks';
import GarantiasTable from './components/GarantiasTable';
import GarantiasFilters from './components/GarantiasFilters';
import GarantiasResumen from './components/GarantiasResumen';
import ModalGarantia from './ModalGarantia';
import ModalDetallesGarantia from './ModalDetallesGarantia';
import { mensajes } from './garantiasConfig';
import prestamosService from '../../../services/finanzas/prestamosService';
import FinanzasNavigation from '../common/FinanzasNavigation';

/**
 * Componente principal del módulo de Garantías
 * Gestiona la vista completa con tabla, filtros, modales y acciones
 */
const GarantiasCore = () => {
    // Estados locales
    const [prestamos, setPrestamos] = useState([]);
    const [cargandoPrestamos, setCargandoPrestamos] = useState(false);
    const [notificacion, setNotificacion] = useState(null);
    
    // Navegación
    const location = useLocation();
    const currentPath = location.pathname;
    const baseRoute = currentPath.includes('/super-admin') 
        ? '/super-admin/finanzas' 
        : currentPath.includes('/admin')
        ? '/admin/finanzas'
        : '/finanzas';

    // Hook de datos de garantías
    const {
        garantias,
        resumenGarantias,
        loading,
        error,
        filtros,
        paginacionInfo,
        crearGarantia,
        actualizarGarantia,
        eliminarGarantia,
        aprobarGarantia,
        rechazarGarantia,
        activarGarantia,
        liberarGarantia,
        ejecutarGarantia,
        agregarSeguro,
        actualizarFiltros,
        limpiarFiltros,
        cambiarPagina,
        cargarGarantias
    } = useGarantiasData();

    // Hook de modales
    const {
        modalGarantiaAbierto,
        garantiaSeleccionada,
        modoEdicion,
        abrirModalCrear,
        abrirModalEditar,
        cerrarModalGarantia,
        modalDetallesAbierto,
        garantiaDetalles,
        abrirModalDetalles,
        cerrarModalDetalles,
        modalAprobacionAbierto,
        garantiaAprobacion,
        abrirModalAprobacion,
        cerrarModalAprobacion,
        modalRechazoAbierto,
        garantiaRechazo,
        abrirModalRechazo,
        cerrarModalRechazo,
        modalLiberacionAbierto,
        garantiaLiberacion,
        abrirModalLiberacion,
        cerrarModalLiberacion,
        modalEjecucionAbierto,
        garantiaEjecucion,
        abrirModalEjecucion,
        cerrarModalEjecucion,
        modalEliminarAbierto,
        garantiaEliminar,
        abrirModalEliminar,
        cerrarModalEliminar
    } = useGarantiasModals();

    // Cargar préstamos para el selector
    const cargarPrestamos = useCallback(async () => {
        setCargandoPrestamos(true);
        try {
            const response = await prestamosService.obtenerTodos({ limit: 100 });
            const prestamosData = response.data?.prestamos || response.data?.data || response.data || [];
            setPrestamos(Array.isArray(prestamosData) ? prestamosData : []);
        } catch (error) {
            console.error('Error cargando préstamos:', error);
            setPrestamos([]);
        } finally {
            setCargandoPrestamos(false);
        }
    }, []);

    // Cargar préstamos al montar
    useEffect(() => {
        cargarPrestamos();
    }, [cargarPrestamos]);

    // Mostrar notificación
    const mostrarNotificacion = (mensaje, tipo = 'success') => {
        setNotificacion({ mensaje, tipo });
        setTimeout(() => setNotificacion(null), 4000);
    };

    // ==================== HANDLERS DE ACCIONES ====================

    // Guardar garantía (crear o actualizar)
    const handleGuardarGarantia = async (datos) => {
        let resultado;
        if (modoEdicion && garantiaSeleccionada) {
            resultado = await actualizarGarantia(garantiaSeleccionada._id, datos);
            if (resultado.success) {
                mostrarNotificacion(mensajes.exito.actualizar);
            } else {
                mostrarNotificacion(resultado.error || mensajes.error.actualizar, 'error');
            }
        } else {
            resultado = await crearGarantia(datos);
            if (resultado.success) {
                mostrarNotificacion(mensajes.exito.crear);
            } else {
                mostrarNotificacion(resultado.error || mensajes.error.crear, 'error');
            }
        }
        return resultado;
    };

    // Aprobar garantía
    const handleAprobarGarantia = async (garantia) => {
        const valorTasacion = prompt('Ingrese el valor de tasación (opcional):');
        const observaciones = prompt('Observaciones de aprobación (opcional):');

        const resultado = await aprobarGarantia(garantia._id, {
            valorTasacion: valorTasacion ? parseFloat(valorTasacion) : null,
            observaciones
        });

        if (resultado.success) {
            mostrarNotificacion(mensajes.exito.aprobar);
            cerrarModalDetalles();
        } else {
            mostrarNotificacion(resultado.error || mensajes.error.aprobar, 'error');
        }
    };

    // Rechazar garantía
    const handleRechazarGarantia = async (garantia) => {
        const motivo = prompt('Ingrese el motivo del rechazo:');
        if (!motivo) return;

        const resultado = await rechazarGarantia(garantia._id, motivo);
        if (resultado.success) {
            mostrarNotificacion(mensajes.exito.rechazar);
            cerrarModalDetalles();
        } else {
            mostrarNotificacion(resultado.error || mensajes.error.rechazar, 'error');
        }
    };

    // Activar garantía
    const handleActivarGarantia = async (garantia) => {
        if (!confirm(mensajes.confirmaciones.activar)) return;

        const resultado = await activarGarantia(garantia._id);
        if (resultado.success) {
            mostrarNotificacion(mensajes.exito.activar);
            cerrarModalDetalles();
        } else {
            mostrarNotificacion(resultado.error || mensajes.error.activar, 'error');
        }
    };

    // Liberar garantía
    const handleLiberarGarantia = async (garantia) => {
        const motivo = prompt('Ingrese el motivo de liberación:');
        if (!motivo) return;

        const resultado = await liberarGarantia(garantia._id, motivo);
        if (resultado.success) {
            mostrarNotificacion(mensajes.exito.liberar);
            cerrarModalDetalles();
        } else {
            mostrarNotificacion(resultado.error || mensajes.error.liberar, 'error');
        }
    };

    // Ejecutar garantía
    const handleEjecutarGarantia = async (garantia) => {
        if (!confirm(mensajes.confirmaciones.ejecutar)) return;

        const motivo = prompt('Ingrese el motivo de ejecución:');
        if (!motivo) return;

        const valorObtenido = prompt('Ingrese el valor obtenido en la ejecución:');
        if (!valorObtenido) return;

        const resultado = await ejecutarGarantia(garantia._id, {
            motivo,
            valorObtenido: parseFloat(valorObtenido),
            gastos: 0,
            observaciones: ''
        });

        if (resultado.success) {
            mostrarNotificacion(mensajes.exito.ejecutar);
            cerrarModalDetalles();
        } else {
            mostrarNotificacion(resultado.error || mensajes.error.ejecutar, 'error');
        }
    };

    // Eliminar garantía
    const handleEliminarGarantia = async (garantia) => {
        if (!confirm(mensajes.confirmaciones.eliminar)) return;

        const resultado = await eliminarGarantia(garantia._id);
        if (resultado.success) {
            mostrarNotificacion(mensajes.exito.eliminar);
        } else {
            mostrarNotificacion(resultado.error || mensajes.error.eliminar, 'error');
        }
    };

    // Agregar seguro
    const handleAgregarSeguro = async (garantia) => {
        // Por ahora, redirigir al modal de edición
        // En una versión futura, se puede crear un modal específico para seguros
        abrirModalEditar(garantia);
        mostrarNotificacion('Puede agregar seguros editando la garantía', 'info');
    };

    // ==================== RENDER ====================

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navegación de Finanzas */}
            <FinanzasNavigation currentModule="garantias" baseRoute={baseRoute} />
            
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div>
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                                <Lock size={28} />
                                <span className="hidden xs:inline">Gestión de Garantías</span>
                                <span className="xs:hidden">Garantías</span>
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm text-gray-500 hidden sm:block">
                                Administra las garantías asociadas a préstamos financieros
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={cargarGarantias}
                                className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-2"
                                disabled={loading}
                                title="Actualizar lista"
                            >
                                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">Actualizar</span>
                            </button>
                            <button
                                onClick={abrirModalCrear}
                                className="px-2 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2"
                                title="Crear nueva garantía"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="hidden sm:inline">Nueva Garantía</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notificación */}
            {notificacion && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${notificacion.tipo === 'error'
                        ? 'bg-red-500 text-white'
                        : notificacion.tipo === 'info'
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span>
                            {notificacion.tipo === 'error' ? <XCircle size={18} /> : notificacion.tipo === 'info' ? <Info size={18} /> : <CheckCircle size={18} />}
                        </span>
                        <span>{notificacion.mensaje}</span>
                        <button
                            onClick={() => setNotificacion(null)}
                            className="ml-2 text-white/80 hover:text-white"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Contenido Principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-red-700">
                            <XCircle size={16} />
                            <span>{error}</span>
                            <button
                                onClick={cargarGarantias}
                                className="ml-auto text-sm underline hover:no-underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

                {/* Resumen */}
                <GarantiasResumen resumen={resumenGarantias} loading={loading} />

                {/* Filtros */}
                <GarantiasFilters
                    filtros={filtros}
                    onFiltroChange={actualizarFiltros}
                    onLimpiarFiltros={limpiarFiltros}
                    prestamos={prestamos}
                    loading={loading}
                />

                {/* Tabla */}
                <GarantiasTable
                    garantias={garantias}
                    loading={loading}
                    onVerDetalles={abrirModalDetalles}
                    onEditarGarantia={abrirModalEditar}
                    onAprobarGarantia={handleAprobarGarantia}
                    onRechazarGarantia={handleRechazarGarantia}
                    onActivarGarantia={handleActivarGarantia}
                    onLiberarGarantia={handleLiberarGarantia}
                    onEjecutarGarantia={handleEjecutarGarantia}
                    onEliminarGarantia={handleEliminarGarantia}
                    onAgregarSeguro={handleAgregarSeguro}
                />

                {/* Paginación */}
                {garantias.length > 0 && (
                    <div className="mt-4 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
                        <div className="text-sm text-gray-500">
                            {paginacionInfo.mensaje}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => cambiarPagina(paginacionInfo.paginaActual - 1)}
                                disabled={!paginacionInfo.hayAnterior || loading}
                                className="px-3 py-1 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginacionInfo.paginaActual} de {paginacionInfo.totalPaginas || 1}
                            </span>
                            <button
                                onClick={() => cambiarPagina(paginacionInfo.paginaActual + 1)}
                                disabled={!paginacionInfo.haySiguiente || loading}
                                className="px-3 py-1 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Crear/Editar Garantía */}
            <ModalGarantia
                isOpen={modalGarantiaAbierto}
                onClose={cerrarModalGarantia}
                garantia={garantiaSeleccionada}
                modoEdicion={modoEdicion}
                onGuardar={handleGuardarGarantia}
                prestamos={prestamos}
                loading={loading || cargandoPrestamos}
            />

            {/* Modal Detalles Garantía */}
            <ModalDetallesGarantia
                isOpen={modalDetallesAbierto}
                onClose={cerrarModalDetalles}
                garantia={garantiaDetalles}
                onAprobar={handleAprobarGarantia}
                onRechazar={handleRechazarGarantia}
                onActivar={handleActivarGarantia}
                onLiberar={handleLiberarGarantia}
                onEjecutar={handleEjecutarGarantia}
                onEditar={(g) => {
                    cerrarModalDetalles();
                    abrirModalEditar(g);
                }}
                onAgregarSeguro={handleAgregarSeguro}
            />
        </div>
    );
};

export default GarantiasCore;
