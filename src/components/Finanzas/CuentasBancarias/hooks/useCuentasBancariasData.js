import { useState, useEffect, useCallback, useMemo } from 'react';
import { cuentasBancariasService } from '../../../../services/finanzas/cuentasBancariasService';

/**
 * Hook optimizado para gestión de datos de cuentas bancarias
 * Maneja estado global, filtros, paginación y comunicación con el backend
 * Separado de la lógica de UI para mejor modularidad
 */
export const useCuentasBancariasData = () => {
    
    // Estados principales
    const [cuentas, setCuentas] = useState([]);
    const [selectedCuentas, setSelectedCuentas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    
    // Estados de filtros y búsqueda
    const [filters, setFilters] = useState({
        search: '',
        banco: '',
        moneda: '',
        tipoCuenta: '',
        activa: null,
        fechaCreacion: null
    });
    
    // Estados de paginación
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    
    // Estados de ordenamiento
    const [sortConfig, setSortConfig] = useState({
        field: 'fechaCreacion',
        direction: 'desc'
    });
    
    // Función memoizada para cargar cuentas
    const loadCuentas = useCallback(async (options = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const requestParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortField: sortConfig.field,
                sortDirection: sortConfig.direction,
                ...filters,
                ...options
            };
            
            // Limpiar valores vacíos para no enviar parámetros innecesarios
            Object.keys(requestParams).forEach(key => {
                if (requestParams[key] === '' || requestParams[key] === null) {
                    delete requestParams[key];
                }
            });
            
            const response = await cuentasBancariasService.obtenerCuentas(requestParams);
            
            setCuentas(response.cuentas || []);
            setPagination(prev => ({
                ...prev,
                total: response.total || 0,
                totalPages: response.totalPages || 0
            }));
            setLastUpdate(new Date());
            
        } catch (err) {
            console.error('Error al cargar cuentas bancarias:', err);
            setError('Error al cargar las cuentas bancarias');
            setCuentas([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, sortConfig, filters]);
    
    // Función memoizada para crear cuenta
    const createCuenta = useCallback(async (cuentaData) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await cuentasBancariasService.crearCuenta(cuentaData);
            
            if (response.success) {
                await loadCuentas({ page: 1 }); // Recargar desde la primera página
                return { success: true, data: response.cuenta };
            } else {
                throw new Error(response.message || 'Error al crear la cuenta');
            }
            
        } catch (err) {
            console.error('Error al crear cuenta:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al crear la cuenta';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [loadCuentas]);
    
    // Función memoizada para actualizar cuenta
    const updateCuenta = useCallback(async (id, cuentaData) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await cuentasBancariasService.actualizarCuenta(id, cuentaData);
            
            if (response.success) {
                // Actualizar la cuenta en el estado local para UI responsiva
                setCuentas(prev => prev.map(cuenta => 
                    cuenta._id === id ? { ...cuenta, ...response.cuenta } : cuenta
                ));
                return { success: true, data: response.cuenta };
            } else {
                throw new Error(response.message || 'Error al actualizar la cuenta');
            }
            
        } catch (err) {
            console.error('Error al actualizar cuenta:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al actualizar la cuenta';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Función memoizada para eliminar cuenta
    const deleteCuenta = useCallback(async (id) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await cuentasBancariasService.eliminarCuenta(id);
            
            if (response.success) {
                // Remover del estado local y de selecciones
                setCuentas(prev => prev.filter(cuenta => cuenta._id !== id));
                setSelectedCuentas(prev => prev.filter(selectedId => selectedId !== id));
                return { success: true };
            } else {
                throw new Error(response.message || 'Error al eliminar la cuenta');
            }
            
        } catch (err) {
            console.error('Error al eliminar cuenta:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al eliminar la cuenta';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Función memoizada para eliminar múltiples cuentas
    const deleteMultipleCuentas = useCallback(async (ids) => {
        try {
            setLoading(true);
            setError(null);
            
            const results = await Promise.allSettled(
                ids.map(id => cuentasBancariasService.eliminarCuenta(id))
            );
            
            const successfulDeletes = results.filter(result => 
                result.status === 'fulfilled' && result.value.success
            ).length;
            
            if (successfulDeletes > 0) {
                // Recargar datos después de eliminaciones múltiples
                await loadCuentas();
                setSelectedCuentas([]);
            }
            
            return { 
                success: successfulDeletes === ids.length,
                successCount: successfulDeletes,
                totalCount: ids.length
            };
            
        } catch (err) {
            console.error('Error al eliminar múltiples cuentas:', err);
            const errorMessage = 'Error al eliminar las cuentas seleccionadas';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [loadCuentas]);
    
    // Función memoizada para actualizar filtros
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset a primera página
    }, []);
    
    // Función memoizada para actualizar paginación
    const updatePagination = useCallback((newPagination) => {
        setPagination(prev => ({ ...prev, ...newPagination }));
    }, []);
    
    // Función memoizada para actualizar ordenamiento
    const updateSort = useCallback((field, direction) => {
        setSortConfig({ field, direction });
        setPagination(prev => ({ ...prev, page: 1 })); // Reset a primera página
    }, []);
    
    // Función memoizada para manejar selección de cuentas
    const toggleCuentaSelection = useCallback((cuentaId) => {
        setSelectedCuentas(prev => {
            if (prev.includes(cuentaId)) {
                return prev.filter(id => id !== cuentaId);
            } else {
                return [...prev, cuentaId];
            }
        });
    }, []);
    
    // Función memoizada para seleccionar/deseleccionar todas las cuentas
    const toggleAllSelection = useCallback(() => {
        const allIds = cuentas.map(cuenta => cuenta._id);
        if (selectedCuentas.length === allIds.length) {
            setSelectedCuentas([]);
        } else {
            setSelectedCuentas(allIds);
        }
    }, [cuentas, selectedCuentas]);
    
    // Función memoizada para limpiar selecciones
    const clearSelection = useCallback(() => {
        setSelectedCuentas([]);
    }, []);
    
    // Función memoizada para limpiar filtros
    const clearFilters = useCallback(() => {
        setFilters({
            search: '',
            banco: '',
            moneda: '',
            tipoCuenta: '',
            activa: null,
            fechaCreacion: null
        });
    }, []);
    
    // Datos calculados memoizados
    const computedData = useMemo(() => {
        const totalSaldo = cuentas.reduce((total, cuenta) => {
            return total + (parseFloat(cuenta.saldoActual) || 0);
        }, 0);
        
        const cuentasActivas = cuentas.filter(cuenta => cuenta.activa).length;
        const cuentasInactivas = cuentas.length - cuentasActivas;
        
        const saldoPorMoneda = cuentas.reduce((acc, cuenta) => {
            const moneda = cuenta.moneda || 'PEN';
            const saldo = parseFloat(cuenta.saldoActual) || 0;
            acc[moneda] = (acc[moneda] || 0) + saldo;
            return acc;
        }, {});
        
        return {
            totalCuentas: cuentas.length,
            cuentasActivas,
            cuentasInactivas,
            totalSaldo,
            saldoPorMoneda,
            hasSelection: selectedCuentas.length > 0,
            selectedCount: selectedCuentas.length,
            isAllSelected: selectedCuentas.length === cuentas.length && cuentas.length > 0
        };
    }, [cuentas, selectedCuentas]);
    
    // Efecto para cargar datos iniciales
    useEffect(() => {
        loadCuentas();
    }, [loadCuentas]);
    
    return {
        // Estados principales
        cuentas,
        selectedCuentas,
        loading,
        error,
        lastUpdate,
        
        // Estados de filtros y paginación
        filters,
        pagination,
        sortConfig,
        
        // Acciones principales
        loadCuentas,
        createCuenta,
        updateCuenta,
        deleteCuenta,
        deleteMultipleCuentas,
        
        // Acciones de filtros y navegación
        updateFilters,
        updatePagination,
        updateSort,
        clearFilters,
        
        // Acciones de selección
        toggleCuentaSelection,
        toggleAllSelection,
        clearSelection,
        
        // Datos calculados
        computedData,
        
        // Funciones de utilidad
        setError
    };
};
