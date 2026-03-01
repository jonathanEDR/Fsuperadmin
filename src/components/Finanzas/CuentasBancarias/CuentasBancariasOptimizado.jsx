import React, { memo, useCallback, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCuentasBancariasData } from './hooks/useCuentasBancariasData';
import { useCuentasBancariasModals } from './hooks/useCuentasBancariasModals';
import { useCuentaBancariaForm } from './hooks/useCuentaBancariaForm';
import CuentasBancariasResumen from './components/CuentasBancariasResumen';
import CuentasBancariasFilters from './components/CuentasBancariasFilters';
import CuentasBancariasTable from './components/CuentasBancariasTable';
import CuentasBancariasToolbar from './components/CuentasBancariasToolbar';
import FinanzasLayout from '../common/FinanzasLayout';

/**
 * Componente principal optimizado para gestión de cuentas bancarias
 * Completamente modularizado con hooks especializados y componentes memoizados
 * Aplicación de mejores prácticas de React para máximo rendimiento
 */
const CuentasBancariasOptimizado = memo(() => {
    
    // Hooks especializados para manejo de estado
    const dataHook = useCuentasBancariasData();
    const modalsHook = useCuentasBancariasModals();
    const formHook = useCuentaBancariaForm(modalsHook.currentCuenta);
    
    // Manejar envío de formulario de creación
    const handleCreateSubmit = useCallback(async () => {
        if (!formHook.validateForm()) return;
        
        const formDataToSubmit = formHook.transformToBackend();
        const result = await modalsHook.handleFormSubmit(
            formDataToSubmit,
            dataHook.createCuenta,
            'create'
        );
        
        if (result.success) {
            formHook.resetForm();
        }
        
        return result;
    }, [formHook, modalsHook, dataHook.createCuenta]);
    
    // Manejar envío de formulario de edición
    const handleEditSubmit = useCallback(async () => {
        if (!formHook.validateForm() || !modalsHook.currentCuenta) return;
        
        const formDataToSubmit = formHook.transformToBackend();
        const result = await modalsHook.handleFormSubmit(
            formDataToSubmit,
            (data) => dataHook.updateCuenta(modalsHook.currentCuenta._id, data),
            'edit'
        );
        
        return result;
    }, [formHook, modalsHook, dataHook]);
    
    // Manejar confirmación de eliminación
    const handleDeleteConfirmation = useCallback(async () => {
        const isMultiple = modalsHook.deleteInfo.count > 1;
        const deleteFunction = isMultiple ? dataHook.deleteMultipleCuentas : dataHook.deleteCuenta;
        
        const result = await modalsHook.handleDeleteConfirm(deleteFunction);
        
        if (result.success && isMultiple) {
            dataHook.clearSelection();
        }
        
        return result;
    }, [modalsHook, dataHook]);
    
    // Preparar datos para modal de edición
    const prepareEditModal = useCallback((cuenta) => {
        formHook.transformFromBackend(cuenta);
        modalsHook.openEditModal(cuenta);
    }, [formHook, modalsHook]);
    
    return (
        <FinanzasLayout 
            currentModule="cuentas-bancarias"
            title="Gestión de Cuentas Bancarias"
            loading={dataHook.loading}
            actions={
                <CuentasBancariasToolbar
                    computedData={dataHook.computedData}
                    loading={dataHook.loading}
                    onCreateNew={modalsHook.openCreateModal}
                    onDeleteSelected={() => {
                        const selectedCuentasData = dataHook.cuentas.filter(cuenta => 
                            dataHook.selectedCuentas.includes(cuenta._id)
                        );
                        modalsHook.openDeleteMultipleModal(selectedCuentasData);
                    }}
                    onClearSelection={dataHook.clearSelection}
                />
            }
        >
            
            {/* Mostrar errores globales */}
            {dataHook.error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <AlertTriangle size={16} className="mr-2" />
                    {dataHook.error}
                    <button type="button" className="close" onClick={() => dataHook.setError(null)}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            )}
            
            {/* Tarjetas de resumen */}
            <CuentasBancariasResumen computedData={dataHook.computedData} loading={dataHook.loading} />
            
            {/* Filtros */}
            <CuentasBancariasFilters
                filters={dataHook.filters}
                onUpdateFilters={dataHook.updateFilters}
                onClearFilters={dataHook.clearFilters}
                loading={dataHook.loading}
                formOptions={formHook.formOptions}
            />
            
            {/* Tabla de cuentas */}
            <CuentasBancariasTable
                cuentas={dataHook.cuentas}
                selectedCuentas={dataHook.selectedCuentas}
                loading={dataHook.loading}
                pagination={dataHook.pagination}
                sortConfig={dataHook.sortConfig}
                onToggleSelection={dataHook.toggleCuentaSelection}
                onToggleAllSelection={dataHook.toggleAllSelection}
                onSort={dataHook.updateSort}
                onPageChange={(newPage) => dataHook.updatePagination({ page: newPage })}
                onEdit={prepareEditModal}
                onDelete={modalsHook.openDeleteModal}
                onViewDetails={modalsHook.openDetailsModal}
            />
            
            {/* Modales */}
            {/* TODO: Implementar modales específicos */}
        </FinanzasLayout>
    );
});

CuentasBancariasOptimizado.displayName = 'CuentasBancariasOptimizado';

export default CuentasBancariasOptimizado;
