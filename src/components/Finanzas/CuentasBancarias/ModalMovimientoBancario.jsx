import React from 'react';
import ModalCuentasBancarias from './ModalCuentasBancariasEspecifico';
import CampoCuentasBancarias from './CampoCuentasBancarias';
import { categoriasMovimiento } from './cuentasBancariasConfig';

// ========== MODAL COMPACTO PARA MOVIMIENTOS ==========
export const ModalMovimientoBancario = ({
    isOpen,
    onClose,
    onSubmit,
    tipoMovimiento,
    cuentaMovimiento,
    formularioMovimiento
}) => {
    return (
        <ModalCuentasBancarias
            isOpen={isOpen}
            onClose={onClose}
            titulo={`${tipoMovimiento === 'deposito' ? 'Depositar en' : 'Retirar de'} ${cuentaMovimiento?.nombre}`}
            onSubmit={onSubmit}
            submitText={tipoMovimiento === 'deposito' ? 'Depositar' : 'Retirar'}
            size="xs"
            className="!max-w-xs !mx-auto"
        >
            <div className="space-y-3">
                {/* Info cuenta - Más compacta */}
                <div className="bg-blue-50 p-2 rounded-md text-sm border border-blue-200">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{cuentaMovimiento?.nombre}</span>
                        <span className="font-bold text-blue-600">
                            {cuentaMovimiento?.moneda === 'USD' ? '$' : 'S/'} {cuentaMovimiento?.saldoActual?.toFixed(2) || '0.00'}
                        </span>
                    </div>
                </div>

                {/* Monto - Campo principal */}
                <CampoCuentasBancarias
                    label="Monto"
                    name="monto"
                    type="number"
                    value={formularioMovimiento.valores.monto}
                    onChange={formularioMovimiento.manejarCambio}
                    error={formularioMovimiento.errores.monto}
                    required
                    min="0.01"
                    step="0.01"
                    prefix={cuentaMovimiento?.moneda === 'USD' ? '$' : 'S/'}
                    placeholder="0.00"
                />
                
                {/* Descripción */}
                <CampoCuentasBancarias
                    label="Descripción"
                    name="descripcion"
                    value={formularioMovimiento.valores.descripcion}
                    onChange={formularioMovimiento.manejarCambio}
                    error={formularioMovimiento.errores.descripcion}
                    required
                    placeholder={`Motivo del ${tipoMovimiento === 'deposito' ? 'depósito' : 'retiro'}`}
                />
                
                {/* Campos opcionales en una fila */}
                <div className="grid grid-cols-1 gap-2">
                    <CampoCuentasBancarias
                        label="Referencia"
                        name="referencia"
                        value={formularioMovimiento.valores.referencia}
                        onChange={formularioMovimiento.manejarCambio}
                        placeholder="N° operación"
                    />
                    
                    <CampoCuentasBancarias
                        label="Categoría"
                        name="categoria"
                        type="select"
                        value={formularioMovimiento.valores.categoria}
                        onChange={formularioMovimiento.manejarCambio}
                        options={categoriasMovimiento}
                        placeholder="Seleccionar..."
                    />
                </div>

                {/* Resumen compacto */}
                {formularioMovimiento.valores.monto && (
                    <div className="bg-gray-50 p-2 rounded text-xs border-l-2 border-blue-400">
                        <div className="flex justify-between">
                            <span>Saldo resultante:</span>
                            <span className="font-bold text-blue-600">
                                {cuentaMovimiento?.moneda === 'USD' ? '$' : 'S/'} {
                                    tipoMovimiento === 'deposito' 
                                        ? ((cuentaMovimiento?.saldoActual || 0) + parseFloat(formularioMovimiento.valores.monto || 0)).toFixed(2)
                                        : ((cuentaMovimiento?.saldoActual || 0) - parseFloat(formularioMovimiento.valores.monto || 0)).toFixed(2)
                                }
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </ModalCuentasBancarias>
    );
};

export default ModalMovimientoBancario;
