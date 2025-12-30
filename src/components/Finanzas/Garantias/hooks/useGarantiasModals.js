import { useState, useCallback } from 'react';

/**
 * Hook para manejo de modales del módulo de garantías
 * Centraliza el control de apertura/cierre y datos de cada modal
 */
export const useGarantiasModals = () => {
    // ==================== ESTADOS DE MODALES ====================

    // Modal de crear/editar garantía
    const [modalGarantiaAbierto, setModalGarantiaAbierto] = useState(false);
    const [garantiaSeleccionada, setGarantiaSeleccionada] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);

    // Modal de detalles
    const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
    const [garantiaDetalles, setGarantiaDetalles] = useState(null);

    // Modal de aprobación
    const [modalAprobacionAbierto, setModalAprobacionAbierto] = useState(false);
    const [garantiaAprobacion, setGarantiaAprobacion] = useState(null);

    // Modal de rechazo
    const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
    const [garantiaRechazo, setGarantiaRechazo] = useState(null);

    // Modal de liberación
    const [modalLiberacionAbierto, setModalLiberacionAbierto] = useState(false);
    const [garantiaLiberacion, setGarantiaLiberacion] = useState(null);

    // Modal de ejecución
    const [modalEjecucionAbierto, setModalEjecucionAbierto] = useState(false);
    const [garantiaEjecucion, setGarantiaEjecucion] = useState(null);

    // Modal de seguro
    const [modalSeguroAbierto, setModalSeguroAbierto] = useState(false);
    const [garantiaSeguro, setGarantiaSeguro] = useState(null);

    // Modal de confirmación de eliminación
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [garantiaEliminar, setGarantiaEliminar] = useState(null);

    // ==================== FUNCIONES MODAL GARANTÍA ====================

    /**
     * Abrir modal para crear nueva garantía
     */
    const abrirModalCrear = useCallback(() => {
        setGarantiaSeleccionada(null);
        setModoEdicion(false);
        setModalGarantiaAbierto(true);
    }, []);

    /**
     * Abrir modal para editar garantía existente
     */
    const abrirModalEditar = useCallback((garantia) => {
        setGarantiaSeleccionada(garantia);
        setModoEdicion(true);
        setModalGarantiaAbierto(true);
    }, []);

    /**
     * Cerrar modal de garantía
     */
    const cerrarModalGarantia = useCallback(() => {
        setModalGarantiaAbierto(false);
        setGarantiaSeleccionada(null);
        setModoEdicion(false);
    }, []);

    // ==================== FUNCIONES MODAL DETALLES ====================

    /**
     * Abrir modal de detalles
     */
    const abrirModalDetalles = useCallback((garantia) => {
        setGarantiaDetalles(garantia);
        setModalDetallesAbierto(true);
    }, []);

    /**
     * Cerrar modal de detalles
     */
    const cerrarModalDetalles = useCallback(() => {
        setModalDetallesAbierto(false);
        setGarantiaDetalles(null);
    }, []);

    // ==================== FUNCIONES MODAL APROBACIÓN ====================

    /**
     * Abrir modal de aprobación
     */
    const abrirModalAprobacion = useCallback((garantia) => {
        setGarantiaAprobacion(garantia);
        setModalAprobacionAbierto(true);
    }, []);

    /**
     * Cerrar modal de aprobación
     */
    const cerrarModalAprobacion = useCallback(() => {
        setModalAprobacionAbierto(false);
        setGarantiaAprobacion(null);
    }, []);

    // ==================== FUNCIONES MODAL RECHAZO ====================

    /**
     * Abrir modal de rechazo
     */
    const abrirModalRechazo = useCallback((garantia) => {
        setGarantiaRechazo(garantia);
        setModalRechazoAbierto(true);
    }, []);

    /**
     * Cerrar modal de rechazo
     */
    const cerrarModalRechazo = useCallback(() => {
        setModalRechazoAbierto(false);
        setGarantiaRechazo(null);
    }, []);

    // ==================== FUNCIONES MODAL LIBERACIÓN ====================

    /**
     * Abrir modal de liberación
     */
    const abrirModalLiberacion = useCallback((garantia) => {
        setGarantiaLiberacion(garantia);
        setModalLiberacionAbierto(true);
    }, []);

    /**
     * Cerrar modal de liberación
     */
    const cerrarModalLiberacion = useCallback(() => {
        setModalLiberacionAbierto(false);
        setGarantiaLiberacion(null);
    }, []);

    // ==================== FUNCIONES MODAL EJECUCIÓN ====================

    /**
     * Abrir modal de ejecución
     */
    const abrirModalEjecucion = useCallback((garantia) => {
        setGarantiaEjecucion(garantia);
        setModalEjecucionAbierto(true);
    }, []);

    /**
     * Cerrar modal de ejecución
     */
    const cerrarModalEjecucion = useCallback(() => {
        setModalEjecucionAbierto(false);
        setGarantiaEjecucion(null);
    }, []);

    // ==================== FUNCIONES MODAL SEGURO ====================

    /**
     * Abrir modal de agregar seguro
     */
    const abrirModalSeguro = useCallback((garantia) => {
        setGarantiaSeguro(garantia);
        setModalSeguroAbierto(true);
    }, []);

    /**
     * Cerrar modal de seguro
     */
    const cerrarModalSeguro = useCallback(() => {
        setModalSeguroAbierto(false);
        setGarantiaSeguro(null);
    }, []);

    // ==================== FUNCIONES MODAL ELIMINAR ====================

    /**
     * Abrir modal de confirmación de eliminación
     */
    const abrirModalEliminar = useCallback((garantia) => {
        setGarantiaEliminar(garantia);
        setModalEliminarAbierto(true);
    }, []);

    /**
     * Cerrar modal de eliminación
     */
    const cerrarModalEliminar = useCallback(() => {
        setModalEliminarAbierto(false);
        setGarantiaEliminar(null);
    }, []);

    // ==================== FUNCIONES DE UTILIDAD ====================

    /**
     * Cerrar todos los modales
     */
    const cerrarTodosLosModales = useCallback(() => {
        setModalGarantiaAbierto(false);
        setModalDetallesAbierto(false);
        setModalAprobacionAbierto(false);
        setModalRechazoAbierto(false);
        setModalLiberacionAbierto(false);
        setModalEjecucionAbierto(false);
        setModalSeguroAbierto(false);
        setModalEliminarAbierto(false);

        setGarantiaSeleccionada(null);
        setGarantiaDetalles(null);
        setGarantiaAprobacion(null);
        setGarantiaRechazo(null);
        setGarantiaLiberacion(null);
        setGarantiaEjecucion(null);
        setGarantiaSeguro(null);
        setGarantiaEliminar(null);
        setModoEdicion(false);
    }, []);

    /**
     * Verificar si algún modal está abierto
     */
    const hayModalAbierto = useCallback(() => {
        return modalGarantiaAbierto ||
            modalDetallesAbierto ||
            modalAprobacionAbierto ||
            modalRechazoAbierto ||
            modalLiberacionAbierto ||
            modalEjecucionAbierto ||
            modalSeguroAbierto ||
            modalEliminarAbierto;
    }, [
        modalGarantiaAbierto,
        modalDetallesAbierto,
        modalAprobacionAbierto,
        modalRechazoAbierto,
        modalLiberacionAbierto,
        modalEjecucionAbierto,
        modalSeguroAbierto,
        modalEliminarAbierto
    ]);

    // ==================== RETURN ====================

    return {
        // Estados de modal de garantía
        modalGarantiaAbierto,
        garantiaSeleccionada,
        modoEdicion,
        abrirModalCrear,
        abrirModalEditar,
        cerrarModalGarantia,

        // Estados de modal de detalles
        modalDetallesAbierto,
        garantiaDetalles,
        abrirModalDetalles,
        cerrarModalDetalles,

        // Estados de modal de aprobación
        modalAprobacionAbierto,
        garantiaAprobacion,
        abrirModalAprobacion,
        cerrarModalAprobacion,

        // Estados de modal de rechazo
        modalRechazoAbierto,
        garantiaRechazo,
        abrirModalRechazo,
        cerrarModalRechazo,

        // Estados de modal de liberación
        modalLiberacionAbierto,
        garantiaLiberacion,
        abrirModalLiberacion,
        cerrarModalLiberacion,

        // Estados de modal de ejecución
        modalEjecucionAbierto,
        garantiaEjecucion,
        abrirModalEjecucion,
        cerrarModalEjecucion,

        // Estados de modal de seguro
        modalSeguroAbierto,
        garantiaSeguro,
        abrirModalSeguro,
        cerrarModalSeguro,

        // Estados de modal de eliminación
        modalEliminarAbierto,
        garantiaEliminar,
        abrirModalEliminar,
        cerrarModalEliminar,

        // Utilidades
        cerrarTodosLosModales,
        hayModalAbierto
    };
};

export default useGarantiasModals;
