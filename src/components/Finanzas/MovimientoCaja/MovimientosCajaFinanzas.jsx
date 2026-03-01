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
import { movimientosCajaService } from '../../../services/movimientosCajaService';
import ModalIngresoFinanzas from './ModalIngresoFinanzas';
import ModalEgresoFinanzas from './ModalEgresoFinanzas';
import ModalArqueoFinanzas from './ModalArqueoFinanzas';
import TablaMovimientosFinanzas from './TablaMovimientosFinanzas';
import FinanzasLayout from '../common/FinanzasLayout';

const MovimientosCajaFinanzas = () => {
    // Estados principales
    const [resumenDia, setResumenDia] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMas, setLoadingMas] = useState(false);
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false); // Filtros colapsables - inicia cerrado
    const [filtros, setFiltros] = useState({
        fechaInicio: '',
        fechaFin: '',
        tipo: '',
        categoria: '',
        metodoPago: '', // Cambiado de tipoMovimiento a metodoPago (nombre que espera el backend)
        estado: ''
    });
    
    // Estados de paginación
    const [paginacion, setPaginacion] = useState({
        limite: 10,
        paginaActual: 1,
        totalRegistros: 0,
        totalPaginas: 0
    });
    const [mostrandoTodos, setMostrandoTodos] = useState(false);
    
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
    
    const cargarMovimientos = async (acumular = false) => {
        try {
            if (acumular) {
                setLoadingMas(true);
            }
            
            // Mapear los filtros correctamente al formato que espera el backend
            const filtrosParaEnviar = {
                ...(filtros.fechaInicio && { fechaInicio: filtros.fechaInicio }),
                ...(filtros.fechaFin && { fechaFin: filtros.fechaFin }),
                ...(filtros.tipo && { tipo: filtros.tipo }),
                ...(filtros.categoria && { categoria: filtros.categoria }),
                ...(filtros.metodoPago && { metodoPago: filtros.metodoPago }),
                ...(filtros.estado && { estado: filtros.estado }),
                limite: paginacion.limite,
                pagina: acumular ? paginacion.paginaActual + 1 : 1
            };
            
            const response = await movimientosCajaService.obtenerMovimientos(filtrosParaEnviar);
            
            if (response.success) {
                const nuevosMovimientos = response.data.movimientos || response.data || [];
                const paginacionData = response.data.paginacion || {
                    paginaActual: 1,
                    totalPaginas: 1,
                    totalRegistros: nuevosMovimientos.length,
                    registrosPorPagina: paginacion.limite
                };
                
                if (acumular) {
                    // Acumular movimientos
                    setMovimientos(prev => [...prev, ...nuevosMovimientos]);
                } else {
                    // Reemplazar movimientos
                    setMovimientos(nuevosMovimientos);
                }
                
                setPaginacion({
                    limite: paginacionData.registrosPorPagina || paginacion.limite,
                    paginaActual: paginacionData.paginaActual,
                    totalRegistros: paginacionData.totalRegistros,
                    totalPaginas: paginacionData.totalPaginas
                });
                
                // Verificar si ya mostramos todos
                const totalMostrados = acumular 
                    ? movimientos.length + nuevosMovimientos.length 
                    : nuevosMovimientos.length;
                setMostrandoTodos(totalMostrados >= paginacionData.totalRegistros);
                
            } else {
                console.error('Error en la respuesta del servidor:', response.message);
                if (!acumular) {
                    setMovimientos([]);
                }
            }
        } catch (error) {
            console.error('Error cargando movimientos:', error);
            if (!acumular) {
                setMovimientos([]);
            }
        } finally {
            setLoadingMas(false);
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
        // Resetear paginación cuando se aplican filtros
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
        setMostrandoTodos(false);
        cargarMovimientos(false);
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
        // Resetear paginación
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
        setMostrandoTodos(false);
    };
    
    const cargarMasMovimientos = () => {
        cargarMovimientos(true);
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
    
    // Acciones específicas para la toolbar - solo iconos en móvil
    const actions = (
        <div className="flex flex-row gap-2">
            <button
                onClick={() => setModalIngreso(true)}
                className="inline-flex items-center justify-center px-2 sm:px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
                title="Registrar Ingreso"
            >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline ml-2">Ingreso</span>
            </button>
            
            <button
                onClick={() => setModalEgreso(true)}
                className="inline-flex items-center justify-center px-2 sm:px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm"
                title="Registrar Egreso"
            >
                <MinusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline ml-2">Egreso</span>
            </button>
            
            <button
                onClick={() => setModalArqueo(true)}
                className="inline-flex items-center justify-center px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                title="Arqueo de Caja"
            >
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline ml-2">Arqueo</span>
            </button>
        </div>
    );

    return (
        <FinanzasLayout 
            currentModule="movimientos-caja"
            title="Movimientos de Caja"
            loading={loading}
            actions={actions}
        >
            <div className="space-y-4 sm:space-y-6">
                {/* Resumen del Día */}
                {resumenDia && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                        {/* Ingresos del Día */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 lg:p-6 rounded-xl border border-green-200">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] sm:text-xs lg:text-sm text-green-700 font-medium">Ingresos del Día</p>
                                    <p className="text-sm sm:text-lg lg:text-2xl font-bold text-green-800 truncate">
                                        S/ {resumenDia.resumenGeneral.ingresos.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] sm:text-xs lg:text-sm text-green-600">
                                        {resumenDia.resumenGeneral.ingresos.cantidad} mov.
                                    </p>
                                </div>
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 flex-shrink-0 ml-1" />
                            </div>
                        </div>
                        
                        {/* Egresos del Día */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 lg:p-6 rounded-xl border border-red-200">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] sm:text-xs lg:text-sm text-red-700 font-medium">Egresos del Día</p>
                                    <p className="text-sm sm:text-lg lg:text-2xl font-bold text-red-800 truncate">
                                        S/ {resumenDia.resumenGeneral.egresos.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] sm:text-xs lg:text-sm text-red-600">
                                        {resumenDia.resumenGeneral.egresos.cantidad} mov.
                                    </p>
                                </div>
                                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600 flex-shrink-0 ml-1" />
                            </div>
                        </div>
                        
                        {/* Saldo Neto */}
                        <div className={`bg-gradient-to-br p-3 sm:p-4 lg:p-6 rounded-xl border ${
                            resumenDia.resumenGeneral.saldoNeto >= 0
                                ? 'from-blue-50 to-blue-100 border-blue-200'
                                : 'from-orange-50 to-orange-100 border-orange-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className={`text-[10px] sm:text-xs lg:text-sm font-medium ${
                                        resumenDia.resumenGeneral.saldoNeto >= 0 ? 'text-blue-700' : 'text-orange-700'
                                    }`}>
                                        Saldo Neto
                                    </p>
                                    <p className={`text-sm sm:text-lg lg:text-2xl font-bold truncate ${
                                        resumenDia.resumenGeneral.saldoNeto >= 0 ? 'text-blue-800' : 'text-orange-800'
                                    }`}>
                                        S/ {resumenDia.resumenGeneral.saldoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-[10px] sm:text-xs lg:text-sm ${
                                        resumenDia.resumenGeneral.saldoNeto >= 0 ? 'text-blue-600' : 'text-orange-600'
                                    }`}>
                                        {resumenDia.fecha}
                                    </p>
                                </div>
                                <Wallet className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 flex-shrink-0 ml-1 ${
                                    resumenDia.resumenGeneral.saldoNeto >= 0 ? 'text-blue-600' : 'text-orange-600'
                                }`} />
                            </div>
                        </div>
                        
                        {/* Efectivo en Caja */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 lg:p-6 rounded-xl border border-purple-200">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] sm:text-xs lg:text-sm text-purple-700 font-medium">Efectivo en Caja</p>
                                    <p className="text-sm sm:text-lg lg:text-2xl font-bold text-purple-800 truncate">
                                        S/ {resumenDia.efectivo.saldoEfectivo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] sm:text-xs lg:text-sm text-purple-600">
                                        Solo efectivo
                                    </p>
                                </div>
                                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0 ml-1" />
                            </div>
                        </div>
                    </div>
                )}
            
            {/* Filtros Colapsables */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header colapsable */}
                <button
                    type="button"
                    onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        <span className="text-sm sm:text-base font-semibold text-gray-900">Filtros</span>
                        {Object.values(filtros).some(v => v !== '') && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                {Object.values(filtros).filter(v => v !== '').length} activo(s)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {Object.values(filtros).some(v => v !== '') && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    limpiarFiltros();
                                }}
                                className="text-xs sm:text-sm text-gray-500 hover:text-red-600 cursor-pointer"
                            >
                                Limpiar
                            </span>
                        )}
                        <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${filtrosAbiertos ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                
                {/* Contenido colapsable */}
                <div className={`transition-all duration-300 ease-in-out ${filtrosAbiertos ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-3 sm:p-4 pt-0 border-t border-gray-200">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 pt-3 sm:pt-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    <span className="hidden sm:inline">Fecha </span>Inicio
                                </label>
                                <input
                                    type="date"
                                    value={filtros.fechaInicio}
                                    onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    <span className="hidden sm:inline">Fecha </span>Fin
                                </label>
                                <input
                                    type="date"
                                    value={filtros.fechaFin}
                                    onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={filtros.tipo}
                                    onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="ingreso">Ingresos</option>
                                    <option value="egreso">Egresos</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    <span className="hidden sm:inline">Tipo </span>Mov.
                                </label>
                                <select
                                    value={filtros.metodoPago}
                                    onChange={(e) => handleFiltroChange('metodoPago', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="bancario">Bancario</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={filtros.estado}
                                    onChange={(e) => handleFiltroChange('estado', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="validado">Validado</option>
                                    <option value="aplicado">Aplicado</option>
                                    <option value="anulado">Anulado</option>
                                </select>
                            </div>
                            
                            <div className="flex items-end col-span-2 sm:col-span-1">
                                <button
                                    onClick={aplicarFiltros}
                                    className="w-full px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm hover:bg-blue-700 flex items-center justify-center"
                                >
                                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
                {/* Tabla de Movimientos */}
                <TablaMovimientosFinanzas 
                    movimientos={movimientos}
                    onRefresh={cargarDatos}
                    paginacion={paginacion}
                    mostrandoTodos={mostrandoTodos}
                    onCargarMas={cargarMasMovimientos}
                    loadingMas={loadingMas}
                />
            </div>
            
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
        </FinanzasLayout>
    );
};

export default MovimientosCajaFinanzas;
