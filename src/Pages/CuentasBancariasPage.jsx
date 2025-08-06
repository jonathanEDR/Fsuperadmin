import React from 'react';
import TablaCuentasBancarias from '../components/Finanzas/CuentasBancarias/TablaCuentasBancarias';
import CampoFormulario from '../components/Finanzas/CampoFormulario';
import { finanzasService } from '../services/finanzasService';
import {
    useCuentasBancarias,
    obtenerAcciones,
    opcionesEstado
} from '../components/Finanzas/CuentasBancarias';
// Nuevos modales separados y optimizados
import ModalCuentaBancaria from '../components/Finanzas/CuentasBancarias/ModalCuentaBancaria';
import ModalMovimientoBancario from '../components/Finanzas/CuentasBancarias/ModalMovimientoBancario';

const CuentasBancariasPage = () => {
    // Usar el hook personalizado que contiene toda la lógica
    const {
        // Estados
        cuentas,
        resumenCuentas,
        loading,
        filtros,
        paginacion,
        
        // Estados de modales
        modalAbierto,
        modalMovimiento,
        cuentaEditando,
        cuentaMovimiento,
        tipoMovimiento,
        
        // Formularios
        formularioCuenta,
        formularioMovimiento,
        
        // Funciones de modales
        abrirModalNuevaCuenta,
        abrirModalEditarCuenta,
        abrirModalMovimiento,
        cerrarModalCuenta,
        cerrarModalMovimiento,
        
        // Funciones de submit
        manejarSubmitCuenta,
        manejarSubmitMovimiento,
        
        // Otras funciones
        eliminarCuenta,
        manejarCambioPagina,
        setFiltros
    } = useCuentasBancarias();

    // Configuraciones
    const tiposCuenta = finanzasService.obtenerTiposCuenta();
    const monedas = finanzasService.obtenerMonedas();
    const acciones = obtenerAcciones({
        abrirModalMovimiento,
        abrirModalEditarCuenta,
        eliminarCuenta
    });

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto">
            {/* Header Responsive */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🏦 Cuentas Bancarias</h1>
                        <p className="mt-2 text-sm sm:text-base text-gray-600">
                            Gestiona tus cuentas bancarias y movimientos financieros
                        </p>
                    </div>
                    <button 
                        onClick={abrirModalNuevaCuenta}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
                    >
                        + Nueva Cuenta
                    </button>
                </div>
            </div>

            {/* Filtros Responsive */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <CampoFormulario
                        label="Banco"
                        name="banco"
                        value={filtros.banco}
                        onChange={(e) => setFiltros(prev => ({ ...prev, banco: e.target.value }))}
                        placeholder="Buscar por banco..."
                    />
                    
                    <CampoFormulario
                        label="Tipo de Cuenta"
                        name="tipoCuenta"
                        type="select"
                        value={filtros.tipoCuenta}
                        onChange={(e) => setFiltros(prev => ({ ...prev, tipoCuenta: e.target.value }))}
                        options={tiposCuenta}
                        placeholder="Todos los tipos"
                    />
                    
                    <CampoFormulario
                        label="Moneda"
                        name="moneda"
                        type="select"
                        value={filtros.moneda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, moneda: e.target.value }))}
                        options={monedas}
                        placeholder="Todas las monedas"
                    />
                    
                    <CampoFormulario
                        label="Estado"
                        name="activa"
                        type="select"
                        value={filtros.activa}
                        onChange={(e) => setFiltros(prev => ({ ...prev, activa: e.target.value }))}
                        options={opcionesEstado}
                        placeholder="Todos los estados"
                    />
                </div>
            </div>

            {/* Componente Completo: Tarjetas + Tabla de Cuentas Bancarias */}
            <TablaCuentasBancarias
                cuentas={cuentas}
                resumenCuentas={resumenCuentas}
                loading={loading}
                paginacion={paginacion}
                onPaginaChange={manejarCambioPagina}
                acciones={acciones}
            />

            {/* Modales Optimizados */}
            <ModalCuentaBancaria
                isOpen={modalAbierto}
                onClose={cerrarModalCuenta}
                onSubmit={manejarSubmitCuenta}
                cuentaEditando={cuentaEditando}
                formularioCuenta={formularioCuenta}
            />

            <ModalMovimientoBancario
                isOpen={modalMovimiento}
                onClose={cerrarModalMovimiento}
                onSubmit={manejarSubmitMovimiento}
                tipoMovimiento={tipoMovimiento}
                cuentaMovimiento={cuentaMovimiento}
                formularioMovimiento={formularioMovimiento}
            />
        </div>
    );
};

export default CuentasBancariasPage;
