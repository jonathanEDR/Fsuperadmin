import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TablaCuentasBancarias from '../components/Finanzas/CuentasBancarias/TablaCuentasBancarias';
import CampoCuentasBancarias from '../components/Finanzas/CuentasBancarias/CampoCuentasBancarias';
import { finanzasService } from '../services/finanzasService';
import {
    useCuentasBancarias,
    obtenerAcciones,
    opcionesEstado
} from '../components/Finanzas/CuentasBancarias';
// Solo el modal de cuenta bancaria
import ModalCuentaBancaria from '../components/Finanzas/CuentasBancarias/ModalCuentaBancaria';

const CuentasBancariasPage = () => {
    const navigate = useNavigate();
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    
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
        cuentaEditando,
        
        // Formularios
        formularioCuenta,
        
        // Funciones de modales
        abrirModalNuevaCuenta,
        abrirModalEditarCuenta,
        cerrarModalCuenta,
        
        // Funciones de submit
        manejarSubmitCuenta,
        
        // Otras funciones
        eliminarCuenta,
        manejarCambioPagina,
        setFiltros
    } = useCuentasBancarias();

    // Función para ver movimientos de una cuenta (navegar a historial)
    const verMovimientosCuenta = (cuenta) => {
        // Aquí puedes navegar a una página de historial de movimientos
        console.log('Ver movimientos de:', cuenta);
        // navigate(`/cuentas-bancarias/${cuenta._id}/movimientos`);
    };

    // Configuraciones
    const tiposCuenta = finanzasService.obtenerTiposCuenta();
    const monedas = finanzasService.obtenerMonedas();
    const acciones = obtenerAcciones({
        verMovimientosCuenta,
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
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/finanzas/movimientos-caja')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            title="Ir a Movimientos de Caja para gestionar ingresos y egresos bancarios"
                        >
                            💰 Movimientos
                        </button>
                        <button 
                            onClick={abrirModalNuevaCuenta}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
                        >
                            + Nueva Cuenta
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtros Colapsables Mejorados */}
            <div className="bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <button 
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className="flex items-center justify-between w-full text-left hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors"
                    >
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                            <span className="mr-2">🔍</span>
                            Filtros de búsqueda
                            {Object.values(filtros).some(val => val !== '') && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {Object.values(filtros).filter(val => val !== '').length} activo(s)
                                </span>
                            )}
                        </h3>
                        <span className={`transform transition-all duration-200 text-gray-500 ${mostrarFiltros ? 'rotate-180' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </button>
                </div>
                
                <div className={`transition-all duration-300 ease-in-out ${mostrarFiltros ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <CampoCuentasBancarias
                                label="Banco"
                                name="banco"
                                value={filtros.banco}
                                onChange={(e) => setFiltros(prev => ({ ...prev, banco: e.target.value }))}
                                placeholder="Buscar por banco..."
                            />
                            
                            <CampoCuentasBancarias
                                label="Tipo de Cuenta"
                                name="tipoCuenta"
                                type="select"
                                value={filtros.tipoCuenta}
                                onChange={(e) => setFiltros(prev => ({ ...prev, tipoCuenta: e.target.value }))}
                                options={tiposCuenta}
                                placeholder="Todos los tipos"
                            />
                            
                            <CampoCuentasBancarias
                                label="Moneda"
                                name="moneda"
                                type="select"
                                value={filtros.moneda}
                                onChange={(e) => setFiltros(prev => ({ ...prev, moneda: e.target.value }))}
                                options={monedas}
                                placeholder="Todas las monedas"
                            />
                            
                            <CampoCuentasBancarias
                                label="Estado"
                                name="activa"
                                type="select"
                                value={filtros.activa}
                                onChange={(e) => setFiltros(prev => ({ ...prev, activa: e.target.value }))}
                                options={opcionesEstado}
                                placeholder="Todos los estados"
                            />
                        </div>
                        
                        {/* Botón para limpiar filtros */}
                        {Object.values(filtros).some(val => val !== '') && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setFiltros({ banco: '', tipoCuenta: '', moneda: '', activa: '' })}
                                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Limpiar filtros
                                </button>
                            </div>
                        )}
                    </div>
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
        </div>
    );
};

export default CuentasBancariasPage;
