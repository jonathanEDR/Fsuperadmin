import React from 'react';
import ModalFinanciero from '../ModalFinanciero';
import CampoFormulario from '../CampoFormulario';
import { finanzasService } from '../../../services/finanzasService';

// ========== MODAL COMPACTO PARA CUENTAS BANCARIAS ==========
export const ModalCuentaBancaria = ({
    isOpen,
    onClose,
    onSubmit,
    cuentaEditando,
    formularioCuenta
}) => {
    const tiposCuenta = finanzasService.obtenerTiposCuenta();
    const monedas = finanzasService.obtenerMonedas();

    return (
        <ModalFinanciero
            isOpen={isOpen}
            onClose={onClose}
            titulo={cuentaEditando ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}
            onSubmit={onSubmit}
            size="xs"
            submitText={cuentaEditando ? 'Actualizar' : 'Crear'}
        >
            {/* Layout ultra-compacto con padding responsivo */}
            <div className="space-y-3 p-1">
                {/* Fila 1: Nombre */}
                <CampoFormulario
                    label="Nombre de la Cuenta"
                    name="nombre"
                    value={formularioCuenta.valores.nombre}
                    onChange={formularioCuenta.manejarCambio}
                    error={formularioCuenta.errores.nombre}
                    required
                    placeholder="Ej: Cuenta Principal BCP"
                />
                
                {/* Fila 2: Banco */}
                <CampoFormulario
                    label="Banco"
                    name="banco"
                    value={formularioCuenta.valores.banco}
                    onChange={formularioCuenta.manejarCambio}
                    error={formularioCuenta.errores.banco}
                    required
                    placeholder="Ej: Banco de Crédito"
                />

                {/* Fila 3: Tipo y Titular en grid compacto */}
                <div className="grid grid-cols-1 gap-3">
                    <CampoFormulario
                        label="Tipo de Cuenta"
                        name="tipoCuenta"
                        type="select"
                        value={formularioCuenta.valores.tipoCuenta}
                        onChange={formularioCuenta.manejarCambio}
                        error={formularioCuenta.errores.tipoCuenta}
                        options={tiposCuenta}
                        required
                    />
                    
                    <CampoFormulario
                        label="Titular"
                        name="titular"
                        value={formularioCuenta.valores.titular}
                        onChange={formularioCuenta.manejarCambio}
                        error={formularioCuenta.errores.titular}
                        required
                        placeholder="Nombre del titular"
                    />
                </div>

                {/* Fila 4: Número de cuenta */}
                <CampoFormulario
                    label="Número de Cuenta"
                    name="numeroCuenta"
                    value={formularioCuenta.valores.numeroCuenta}
                    onChange={formularioCuenta.manejarCambio}
                    error={formularioCuenta.errores.numeroCuenta}
                    required
                    placeholder="N° de cuenta"
                />
                
                {/* Fila 5: Moneda y Saldo en grid 2x1 */}
                <div className="grid grid-cols-2 gap-2">
                    <CampoFormulario
                        label="Moneda"
                        name="moneda"
                        type="select"
                        value={formularioCuenta.valores.moneda}
                        onChange={formularioCuenta.manejarCambio}
                        error={formularioCuenta.errores.moneda}
                        options={monedas}
                        required
                    />
                    
                    <CampoFormulario
                        label="Saldo Inicial"
                        name="saldoInicial"
                        type="number"
                        value={formularioCuenta.valores.saldoInicial}
                        onChange={formularioCuenta.manejarCambio}
                        error={formularioCuenta.errores.saldoInicial}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    />
                </div>

                {/* Descripción opcional */}
                <CampoFormulario
                    label="Descripción (opcional)"
                    name="descripcion"
                    value={formularioCuenta.valores.descripcion}
                    onChange={formularioCuenta.manejarCambio}
                    placeholder="Descripción breve..."
                />
            </div>
        </ModalFinanciero>
    );
};

export default ModalCuentaBancaria;
