import React, { useState, useEffect } from 'react';
import { 
    PlusCircle, 
    MinusCircle, 
    Calculator, 
    Filter, 
    Download,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Wallet
} from 'lucide-react';
import { movimientosCajaService } from '../../services/movimientosCajaService';
import ModalIngresoFinanzas from './ModalIngresoFinanzas';
import ModalEgresoFinanzas from './ModalEgresoFinanzas';
import ModalArqueoFinanzas from './ModalArqueoFinanzas';
import TablaMovimientosFinanzas from './TablaMovimientosFinanzas';

const MovimientosCajaFinanzas = () => {
    // Estados principales
    const [resumenDia, setResumenDia] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({
        fechaInicio: '', // Dejar vacío para test
        fechaFin: '', // Dejar vacío para test
        tipo: '',
        categoria: '',
        metodoPago: '',
        estado: ''
    });
    
    // Estados de modales
    const [modalIngreso, setModalIngreso] = useState(false);
    const [modalEgreso, setModalEgreso] = useState(false);
    const [modalArqueo, setModalArqueo] = useState(false);
    
    // Cargar datos iniciales
    useEffect(() => {
        cargarDatos();
    }, []);
    
    const cargarDatos = async () => {
        try {
            setLoading(true);
            await Promise.all([
                cargarResumenDia(),
                cargarMovimientos()
            ]);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const cargarResumenDia = async () => {
        try {
            const response = await movimientosCajaService.obtenerResumenDia();
            
            if (response.success) {
                setResumenDia(response.data);
            } else {
                console.warn('Error obteniendo resumen:', response.message);
                setResumenDia(null);
            }
        } catch (error) {
            console.error('Error cargando resumen:', error);
            setResumenDia(null);
        }
    };
    
    const cargarMovimientos = async () => {
        try {
            // Remover filtros vacíos
            const filtrosLimpios = Object.fromEntries(
                Object.entries(filtros).filter(([_, value]) => value !== '')
            );
            
            const response = await movimientosCajaService.obtenerMovimientos(filtrosLimpios);
            
            if (response.success) {
                const movimientos = response.data.movimientos || response.data || [];
                setMovimientos(movimientos);
            } else {
                console.error('Error en la respuesta del servidor:', response.message);
                setMovimientos([]);
            }
        } catch (error) {
            console.error('Error cargando movimientos:', error);
            setMovimientos([]);
        }
    };
    
    // Handlers
    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };
    
    const aplicarFiltros = () => {
        cargarMovimientos();
    };
    
    const limpiarFiltros = () => {
        setFiltros({
            fechaInicio: '',
            fechaFin: '',
            tipo: '',
            categoria: '',
            metodoPago: '',
            estado: ''
        });
    };
    
    const onMovimientoCreado = () => {
        cargarDatos(); // Recargar todo
        setModalIngreso(false);
        setModalEgreso(false);
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="flex items-center space-x-2 text-gray-600">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Cargando movimientos de caja...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                <div className="text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        💸 Movimientos de Caja
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                        Control centralizado de ingresos y egresos
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={() => setModalIngreso(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Registrar </span>Ingreso
                    </button>
                    
                    <button
                        onClick={() => setModalEgreso(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                    >
                        <MinusCircle className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Registrar </span>Egreso
                    </button>
                    
                    <button
                        onClick={() => setModalArqueo(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                        <Calculator className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Arqueo de </span>Caja
                    </button>
                </div>
            </div>
            
            {/* Resumen del Día */}
            {resumenDia && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Ingresos del Día */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-green-700 font-medium">Ingresos del Día</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-800">
                                    S/ {resumenDia.resumenGeneral.ingresos.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs sm:text-sm text-green-600">
                                    {resumenDia.resumenGeneral.ingresos.cantidad} movimientos
                                </p>
                            </div>
                            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                        </div>
                    </div>
                    
                    {/* Egresos del Día */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-700 font-medium">Egresos del Día</p>
                                <p className="text-2xl font-bold text-red-800">
                                    S/ {resumenDia.resumenGeneral.egresos.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-red-600">
                                    {resumenDia.resumenGeneral.egresos.cantidad} movimientos
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                    
                    {/* Saldo Neto */}
                    <div className={`bg-gradient-to-br p-6 rounded-xl border ${
                        resumenDia.resumenGeneral.saldoNeto >= 0
                            ? 'from-blue-50 to-blue-100 border-blue-200'
                            : 'from-orange-50 to-orange-100 border-orange-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`font-medium ${
                                    resumenDia.resumenGeneral.saldoNeto >= 0 ? 'text-blue-700' : 'text-orange-700'
                                }`}>
                                    Saldo Neto
                                </p>
                                <p className={`text-2xl font-bold ${
                                    resumenDia.resumenGeneral.saldoNeto >= 0 ? 'text-blue-800' : 'text-orange-800'
                                }`}>
                                    S/ {resumenDia.resumenGeneral.saldoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </p>
                                <p className={`text-sm ${
                                    resumenDia.resumenGeneral.saldoNeto >= 0 ? 'text-blue-600' : 'text-orange-600'
                                }`}>
                                    {resumenDia.fecha}
                                </p>
                            </div>
                            <Wallet className={`w-8 h-8 ${
                                resumenDia.resumenGeneral.saldoNeto >= 0 ? 'text-blue-600' : 'text-orange-600'
                            }`} />
                        </div>
                    </div>
                    
                    {/* Efectivo en Caja */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-700 font-medium">Efectivo en Caja</p>
                                <p className="text-2xl font-bold text-purple-800">
                                    S/ {resumenDia.efectivo.saldoEfectivo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-purple-600">
                                    Solo efectivo
                                </p>
                            </div>
                            <Wallet className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>
            )}
            
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={aplicarFiltros}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                            Aplicar
                        </button>
                        <button
                            onClick={limpiarFiltros}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            value={filtros.fechaInicio}
                            onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            value={filtros.fechaFin}
                            onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                        </label>
                        <select
                            value={filtros.tipo}
                            onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="ingreso">Ingresos</option>
                            <option value="egreso">Egresos</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Método de Pago
                        </label>
                        <select
                            value={filtros.metodoPago}
                            onChange={(e) => handleFiltroChange('metodoPago', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="yape">Yape</option>
                            <option value="plin">Plin</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="tarjeta">Tarjeta</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                        </label>
                        <select
                            value={filtros.estado}
                            onChange={(e) => handleFiltroChange('estado', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="validado">Validado</option>
                            <option value="aplicado">Aplicado</option>
                            <option value="anulado">Anulado</option>
                        </select>
                    </div>
                    
                    <div className="flex items-end">
                        <button
                            onClick={cargarDatos}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 flex items-center justify-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Tabla de Movimientos */}
            <TablaMovimientosFinanzas 
                movimientos={movimientos}
                onRefresh={cargarDatos}
            />
            
            {/* Modales */}
            {modalIngreso && (
                <ModalIngresoFinanzas
                    isOpen={modalIngreso}
                    onClose={() => setModalIngreso(false)}
                    onSuccess={onMovimientoCreado}
                />
            )}
            
            {modalEgreso && (
                <ModalEgresoFinanzas
                    isOpen={modalEgreso}
                    onClose={() => setModalEgreso(false)}
                    onSuccess={onMovimientoCreado}
                />
            )}
            
            {modalArqueo && (
                <ModalArqueoFinanzas
                    isOpen={modalArqueo}
                    onClose={() => setModalArqueo(false)}
                />
            )}
        </div>
    );
};

export default MovimientosCajaFinanzas;
