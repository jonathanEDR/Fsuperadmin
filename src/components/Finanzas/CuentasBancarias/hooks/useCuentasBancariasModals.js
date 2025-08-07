import { useState, useCallback, useMemo } from 'react';

/**
 * Hook optimizado para gestión de modales de cuentas bancarias
 * Maneja estado de modales, datos temporales y flujo de UI
 * Separado de la lógica principal para mejor modularidad
 */
export const useCuentasBancariasModals = () => {
    
    // Estados de modales
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        details: false,
        deleteMultiple: false,
        export: false,
        import: false
    });
    
    // Estados de datos temporales para modales
    const [currentCuenta, setCurrentCuenta] = useState(null);
    const [deleteItems, setDeleteItems] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    
    // Función memoizada para abrir modal de creación
    const openCreateModal = useCallback(() => {
        setCurrentCuenta(null);
        setModalError(null);
        setModals(prev => ({ ...prev, create: true }));
    }, []);
    
    // Función memoizada para abrir modal de edición
    const openEditModal = useCallback((cuenta) => {
        setCurrentCuenta(cuenta);
        setModalError(null);
        setModals(prev => ({ ...prev, edit: true }));
    }, []);
    
    // Función memoizada para abrir modal de detalles
    const openDetailsModal = useCallback((cuenta) => {
        setCurrentCuenta(cuenta);
        setModalError(null);
        setModals(prev => ({ ...prev, details: true }));
    }, []);
    
    // Función memoizada para abrir modal de eliminación individual
    const openDeleteModal = useCallback((cuenta) => {
        setCurrentCuenta(cuenta);
        setDeleteItems([cuenta]);
        setModalError(null);
        setModals(prev => ({ ...prev, delete: true }));
    }, []);
    
    // Función memoizada para abrir modal de eliminación múltiple
    const openDeleteMultipleModal = useCallback((cuentas) => {
        setDeleteItems(cuentas);
        setCurrentCuenta(null);
        setModalError(null);
        setModals(prev => ({ ...prev, deleteMultiple: true }));
    }, []);
    
    // Función memoizada para abrir modal de exportación
    const openExportModal = useCallback(() => {
        setModalError(null);
        setModals(prev => ({ ...prev, export: true }));
    }, []);
    
    // Función memoizada para abrir modal de importación
    const openImportModal = useCallback(() => {
        setModalError(null);
        setModals(prev => ({ ...prev, import: true }));
    }, []);
    
    // Función memoizada para cerrar modal específico
    const closeModal = useCallback((modalName) => {
        setModals(prev => ({ ...prev, [modalName]: false }));
        
        // Limpiar datos temporales después de un breve delay para evitar flash
        setTimeout(() => {
            if (modalName === 'create' || modalName === 'edit') {
                setCurrentCuenta(null);
            }
            if (modalName === 'delete' || modalName === 'deleteMultiple') {
                setDeleteItems([]);
                setCurrentCuenta(null);
            }
            setModalError(null);
            setModalLoading(false);
        }, 200);
    }, []);
    
    // Función memoizada para cerrar todos los modales
    const closeAllModals = useCallback(() => {
        setModals({
            create: false,
            edit: false,
            delete: false,
            details: false,
            deleteMultiple: false,
            export: false,
            import: false
        });
        
        setTimeout(() => {
            setCurrentCuenta(null);
            setDeleteItems([]);
            setModalError(null);
            setModalLoading(false);
        }, 200);
    }, []);
    
    // Función memoizada para manejar confirmación de eliminación
    const handleDeleteConfirm = useCallback(async (deleteFunction) => {
        try {
            setModalLoading(true);
            setModalError(null);
            
            let result;
            if (deleteItems.length === 1) {
                // Eliminación individual
                const cuenta = deleteItems[0];
                result = await deleteFunction(cuenta._id);
            } else {
                // Eliminación múltiple
                const ids = deleteItems.map(cuenta => cuenta._id);
                result = await deleteFunction(ids);
            }
            
            if (result.success) {
                // Cerrar modal después de eliminación exitosa
                const modalToClose = deleteItems.length === 1 ? 'delete' : 'deleteMultiple';
                closeModal(modalToClose);
                return { success: true, ...result };
            } else {
                setModalError(result.error || 'Error al eliminar');
                return result;
            }
            
        } catch (error) {
            console.error('Error en confirmación de eliminación:', error);
            const errorMessage = error.message || 'Error inesperado al eliminar';
            setModalError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setModalLoading(false);
        }
    }, [deleteItems, closeModal]);
    
    // Función memoizada para manejar envío de formularios
    const handleFormSubmit = useCallback(async (formData, submitFunction, modalName) => {
        try {
            setModalLoading(true);
            setModalError(null);
            
            const result = await submitFunction(formData);
            
            if (result.success) {
                closeModal(modalName);
                return { success: true, ...result };
            } else {
                setModalError(result.error || 'Error al procesar la solicitud');
                return result;
            }
            
        } catch (error) {
            console.error('Error en envío de formulario:', error);
            const errorMessage = error.message || 'Error inesperado al procesar';
            setModalError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setModalLoading(false);
        }
    }, [closeModal]);
    
    // Información del modal actual memoizada
    const currentModalInfo = useMemo(() => {
        const activeModal = Object.keys(modals).find(key => modals[key]);
        
        if (!activeModal) {
            return { isOpen: false, type: null };
        }
        
        const modalConfigs = {
            create: {
                title: 'Crear Nueva Cuenta Bancaria',
                size: 'lg',
                confirmText: 'Crear Cuenta',
                cancelText: 'Cancelar'
            },
            edit: {
                title: 'Editar Cuenta Bancaria',
                size: 'lg',
                confirmText: 'Guardar Cambios',
                cancelText: 'Cancelar'
            },
            delete: {
                title: 'Confirmar Eliminación',
                size: 'sm',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                variant: 'danger'
            },
            deleteMultiple: {
                title: 'Confirmar Eliminación Múltiple',
                size: 'sm',
                confirmText: 'Eliminar Seleccionadas',
                cancelText: 'Cancelar',
                variant: 'danger'
            },
            details: {
                title: 'Detalles de la Cuenta',
                size: 'lg',
                confirmText: 'Cerrar',
                cancelText: null
            },
            export: {
                title: 'Exportar Datos',
                size: 'md',
                confirmText: 'Exportar',
                cancelText: 'Cancelar'
            },
            import: {
                title: 'Importar Datos',
                size: 'md',
                confirmText: 'Importar',
                cancelText: 'Cancelar'
            }
        };
        
        return {
            isOpen: true,
            type: activeModal,
            ...modalConfigs[activeModal]
        };
    }, [modals]);
    
    // Información de eliminación memoizada
    const deleteInfo = useMemo(() => {
        if (deleteItems.length === 0) {
            return { count: 0, message: '', items: [] };
        }
        
        const count = deleteItems.length;
        const isMultiple = count > 1;
        
        let message;
        if (isMultiple) {
            message = `¿Está seguro de que desea eliminar ${count} cuentas bancarias seleccionadas?`;
        } else {
            const cuenta = deleteItems[0];
            message = `¿Está seguro de que desea eliminar la cuenta "${cuenta.nombre}" del banco ${cuenta.banco}?`;
        }
        
        return {
            count,
            isMultiple,
            message,
            items: deleteItems
        };
    }, [deleteItems]);
    
    // Estado de carga global de modales
    const isAnyModalOpen = useMemo(() => {
        return Object.values(modals).some(isOpen => isOpen);
    }, [modals]);
    
    return {
        // Estados de modales
        modals,
        currentCuenta,
        deleteItems,
        modalLoading,
        modalError,
        
        // Funciones para abrir modales
        openCreateModal,
        openEditModal,
        openDetailsModal,
        openDeleteModal,
        openDeleteMultipleModal,
        openExportModal,
        openImportModal,
        
        // Funciones para cerrar modales
        closeModal,
        closeAllModals,
        
        // Funciones para manejar acciones
        handleDeleteConfirm,
        handleFormSubmit,
        
        // Información calculada
        currentModalInfo,
        deleteInfo,
        isAnyModalOpen,
        
        // Funciones de utilidad
        setModalError,
        setModalLoading
    };
};
