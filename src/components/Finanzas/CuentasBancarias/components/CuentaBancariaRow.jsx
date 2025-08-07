import React, { memo, useCallback } from 'react';

/**
 * Componente optimizado para la fila de una cuenta bancaria en la tabla
 * Memoizado para evitar renders innecesarios en listas grandes
 * Separado para mejor control de renders y performance
 */
const CuentaBancariaRow = memo(({ 
    cuenta, 
    isSelected, 
    onToggleSelection, 
    onEdit, 
    onDelete, 
    onViewDetails 
}) => {
    
    // Formatear saldo con símbolo de moneda
    const formatCurrency = useCallback((amount, currency = 'PEN') => {
        const symbols = {
            'PEN': 'S/',
            'USD': '$',
            'EUR': '€'
        };
        
        const formattedAmount = Number(amount || 0).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        return `${symbols[currency] || 'S/'} ${formattedAmount}`;
    }, []);
    
    // Formatear fecha
    const formatDate = useCallback((dateString) => {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }, []);
    
    // Obtener clase de estado según el saldo
    const getSaldoClass = useCallback((saldo, alertas) => {
        const saldoNum = parseFloat(saldo) || 0;
        const saldoMinimo = parseFloat(alertas?.saldoMinimo) || 0;
        
        if (saldoNum < 0) return 'text-danger';
        if (saldoNum < saldoMinimo) return 'text-warning';
        return 'text-success';
    }, []);
    
    // Obtener icono del banco
    const getBankIcon = useCallback((banco) => {
        const iconMap = {
            'BCP': 'fas fa-university text-primary',
            'BBVA': 'fas fa-university text-info',
            'Interbank': 'fas fa-university text-warning',
            'Scotiabank': 'fas fa-university text-danger',
            'BanBif': 'fas fa-university text-success',
            'Banco_Pichincha': 'fas fa-university text-secondary'
        };
        
        return iconMap[banco] || 'fas fa-university text-muted';
    }, []);
    
    // Obtener icono del tipo de cuenta
    const getTipoCuentaIcon = useCallback((tipoCuenta) => {
        const iconMap = {
            'corriente': 'fas fa-credit-card',
            'ahorros': 'fas fa-piggy-bank',
            'plazo_fijo': 'fas fa-clock',
            'inversiones': 'fas fa-chart-line'
        };
        
        return iconMap[tipoCuenta] || 'fas fa-wallet';
    }, []);
    
    // Manejar clics en los botones de acción
    const handleEdit = useCallback(() => {
        onEdit(cuenta);
    }, [cuenta, onEdit]);
    
    const handleDelete = useCallback(() => {
        onDelete(cuenta);
    }, [cuenta, onDelete]);
    
    const handleViewDetails = useCallback(() => {
        onViewDetails(cuenta);
    }, [cuenta, onViewDetails]);
    
    const handleToggleSelection = useCallback(() => {
        onToggleSelection(cuenta._id);
    }, [cuenta._id, onToggleSelection]);
    
    return (
        <tr className={isSelected ? 'table-active' : ''}>
            {/* Checkbox de selección */}
            <td className="align-middle">
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleToggleSelection}
                        id={`cuenta-${cuenta._id}`}
                    />
                </div>
            </td>
            
            {/* Información de la cuenta */}
            <td className="align-middle">
                <div className="d-flex align-items-center">
                    <i className={getBankIcon(cuenta.banco)} style={{ fontSize: '1.2em', marginRight: '8px' }}></i>
                    <div>
                        <div className="font-weight-bold text-gray-800">
                            {cuenta.nombre}
                        </div>
                        <div className="small text-gray-600">
                            {cuenta.numeroCuenta ? `****${cuenta.numeroCuenta.slice(-4)}` : 'Sin número'}
                        </div>
                    </div>
                </div>
            </td>
            
            {/* Banco */}
            <td className="align-middle">
                <span className="font-weight-medium">
                    {cuenta.banco}
                </span>
            </td>
            
            {/* Tipo de cuenta */}
            <td className="align-middle">
                <div className="d-flex align-items-center">
                    <i className={getTipoCuentaIcon(cuenta.tipoCuenta)} style={{ marginRight: '6px' }}></i>
                    <span className="text-capitalize">
                        {cuenta.tipoCuenta?.replace('_', ' ') || 'No especificado'}
                    </span>
                </div>
            </td>
            
            {/* Titular */}
            <td className="align-middle">
                <span>{cuenta.titular || 'No especificado'}</span>
            </td>
            
            {/* Saldo actual */}
            <td className="align-middle">
                <div className="d-flex align-items-center justify-content-end">
                    <span className={`font-weight-bold ${getSaldoClass(cuenta.saldoActual, cuenta.alertas)}`}>
                        {formatCurrency(cuenta.saldoActual, cuenta.moneda)}
                    </span>
                    {parseFloat(cuenta.saldoActual) < parseFloat(cuenta.alertas?.saldoMinimo || 0) && (
                        <i className="fas fa-exclamation-triangle text-warning ml-2" 
                           title="Saldo por debajo del mínimo establecido"></i>
                    )}
                </div>
            </td>
            
            {/* Estado */}
            <td className="align-middle text-center">
                <span className={`badge ${cuenta.activa ? 'badge-success' : 'badge-secondary'}`}>
                    <i className={`fas ${cuenta.activa ? 'fa-check-circle' : 'fa-pause-circle'} mr-1`}></i>
                    {cuenta.activa ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            
            {/* Fecha de creación */}
            <td className="align-middle text-center">
                <span className="small text-gray-600">
                    {formatDate(cuenta.fechaCreacion)}
                </span>
            </td>
            
            {/* Acciones */}
            <td className="align-middle text-center">
                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        onClick={handleViewDetails}
                        title="Ver detalles"
                    >
                        <i className="fas fa-eye"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={handleEdit}
                        title="Editar cuenta"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleDelete}
                        title="Eliminar cuenta"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    );
});

CuentaBancariaRow.displayName = 'CuentaBancariaRow';

export default CuentaBancariaRow;
