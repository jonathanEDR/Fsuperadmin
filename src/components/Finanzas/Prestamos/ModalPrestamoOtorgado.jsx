import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, X } from 'lucide-react';
import CampoPrestamos from './CampoPrestamos';
import DesgloseEfectivoPrestamo from './components/DesgloseEfectivoPrestamo';
import { movimientosCajaService } from '../../../services/movimientosCajaService';
import {
    opcionesTipoPrestatario,
    opcionesTipoDocumento,
    opcionesTipoDescuento,
    opcionesPeriodoDescuento,
    opcionesUnidadPlazo
} from './prestamosConfig.jsx';

/**
 * Modal para crear PRÉSTAMOS OTORGADOS
 * Este modal se usa cuando TÚ prestas dinero a un trabajador, proveedor, cliente o particular
 * El dinero SALE de tu caja hacia el prestatario (EGRESO)
 */
const ModalPrestamoOtorgado = ({
    isOpen,
    onClose,
    onSubmit,
    formulario,
    prestamoEditando,
    loading,
    trabajadores = [],
    onBuscarTrabajador,
    onSeleccionarTrabajador,
    loadingTrabajadores = false
}) => {
    const [mostrarBuscadorTrabajador, setMostrarBuscadorTrabajador] = useState(false);
    const [busquedaTrabajador, setBusquedaTrabajador] = useState('');
    const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
    
    // === NUEVO: Estados para arqueo de caja ===
    const [saldoCaja, setSaldoCaja] = useState({
        billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
        monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
    });
    const [loadingArqueo, setLoadingArqueo] = useState(false);
    const [totalDisponibleCaja, setTotalDisponibleCaja] = useState(0);

    // Resetear estado cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setMostrarBuscadorTrabajador(false);
            setBusquedaTrabajador('');
            setTrabajadorSeleccionado(null);
        } else {
            // Cargar arqueo cuando se abre el modal
            cargarArqueoCaja();
        }
    }, [isOpen]);

    // === MODIFICADO: Función para cargar saldo de caja ACUMULADO (no solo del día) ===
    const cargarArqueoCaja = async () => {
        try {
            setLoadingArqueo(true);
            // Usar el nuevo endpoint que obtiene el saldo ACUMULADO de todo el histórico
            const response = await movimientosCajaService.obtenerSaldoEfectivoAcumulado();
            if (response.success && response.data?.desglose) {
                const { billetes, monedas } = response.data.desglose;
                setSaldoCaja({
                    billetes: {
                        b200: Math.max(0, billetes?.b200 || 0),
                        b100: Math.max(0, billetes?.b100 || 0),
                        b50: Math.max(0, billetes?.b50 || 0),
                        b20: Math.max(0, billetes?.b20 || 0),
                        b10: Math.max(0, billetes?.b10 || 0)
                    },
                    monedas: {
                        m5: Math.max(0, monedas?.m5 || 0),
                        m2: Math.max(0, monedas?.m2 || 0),
                        m1: Math.max(0, monedas?.m1 || 0),
                        c50: Math.max(0, monedas?.c50 || 0),
                        c20: Math.max(0, monedas?.c20 || 0),
                        c10: Math.max(0, monedas?.c10 || 0)
                    }
                });
                // Usar efectivoDisponible o valorCalculado
                setTotalDisponibleCaja(response.data.efectivoDisponible || response.data.valorCalculado || 0);
                console.log('💰 Saldo de caja acumulado cargado:', response.data.efectivoDisponible || response.data.valorCalculado);
            }
        } catch (error) {
            console.error('Error cargando saldo de caja acumulado:', error);
        } finally {
            setLoadingArqueo(false);
        }
    };

    // Manejar cambio de tipo de prestatario
    useEffect(() => {
        const tipoPrestatario = formulario.valores?.tipoPrestatario;
        if (tipoPrestatario === 'trabajador') {
            setMostrarBuscadorTrabajador(true);
        } else {
            setMostrarBuscadorTrabajador(false);
            setTrabajadorSeleccionado(null);
        }
    }, [formulario.valores?.tipoPrestatario]);

    if (!isOpen) return null;

    const tipoPrestatario = formulario.valores?.tipoPrestatario || 'particular';
    const esTrabajador = tipoPrestatario === 'trabajador';
    const mostrarDescuentoNomina = esTrabajador && formulario.valores?.prestatarioRef;

    // Tipo de movimiento seleccionado
    const tipoMovimiento = formulario.valores?.tipoMovimiento || 'efectivo';

    // Calcular total del desglose
    const totalDesglose = useMemo(() => {
        const desglose = formulario.valores?.desgloseEfectivo || { billetes: {}, monedas: {} };
        const { billetes, monedas } = desglose;
        const totalBilletes =
            (billetes?.b200 || 0) * 200 +
            (billetes?.b100 || 0) * 100 +
            (billetes?.b50 || 0) * 50 +
            (billetes?.b20 || 0) * 20 +
            (billetes?.b10 || 0) * 10;
        const totalMonedas =
            (monedas?.m5 || 0) * 5 +
            (monedas?.m2 || 0) * 2 +
            (monedas?.m1 || 0) * 1 +
            (monedas?.c50 || 0) * 0.5 +
            (monedas?.c20 || 0) * 0.2 +
            (monedas?.c10 || 0) * 0.1;
        return totalBilletes + totalMonedas;
    }, [formulario.valores?.desgloseEfectivo]);

    // Tipos de prestatario disponibles para préstamos otorgados (excluye 'interno')
    const tiposPrestatarioOtorgado = [
        { value: 'particular', label: 'Particular' },
        { value: 'trabajador', label: 'Trabajador/Empleado' },
        { value: 'proveedor', label: 'Proveedor' },
        { value: 'cliente', label: 'Cliente' },
        { value: 'otro', label: 'Otro' }
    ];

    // Manejar cambios en el desglose de efectivo
    const handleDesgloseChange = (tipo, key, valor) => {
        const currentDesglose = formulario.valores?.desgloseEfectivo || {
            billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
            monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
        };
        
        const nuevoDesglose = {
            ...currentDesglose,
            [tipo]: {
                ...currentDesglose[tipo],
                [key]: valor
            }
        };
        
        formulario.manejarCambio({
            target: { name: 'desgloseEfectivo', value: nuevoDesglose }
        });
    };

    // === Actualizar todo el desglose de una vez (para auto-distribuir) ===
    const handleDesgloseCompleto = (nuevoDesglose) => {
        formulario.manejarCambio({
            target: { name: 'desgloseEfectivo', value: nuevoDesglose }
        });
    };

    // Manejar búsqueda de trabajadores
    const handleBuscarTrabajador = (e) => {
        const valor = e.target.value;
        setBusquedaTrabajador(valor);
        if (onBuscarTrabajador && valor.length >= 2) {
            onBuscarTrabajador(valor);
        }
    };

    // Manejar selección de trabajador
    const handleSeleccionarTrabajador = (trabajador) => {
        setTrabajadorSeleccionado(trabajador);
        setBusquedaTrabajador('');
        if (onSeleccionarTrabajador) {
            onSeleccionarTrabajador(trabajador);
        }
        // Actualizar formulario con datos del trabajador
        formulario.manejarCambio({
            target: { name: 'prestatarioRef', value: trabajador._id }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.nombre', value: trabajador.nombreCompleto || `${trabajador.nombre} ${trabajador.apellido}` }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.documento', value: trabajador.documento || '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.telefono', value: trabajador.telefono || '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.email', value: trabajador.email || '' }
        });
    };

    // Limpiar trabajador seleccionado
    const handleLimpiarTrabajador = () => {
        setTrabajadorSeleccionado(null);
        formulario.manejarCambio({
            target: { name: 'prestatarioRef', value: null }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.nombre', value: '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.documento', value: '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.telefono', value: '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.email', value: '' }
        });
    };

    // Manejar submit - simplemente llamar al onSubmit del padre
    // La lógica de configurar entidadFinanciera y tipo se hace en PrestamosOptimizado
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                {/* Header - Color verde para distinguir - responsive */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-base sm:text-xl font-bold text-gray-800">
                                {prestamoEditando ? 'Editar' : 'Nuevo'} <span className="hidden xs:inline">Préstamo </span>Otorgado
                            </h2>
                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
                                💸 Dinero sale de tu caja
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/80 rounded-xl text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body - scrollable */}
                <form onSubmit={handleSubmit} className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
                    {/* Alerta informativa - responsive */}
                    <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl">💰</span>
                            <div>
                                <h4 className="font-medium text-green-800 text-sm sm:text-base">Préstamo Otorgado</h4>
                                <p className="text-xs sm:text-sm text-green-700 mt-1">
                                    Dinero que TÚ prestas. Se registra como <strong>EGRESO</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tipo de Prestatario - responsive */}
                    <div className="mb-4 sm:mb-6">
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b pb-2 mb-3 sm:mb-4">
                            👤 ¿A quién le prestas?
                        </h3>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            <CampoPrestamos
                                name="tipoPrestatario"
                                label="Tipo de Prestatario"
                                type="select"
                                value={tipoPrestatario}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores?.tipoPrestatario}
                                options={tiposPrestatarioOtorgado}
                                required
                            />
                        </div>

                        {/* Buscador de Trabajadores - responsive */}
                        {esTrabajador && (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <h4 className="text-sm sm:text-md font-medium text-blue-800 mb-2 sm:mb-3">
                                    Seleccionar Trabajador
                                </h4>

                                {trabajadorSeleccionado ? (
                                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 bg-white p-2 sm:p-3 rounded-xl border border-blue-300">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                {(trabajadorSeleccionado.nombre || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm sm:text-base">
                                                    {trabajadorSeleccionado.nombreCompleto || `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-500">
                                                    {trabajadorSeleccionado.cargo || 'Sin cargo'} - {trabajadorSeleccionado.documento || 'Sin documento'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleLimpiarTrabajador}
                                            className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-300 hover:bg-red-50"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={busquedaTrabajador}
                                            onChange={handleBuscarTrabajador}
                                            placeholder="Buscar por nombre, documento o cargo..."
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />

                                        {loadingTrabajadores && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                                            </div>
                                        )}

                                        {/* Lista de trabajadores */}
                                        {trabajadores.length > 0 && busquedaTrabajador.length >= 2 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                {trabajadores.map((trabajador) => (
                                                    <button
                                                        key={trabajador._id}
                                                        type="button"
                                                        onClick={() => handleSeleccionarTrabajador(trabajador)}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                                {(trabajador.nombre || '?')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">
                                                                    {trabajador.nombreCompleto || `${trabajador.nombre} ${trabajador.apellido}`}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {trabajador.cargo || 'Sin cargo'} | {trabajador.documento || 'Sin documento'}
                                                                    {trabajador.sueldoBase && (
                                                                        <span className="ml-2 text-green-600">
                                                                            S/ {trabajador.sueldoBase.toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {busquedaTrabajador.length >= 2 && trabajadores.length === 0 && !loadingTrabajadores && (
                                            <p className="mt-2 text-sm text-gray-500">
                                                No se encontraron trabajadores
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Información del Prestatario (para particulares u otros) */}
                        {!esTrabajador && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <CampoPrestamos
                                    name="prestatario.nombre"
                                    label="Nombre del Prestatario"
                                    value={formulario.valores?.prestatario?.nombre || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores?.['prestatario.nombre']}
                                    required
                                    placeholder="Nombre completo"
                                />

                                <CampoPrestamos
                                    name="prestatario.tipoDocumento"
                                    label="Tipo de Documento"
                                    type="select"
                                    value={formulario.valores?.prestatario?.tipoDocumento || 'DNI'}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores?.['prestatario.tipoDocumento']}
                                    options={opcionesTipoDocumento}
                                />

                                <CampoPrestamos
                                    name="prestatario.documento"
                                    label="Número de Documento"
                                    value={formulario.valores?.prestatario?.documento || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores?.['prestatario.documento']}
                                    placeholder="Ej: 12345678"
                                />

                                <CampoPrestamos
                                    name="prestatario.telefono"
                                    label="Teléfono"
                                    value={formulario.valores?.prestatario?.telefono || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores?.['prestatario.telefono']}
                                    placeholder="Ej: 987654321"
                                />

                                <CampoPrestamos
                                    name="prestatario.email"
                                    label="Email"
                                    type="email"
                                    value={formulario.valores?.prestatario?.email || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores?.['prestatario.email']}
                                    placeholder="ejemplo@correo.com"
                                />

                                <CampoPrestamos
                                    name="prestatario.direccion"
                                    label="Dirección"
                                    value={formulario.valores?.prestatario?.direccion || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores?.['prestatario.direccion']}
                                    placeholder="Dirección completa"
                                />
                            </div>
                        )}
                    </div>

                    {/* Detalles del Préstamo - responsive */}
                    <div className="mb-4 sm:mb-6">
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b pb-2 mb-3 sm:mb-4">
                            💵 Detalles del Préstamo
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <CampoPrestamos
                                name="montoSolicitado"
                                label="Monto a Prestar"
                                type="number"
                                value={formulario.valores?.montoSolicitado || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores?.montoSolicitado}
                                required
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />

                            <CampoPrestamos
                                name="tasaInteres.porcentaje"
                                label="Tasa de Interés (%)"
                                type="number"
                                value={formulario.valores?.tasaInteres?.porcentaje || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores?.['tasaInteres.porcentaje']}
                                required
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                max="100"
                            />

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <CampoPrestamos
                                        name="plazo.cantidad"
                                        label="Plazo"
                                        type="number"
                                        value={formulario.valores?.plazo?.cantidad || ''}
                                        onChange={formulario.manejarCambio}
                                        error={formulario.errores?.['plazo.cantidad']}
                                        required
                                        placeholder="12"
                                        min="1"
                                    />
                                </div>
                                <div className="w-32">
                                    <CampoPrestamos
                                        name="plazo.unidad"
                                        label="Unidad"
                                        type="select"
                                        value={formulario.valores?.plazo?.unidad || 'meses'}
                                        onChange={formulario.manejarCambio}
                                        error={formulario.errores?.['plazo.unidad']}
                                        options={opcionesUnidadPlazo}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Resumen del préstamo - responsive */}
                        {formulario.valores?.montoSolicitado > 0 && formulario.valores?.plazo?.cantidad > 0 && (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Resumen:</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                                    <div>
                                        <span className="text-gray-500">Capital:</span>
                                        <p className="font-semibold">S/{parseFloat(formulario.valores.montoSolicitado || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Tasa:</span>
                                        <p className="font-semibold">{formulario.valores?.tasaInteres?.porcentaje || 0}%</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Plazo:</span>
                                        <p className="font-semibold">{formulario.valores?.plazo?.cantidad} {formulario.valores?.plazo?.unidad}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Cuota Est.:</span>
                                        <p className="font-semibold text-green-600">
                                            S/{calcularCuotaEstimada(
                                                formulario.valores?.montoSolicitado,
                                                formulario.valores?.tasaInteres?.porcentaje,
                                                formulario.valores?.plazo?.cantidad,
                                                formulario.valores?.plazo?.unidad
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* === Método de Entrega del Dinero - responsive === */}
                    <div className="mb-4 sm:mb-6">
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b pb-2 mb-3 sm:mb-4">
                            💰 Método de Entrega
                        </h3>

                        {/* Selector de tipo de movimiento - responsive */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <button
                                type="button"
                                onClick={() => formulario.manejarCambio({ target: { name: 'tipoMovimiento', value: 'efectivo' } })}
                                className={`p-2 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                                    tipoMovimiento === 'efectivo'
                                        ? 'border-green-500 bg-green-50 shadow-md'
                                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-xl sm:text-3xl mb-1 sm:mb-2">💵</span>
                                <span className={`text-xs sm:text-base font-semibold ${tipoMovimiento === 'efectivo' ? 'text-green-700' : 'text-gray-700'}`}>
                                    Efectivo
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">Con desglose</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => formulario.manejarCambio({ target: { name: 'tipoMovimiento', value: 'bancario' } })}
                                className={`p-2 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                                    tipoMovimiento === 'bancario'
                                        ? 'border-green-500 bg-green-50 shadow-md'
                                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-xl sm:text-3xl mb-1 sm:mb-2">🏦</span>
                                <span className={`text-xs sm:text-base font-semibold ${tipoMovimiento === 'bancario' ? 'text-green-700' : 'text-gray-700'}`}>
                                    <span className="hidden sm:inline">Transferencia </span>Bancaria
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">Depósito o transferencia</span>
                            </button>
                        </div>

                        {/* Desglose de efectivo */}
                        {tipoMovimiento === 'efectivo' && (
                            <DesgloseEfectivoPrestamo
                                desglose={formulario.valores?.desgloseEfectivo || {
                                    billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                                    monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
                                }}
                                saldoCaja={saldoCaja}
                                onDesgloseChange={handleDesgloseChange}
                                onDesgloseCompleto={handleDesgloseCompleto}
                                loading={loadingArqueo}
                                totalDisponible={totalDisponibleCaja}
                                montoAPagar={parseFloat(formulario.valores?.montoSolicitado) || 0}
                            />
                        )}

                        {/* Datos bancarios - responsive */}
                        {tipoMovimiento === 'bancario' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <CampoPrestamos
                                        name="datosBancarios.banco"
                                        label="Banco"
                                        value={formulario.valores?.datosBancarios?.banco || ''}
                                        onChange={formulario.manejarCambio}
                                        placeholder="Ej: BCP, BBVA, Interbank"
                                    />
                                    <CampoPrestamos
                                        name="datosBancarios.numeroCuenta"
                                        label="N° de Cuenta Destino"
                                        value={formulario.valores?.datosBancarios?.numeroCuenta || ''}
                                        onChange={formulario.manejarCambio}
                                        placeholder="Cuenta del prestatario"
                                    />
                                    <CampoPrestamos
                                        name="datosBancarios.numeroOperacion"
                                        label="N° de Operación"
                                        value={formulario.valores?.datosBancarios?.numeroOperacion || ''}
                                        onChange={formulario.manejarCambio}
                                        placeholder="Número de transacción"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Advertencia si hay diferencia en el desglose */}
                        {tipoMovimiento === 'efectivo' && formulario.valores?.montoSolicitado > 0 && (
                            <div className="mt-3">
                                {Math.abs(totalDesglose - parseFloat(formulario.valores.montoSolicitado)) > 0.01 ? (
                                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                                        <span>⚠️</span>
                                        El desglose (S/ {totalDesglose.toFixed(2)}) no coincide con el monto a prestar (S/ {parseFloat(formulario.valores.montoSolicitado).toFixed(2)})
                                    </div>
                                ) : totalDesglose > 0 && (
                                    <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                                        <span>✅</span>
                                        Desglose correcto: S/ {totalDesglose.toFixed(2)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Descuento de Nómina (solo para trabajadores) */}
                    {mostrarDescuentoNomina && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                                💼 Descuento de Nómina
                            </h3>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-yellow-600">⚠️</span>
                                    <p className="text-sm text-yellow-800">
                                        Al habilitar el descuento de nómina, las cuotas del préstamo se descontarán
                                        automáticamente del sueldo del trabajador.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    type="checkbox"
                                    id="descuentoNomina.aplicable"
                                    name="descuentoNomina.aplicable"
                                    checked={formulario.valores?.descuentoNomina?.aplicable || false}
                                    onChange={(e) => formulario.manejarCambio({
                                        target: {
                                            name: 'descuentoNomina.aplicable',
                                            value: e.target.checked
                                        }
                                    })}
                                    className="w-5 h-5 text-green-600 border-gray-200 rounded focus:ring-green-500"
                                />
                                <label htmlFor="descuentoNomina.aplicable" className="text-gray-700 font-medium">
                                    Aplicar descuento automático de nómina
                                </label>
                            </div>

                            {formulario.valores?.descuentoNomina?.aplicable && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <CampoPrestamos
                                        name="descuentoNomina.tipoDescuento"
                                        label="Tipo de Descuento"
                                        type="select"
                                        value={formulario.valores?.descuentoNomina?.tipoDescuento || 'cuota_completa'}
                                        onChange={formulario.manejarCambio}
                                        error={formulario.errores?.['descuentoNomina.tipoDescuento']}
                                        options={opcionesTipoDescuento}
                                    />

                                    {formulario.valores?.descuentoNomina?.tipoDescuento === 'porcentaje' && (
                                        <CampoPrestamos
                                            name="descuentoNomina.porcentaje"
                                            label="Porcentaje a Descontar (%)"
                                            type="number"
                                            value={formulario.valores?.descuentoNomina?.porcentaje || ''}
                                            onChange={formulario.manejarCambio}
                                            error={formulario.errores?.['descuentoNomina.porcentaje']}
                                            placeholder="30"
                                            min="1"
                                            max="100"
                                        />
                                    )}

                                    {formulario.valores?.descuentoNomina?.tipoDescuento === 'monto_fijo' && (
                                        <CampoPrestamos
                                            name="descuentoNomina.montoFijo"
                                            label="Monto Fijo a Descontar"
                                            type="number"
                                            value={formulario.valores?.descuentoNomina?.montoFijo || ''}
                                            onChange={formulario.manejarCambio}
                                            error={formulario.errores?.['descuentoNomina.montoFijo']}
                                            placeholder="500.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    )}

                                    <CampoPrestamos
                                        name="descuentoNomina.periodoDescuento"
                                        label="Período de Descuento"
                                        type="select"
                                        value={formulario.valores?.descuentoNomina?.periodoDescuento || 'mensual'}
                                        onChange={formulario.manejarCambio}
                                        error={formulario.errores?.['descuentoNomina.periodoDescuento']}
                                        options={opcionesPeriodoDescuento}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Información Adicional */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                            📝 Información Adicional
                        </h3>

                        <CampoPrestamos
                            name="proposito"
                            label="Propósito del Préstamo"
                            type="textarea"
                            value={formulario.valores?.proposito || ''}
                            onChange={formulario.manejarCambio}
                            error={formulario.errores?.proposito}
                            placeholder="¿Para qué se usará el dinero?"
                            rows={2}
                        />

                        <div className="mt-4">
                            <CampoPrestamos
                                name="observaciones"
                                label="Observaciones"
                                type="textarea"
                                value={formulario.valores?.observaciones || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores?.observaciones}
                                placeholder="Notas adicionales..."
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Footer - responsive */}
                    <div className="flex justify-end gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 sm:px-6 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-3 sm:px-6 py-2 text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4 text-green-600" />
                                    <span className="hidden sm:inline">Guardando...</span>
                                </>
                            ) : (
                                <>
                                    💸 {prestamoEditando ? 'Actualizar' : 'Registrar'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Función auxiliar para calcular cuota estimada
 */
function calcularCuotaEstimada(monto, tasaAnual, plazo, unidad) {
    const capital = parseFloat(monto) || 0;
    const tasa = parseFloat(tasaAnual) || 0;
    let plazoMeses = parseInt(plazo) || 0;

    // Convertir a meses si es necesario
    if (unidad === 'años') {
        plazoMeses = plazoMeses * 12;
    }

    if (capital <= 0 || plazoMeses <= 0) {
        return '0.00';
    }

    const tasaMensual = tasa / 100 / 12;

    if (tasaMensual === 0) {
        return (capital / plazoMeses).toFixed(2);
    }

    const cuota = capital * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
                 (Math.pow(1 + tasaMensual, plazoMeses) - 1);

    return cuota.toFixed(2);
}

export default ModalPrestamoOtorgado;
