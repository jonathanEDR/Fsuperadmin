import React, { memo, useCallback } from 'react';
import { Landmark, CreditCard, PiggyBank, Clock, TrendingUp, Wallet, AlertTriangle, CheckCircle, PauseCircle, Eye, Pencil, Trash2 } from 'lucide-react';

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
            'BCP': { icon: Landmark, color: 'text-blue-600' },
            'BBVA': { icon: Landmark, color: 'text-cyan-500' },
            'Interbank': { icon: Landmark, color: 'text-yellow-500' },
            'Scotiabank': { icon: Landmark, color: 'text-red-500' },
            'BanBif': { icon: Landmark, color: 'text-green-500' },
            'Banco_Pichincha': { icon: Landmark, color: 'text-gray-500' }
        };
        
        return iconMap[banco] || { icon: Landmark, color: 'text-gray-400' };
    }, []);
    
    // Obtener icono del tipo de cuenta
    const getTipoCuentaIcon = useCallback((tipoCuenta) => {
        const iconMap = {
            'corriente': { icon: CreditCard },
            'ahorros': { icon: PiggyBank },
            'plazo_fijo': { icon: Clock },
            'inversiones': { icon: TrendingUp }
        };
        
        return iconMap[tipoCuenta] || { icon: Wallet };
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
                    {(() => { const { icon: Icon, color } = getBankIcon(cuenta.banco); return <Icon size={20} className={color} style={{ marginRight: '8px' }} />; })()}
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
                    {(() => { const { icon: Icon } = getTipoCuentaIcon(cuenta.tipoCuenta); return <Icon size={16} style={{ marginRight: '6px' }} />; })()}
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
                        <AlertTriangle size={14} className="text-warning ml-2" 
                           title="Saldo por debajo del mínimo establecido" />
                    )}
                </div>
            </td>
            
            {/* Estado */}
            <td className="align-middle text-center">
                <span className={`badge ${cuenta.activa ? 'badge-success' : 'badge-secondary'}`}>
                    {cuenta.activa ? <CheckCircle size={14} className="mr-1" /> : <PauseCircle size={14} className="mr-1" />}
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
                        <Eye size={14} />
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={handleEdit}
                        title="Editar cuenta"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleDelete}
                        title="Eliminar cuenta"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

CuentaBancariaRow.displayName = 'CuentaBancariaRow';

export default CuentaBancariaRow;
