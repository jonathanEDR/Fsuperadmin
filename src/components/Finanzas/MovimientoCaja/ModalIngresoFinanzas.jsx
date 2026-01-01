import React, { useState, useEffect } from 'react';
import { DollarSign, X } from 'lucide-react';
import { movimientosCajaService } from '../../../services/movimientosCajaService';
import FinanzasService from '../../../services/finanzasService';

const ModalIngresoFinanzas = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        monto: '',
        concepto: '',
        descripcion: '',
        categoria: 'venta_producto',
        tipoMovimiento: 'efectivo',
        detallesAdicionales: {
            billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
            monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 },
            numeroOperacion: '',
            cuentaOrigen: '',
            banco: ''
        },
        cliente: {
            nombre: '',
            documento: '',
            telefono: ''
        },
        documento: {
            tipo: 'boleta',
            numero: '',
            serie: ''
        },
        observaciones: '',
        afectaCuentaBancaria: false,
        cuentaBancariaId: '',
        // Campos para cobro de préstamo
        prestamoId: '',
        cuotaId: ''
    });

    const [loading, setLoading] = useState(false);
    const [categorias] = useState({
        ingresos: [
            { value: 'venta_producto', label: 'Venta de Productos', icon: '🛒' },
            { value: 'venta_servicio', label: 'Venta de Servicios', icon: '🔧' },
            { value: 'cobro_cliente', label: 'Cobro a Cliente', icon: '💰' },
            { value: 'cobro_prestamo', label: 'Cobro de Préstamo', icon: '📋' },
            { value: 'prestamo_recibido', label: 'Préstamo Recibido', icon: '🏦' },
            { value: 'devolucion', label: 'Devolución', icon: '↩️' },
            { value: 'otros_ingresos', label: 'Otros Ingresos', icon: '📥' }
        ]
    });
    const [cuentasDisponibles, setCuentasDisponibles] = useState([]);
    const [totalCalculado, setTotalCalculado] = useState(0);
    const [mostrarInfoAdicional, setMostrarInfoAdicional] = useState(false);

    // Estados para préstamos otorgados
    const [prestamosConCuotas, setPrestamosConCuotas] = useState([]);
    const [loadingPrestamos, setLoadingPrestamos] = useState(false);
    const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
    const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null);

    // Cargar opciones cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            cargarCuentasBancarias();
            resetForm();
        }
    }, [isOpen]);

    // Cargar préstamos cuando se selecciona la categoría "cobro_prestamo"
    useEffect(() => {
        if (formData.categoria === 'cobro_prestamo') {
            cargarPrestamosConCuotas();
        }
    }, [formData.categoria]);

    // Calcular total de efectivo automáticamente
    useEffect(() => {
        if (formData.tipoMovimiento === 'efectivo') {
            const billetes = formData.detallesAdicionales.billetes || {};
            const monedas = formData.detallesAdicionales.monedas || {};

            const totalBilletes =
                (billetes.b200 || 0) * 200 +
                (billetes.b100 || 0) * 100 +
                (billetes.b50 || 0) * 50 +
                (billetes.b20 || 0) * 20 +
                (billetes.b10 || 0) * 10;

            const totalMonedas =
                (monedas.m5 || 0) * 5 +
                (monedas.m2 || 0) * 2 +
                (monedas.m1 || 0) * 1 +
                (monedas.c50 || 0) * 0.5 +
                (monedas.c20 || 0) * 0.2 +
                (monedas.c10 || 0) * 0.1;

            setTotalCalculado(totalBilletes + totalMonedas);
        }
    }, [formData.detallesAdicionales, formData.tipoMovimiento]);

    const resetForm = () => {
        setFormData({
            monto: '',
            concepto: '',
            descripcion: '',
            categoria: 'venta_producto',
            tipoMovimiento: 'efectivo',
            detallesAdicionales: {
                billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 },
                numeroOperacion: '',
                cuentaOrigen: '',
                banco: ''
            },
            cliente: { nombre: '', documento: '', telefono: '' },
            documento: { tipo: 'boleta', numero: '', serie: '' },
            observaciones: '',
            afectaCuentaBancaria: false,
            cuentaBancariaId: '',
            prestamoId: '',
            cuotaId: ''
        });
        setPrestamoSeleccionado(null);
        setCuotaSeleccionada(null);
        setPrestamosConCuotas([]);
    };

    const cargarCuentasBancarias = async () => {
        try {
            const response = await movimientosCajaService.obtenerCuentasDisponibles();
            if (response.success && response.data) {
                setCuentasDisponibles(response.data);
            }
        } catch (error) {
            console.error('Error cargando cuentas bancarias:', error);
            setCuentasDisponibles([]);
        }
    };

    // Cargar préstamos OTORGADOS con cuotas pendientes de cobro
    const cargarPrestamosConCuotas = async () => {
        try {
            setLoadingPrestamos(true);
            // Para modal de INGRESO: solo préstamos OTORGADOS (tipoPrestatario != 'interno')
            // Son los préstamos donde ELLOS te deben pagar
            const response = await FinanzasService.obtenerPrestamosConCuotasPendientes('ingreso');
            if (response.success && Array.isArray(response.data)) {
                setPrestamosConCuotas(response.data);
            } else {
                setPrestamosConCuotas([]);
            }
        } catch (error) {
            console.error('Error cargando préstamos con cuotas:', error);
            setPrestamosConCuotas([]);
        } finally {
            setLoadingPrestamos(false);
        }
    };

    const handleInputChange = (field, value) => {
        if (field === 'tipoMovimiento') {
            setFormData(prev => ({
                ...prev,
                tipoMovimiento: value,
                afectaCuentaBancaria: value === 'bancario',
                ...(value === 'efectivo' ? {
                    cuentaBancariaId: '',
                    detallesAdicionales: {
                        billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                        monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 },
                        numeroOperacion: '',
                        cuentaOrigen: '',
                        banco: ''
                    }
                } : {})
            }));
        } else if (field === 'categoria') {
            setFormData(prev => ({
                ...prev,
                categoria: value,
                // Limpiar datos de préstamo si cambia de categoría
                ...(value !== 'cobro_prestamo' ? {
                    prestamoId: '',
                    cuotaId: ''
                } : {})
            }));
            if (value !== 'cobro_prestamo') {
                setPrestamoSeleccionado(null);
                setCuotaSeleccionada(null);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleNestedChange = (path, value) => {
        setFormData(prev => {
            const keys = path.split('.');
            const newData = { ...prev };
            let current = newData;

            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    const handleBilleteMonedaChange = (tipo, denominacion, operation) => {
        const path = `detallesAdicionales.${tipo}.${denominacion}`;
        const currentValue = formData.detallesAdicionales[tipo][denominacion] || 0;
        const newValue = operation === 'add' ? currentValue + 1 : Math.max(0, currentValue - 1);
        handleNestedChange(path, newValue);
    };

    // Manejar selección de préstamo
    const handlePrestamoChange = (prestamoId) => {
        const prestamo = prestamosConCuotas.find(p => p._id === prestamoId);
        setPrestamoSeleccionado(prestamo);
        setCuotaSeleccionada(null);
        setFormData(prev => ({
            ...prev,
            prestamoId: prestamoId,
            cuotaId: '',
            monto: '',
            concepto: prestamo ? `Cobro cuota - ${prestamo.codigo} - ${prestamo.prestatario}` : ''
        }));
    };

    // Manejar selección de cuota
    const handleCuotaChange = (cuotaId) => {
        if (!prestamoSeleccionado) return;

        const cuota = prestamoSeleccionado.cuotasPendientes.find(c => c._id === cuotaId);
        setCuotaSeleccionada(cuota);

        if (cuota) {
            setFormData(prev => ({
                ...prev,
                cuotaId: cuotaId,
                monto: cuota.montoTotal.toString(),
                concepto: `Cobro cuota ${cuota.numeroCuota} - ${prestamoSeleccionado.codigo} - ${prestamoSeleccionado.prestatario}`
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!formData.monto || parseFloat(formData.monto) <= 0) {
            alert('Por favor ingresa un monto válido');
            return;
        }

        if (!formData.concepto.trim()) {
            alert('Por favor ingresa un concepto');
            return;
        }

        // Validación específica para cobro de préstamo
        if (formData.categoria === 'cobro_prestamo') {
            if (!formData.prestamoId || !formData.cuotaId) {
                alert('Por favor selecciona un préstamo y una cuota a cobrar');
                return;
            }
        }

        setLoading(true);

        try {
            // Si es cobro de préstamo, registrar el pago de la cuota
            if (formData.categoria === 'cobro_prestamo' && formData.cuotaId) {
                const datosPagoCuota = {
                    monto: parseFloat(formData.monto),
                    metodoPago: formData.tipoMovimiento,
                    observaciones: formData.observaciones || `Cobro registrado desde modal de ingreso`
                };

                const responsePago = await FinanzasService.registrarPagoCuota(formData.cuotaId, datosPagoCuota);

                if (!responsePago.success) {
                    throw new Error(responsePago.message || 'Error al registrar el cobro de la cuota');
                }

                console.log('✅ Cobro de cuota registrado:', responsePago);
            }

            // Registrar el movimiento de ingreso
            const dataToSend = {
                ...formData,
                monto: parseFloat(formData.monto),
                tipo: 'ingreso'
            };

            if (formData.tipoMovimiento === 'bancario') {
                dataToSend.afectaCuentaBancaria = true;
                dataToSend.cuentaBancariaId = formData.cuentaBancariaId;
            } else {
                dataToSend.afectaCuentaBancaria = false;
            }

            const response = await movimientosCajaService.registrarIngreso(dataToSend);

            if (response.success) {
                alert('✅ Ingreso registrado exitosamente');
                onSuccess && onSuccess();
                onClose();
            } else {
                alert(`❌ Error: ${response.message}`);
            }

        } catch (error) {
            console.error('Error registrando ingreso:', error);
            alert(`❌ Error: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Formatear fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Registrar Ingreso
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-green-200 bg-green-700 rounded-full p-1"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Tabs de categorías principales */}
                    <div className="mb-6">
                        <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-lg">
                            {categorias.ingresos.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => handleInputChange('categoria', cat.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        formData.categoria === cat.value
                                            ? 'bg-green-600 text-white shadow-md'
                                            : 'bg-white text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna 1: Información Principal */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                                📝 Información Principal
                            </h3>

                            {/* Sección especial para Cobro de Préstamo */}
                            {formData.categoria === 'cobro_prestamo' && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
                                    <h4 className="font-semibold text-green-800 flex items-center">
                                        📋 Seleccionar Préstamo y Cuota
                                    </h4>

                                    {loadingPrestamos ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                            <span className="ml-2 text-gray-600">Cargando préstamos...</span>
                                        </div>
                                    ) : prestamosConCuotas.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">
                                            <span className="text-4xl mb-2 block">📭</span>
                                            <p>No hay préstamos otorgados con cuotas pendientes de cobro</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Selector de Préstamo */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Préstamo *
                                                </label>
                                                <select
                                                    value={formData.prestamoId}
                                                    onChange={(e) => handlePrestamoChange(e.target.value)}
                                                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    required
                                                >
                                                    <option value="">Seleccione un préstamo...</option>
                                                    {prestamosConCuotas.map(prestamo => (
                                                        <option key={prestamo._id} value={prestamo._id}>
                                                            {prestamo.codigo} - {prestamo.prestatario} - {prestamo.totalCuotasPendientes} cuota(s) pendiente(s) - S/ {prestamo.saldoPendiente}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Info del Préstamo Seleccionado */}
                                            {prestamoSeleccionado && (
                                                <div className="bg-white p-3 rounded-lg border">
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">Prestatario:</span>
                                                            <span className="font-medium ml-1">{prestamoSeleccionado.prestatario}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Tipo:</span>
                                                            <span className="font-medium ml-1 capitalize">{prestamoSeleccionado.tipoPrestatario}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Monto Total:</span>
                                                            <span className="font-medium ml-1">S/ {prestamoSeleccionado.montoTotal}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Saldo Pendiente:</span>
                                                            <span className="font-medium ml-1 text-orange-600">S/ {prestamoSeleccionado.saldoPendiente}</span>
                                                        </div>
                                                        {prestamoSeleccionado.cuotasPagadasCount > 0 && (
                                                            <div className="col-span-2">
                                                                <span className="text-green-600">✅ {prestamoSeleccionado.cuotasPagadasCount} cuota(s) ya cobrada(s)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Lista de Cuotas Pendientes */}
                                            {prestamoSeleccionado && prestamoSeleccionado.cuotasPendientes.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                        Cuota a Cobrar *
                                                    </label>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        {prestamoSeleccionado.cuotasPendientes.map(cuota => (
                                                            <div
                                                                key={cuota._id}
                                                                onClick={() => handleCuotaChange(cuota._id)}
                                                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                                    cuotaSeleccionada?._id === cuota._id
                                                                        ? 'bg-green-100 border-green-500 shadow-md'
                                                                        : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center">
                                                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                                                                            cuotaSeleccionada?._id === cuota._id
                                                                                ? 'bg-green-600 text-white'
                                                                                : 'bg-gray-200 text-gray-700'
                                                                        }`}>
                                                                            {cuota.numeroCuota}
                                                                        </span>
                                                                        <div>
                                                                            <div className="font-medium">Cuota {cuota.numeroCuota}</div>
                                                                            <div className="text-xs text-gray-500">
                                                                                📅 Vence: {formatearFecha(cuota.fechaVencimiento)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-bold text-green-700">S/ {cuota.montoTotal}</div>
                                                                        <div className="text-xs text-gray-500">
                                                                            Capital: S/ {cuota.montoCapital} + Int: S/ {cuota.montoInteres}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Selector de Tipo de Movimiento */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <label className="block text-sm font-semibold text-gray-800 mb-3">
                                    🎯 Tipo de Movimiento *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.tipoMovimiento === 'efectivo'
                                                ? 'border-green-500 bg-green-50 text-green-800'
                                                : 'border-gray-300 bg-white hover:border-gray-400'
                                        }`}
                                        onClick={() => handleInputChange('tipoMovimiento', 'efectivo')}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">💵</div>
                                            <div className="font-medium">Efectivo/Digital</div>
                                            <div className="text-xs text-gray-600">Yape, Plin, Efectivo</div>
                                        </div>
                                    </div>
                                    <div
                                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.tipoMovimiento === 'bancario'
                                                ? 'border-blue-500 bg-blue-50 text-blue-800'
                                                : 'border-gray-300 bg-white hover:border-gray-400'
                                        }`}
                                        onClick={() => handleInputChange('tipoMovimiento', 'bancario')}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">🏦</div>
                                            <div className="font-medium">Cuenta Bancaria</div>
                                            <div className="text-xs text-gray-600">Afecta saldo bancario</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Monto y Concepto */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Monto *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={formData.monto}
                                        onChange={(e) => handleInputChange('monto', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                                        placeholder="0.00"
                                        required
                                        readOnly={formData.categoria === 'cobro_prestamo' && cuotaSeleccionada}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Concepto *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.concepto}
                                        onChange={(e) => handleInputChange('concepto', e.target.value)}
                                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Concepto del ingreso"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    rows="2"
                                    placeholder="Descripción detallada"
                                />
                            </div>

                            {/* Selector de Cuenta Bancaria o Número de Operación */}
                            {formData.tipoMovimiento === 'bancario' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            🏦 Cuenta Bancaria *
                                        </label>
                                        <select
                                            value={formData.cuentaBancariaId}
                                            onChange={(e) => handleInputChange('cuentaBancariaId', e.target.value)}
                                            className="w-full px-3 py-2 text-base border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                            required
                                        >
                                            <option value="">Seleccione una cuenta...</option>
                                            {cuentasDisponibles.map(cuenta => (
                                                <option key={cuenta.value} value={cuenta.value}>
                                                    {cuenta.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            N° Operación
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.detallesAdicionales.numeroOperacion}
                                            onChange={(e) => handleNestedChange('detallesAdicionales.numeroOperacion', e.target.value)}
                                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Número de operación"
                                        />
                                    </div>
                                </div>
                            )}
                            {/* Información Adicional Colapsable */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setMostrarInfoAdicional(!mostrarInfoAdicional)}
                                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    <span className="flex items-center">
                                        📋 Información Adicional (Opcional)
                                    </span>
                                    <span className={`transform transition-transform ${mostrarInfoAdicional ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>
                            </div>

                            {mostrarInfoAdicional && (
                                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            Cliente
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cliente.nombre}
                                            onChange={(e) => handleNestedChange('cliente.nombre', e.target.value)}
                                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Nombre del cliente"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                DNI/RUC
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.cliente.documento}
                                                onChange={(e) => handleNestedChange('cliente.documento', e.target.value)}
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="DNI/RUC"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.cliente.telefono}
                                                onChange={(e) => handleNestedChange('cliente.telefono', e.target.value)}
                                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="Teléfono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Observaciones */}
                            <div className="pt-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Observaciones
                                </label>
                                <textarea
                                    value={formData.observaciones}
                                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    rows="2"
                                    placeholder="Observaciones adicionales"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-base font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-base font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Registrando...
                                        </>
                                    ) : (
                                        '💰 Registrar Ingreso'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Columna 2: Desglose de Efectivo */}
                        {formData.tipoMovimiento === 'efectivo' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-base text-gray-900">💵 Desglose de Efectivo</h3>
                                    <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                                        S/ {totalCalculado.toFixed(2)}
                                    </div>
                                </div>

                                {/* Billetes */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                                            💴 Billetes
                                        </h4>
                                        <span className="text-xs text-green-700 font-bold bg-green-100 px-2 py-1 rounded">
                                            S/ {[
                                                { key: 'b200', valor: 200 },
                                                { key: 'b100', valor: 100 },
                                                { key: 'b50', valor: 50 },
                                                { key: 'b20', valor: 20 },
                                                { key: 'b10', valor: 10 }
                                            ].reduce((sum, b) => sum + ((formData.detallesAdicionales.billetes[b.key] || 0) * b.valor), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        {[
                                            { key: 'b200', valor: 200, label: 'S/ 200', color: 'bg-purple-500' },
                                            { key: 'b100', valor: 100, label: 'S/ 100', color: 'bg-blue-500' },
                                            { key: 'b50', valor: 50, label: 'S/ 50', color: 'bg-orange-500' },
                                            { key: 'b20', valor: 20, label: 'S/ 20', color: 'bg-green-500' },
                                            { key: 'b10', valor: 10, label: 'S/ 10', color: 'bg-red-500' }
                                        ].map(billete => {
                                            const cantidad = formData.detallesAdicionales.billetes[billete.key] || 0;
                                            const subtotal = cantidad * billete.valor;
                                            return (
                                                <div key={billete.key} className="flex items-center justify-between bg-white p-1.5 rounded border shadow-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-4 h-3 rounded ${billete.color} border`}></div>
                                                        <span className="text-sm font-bold">{billete.label}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('billetes', billete.key, 'subtract')}
                                                            className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-200"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold">{cantidad}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('billetes', billete.key, 'add')}
                                                            className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold hover:bg-green-200"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="text-xs text-green-700 font-bold min-w-[45px] text-right bg-green-50 px-1 py-0.5 rounded">
                                                            S/ {subtotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Monedas */}
                                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                                            🪙 Monedas
                                        </h4>
                                        <span className="text-xs text-amber-700 font-bold bg-amber-100 px-2 py-1 rounded">
                                            S/ {[
                                                { key: 'm5', valor: 5 },
                                                { key: 'm2', valor: 2 },
                                                { key: 'm1', valor: 1 },
                                                { key: 'c50', valor: 0.5 },
                                                { key: 'c20', valor: 0.2 },
                                                { key: 'c10', valor: 0.1 }
                                            ].reduce((sum, m) => sum + ((formData.detallesAdicionales.monedas[m.key] || 0) * m.valor), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        {[
                                            { key: 'm5', valor: 5, label: '5 soles', color: 'bg-yellow-500' },
                                            { key: 'm2', valor: 2, label: '2 soles', color: 'bg-gray-500' },
                                            { key: 'm1', valor: 1, label: '1 sol', color: 'bg-yellow-400' },
                                            { key: 'c50', valor: 0.5, label: '50 ctv', color: 'bg-gray-400' },
                                            { key: 'c20', valor: 0.2, label: '20 ctv', color: 'bg-gray-400' },
                                            { key: 'c10', valor: 0.1, label: '10 ctv', color: 'bg-gray-400' }
                                        ].map(moneda => {
                                            const cantidad = formData.detallesAdicionales.monedas[moneda.key] || 0;
                                            const subtotal = cantidad * moneda.valor;
                                            return (
                                                <div key={moneda.key} className="flex items-center justify-between bg-white p-1.5 rounded border shadow-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-4 h-4 rounded-full ${moneda.color} border`}></div>
                                                        <span className="text-sm font-bold">{moneda.label}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('monedas', moneda.key, 'subtract')}
                                                            className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-200"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold">{cantidad}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleBilleteMonedaChange('monedas', moneda.key, 'add')}
                                                            className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold hover:bg-green-200"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="text-xs text-amber-700 font-bold min-w-[45px] text-right bg-amber-50 px-1 py-0.5 rounded">
                                                            S/ {subtotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Botones de Acción */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                detallesAdicionales: {
                                                    ...prev.detallesAdicionales,
                                                    billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                                                    monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
                                                }
                                            }));
                                        }}
                                        className="px-3 py-2 bg-gray-500 text-white rounded text-sm font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center"
                                    >
                                        🗑️ Limpiar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const monto = parseFloat(formData.monto) || 0;
                                            let restante = monto;
                                            const nuevos = { billetes: {}, monedas: {} };

                                            [
                                                { key: 'b200', valor: 200, tipo: 'billetes' },
                                                { key: 'b100', valor: 100, tipo: 'billetes' },
                                                { key: 'b50', valor: 50, tipo: 'billetes' },
                                                { key: 'b20', valor: 20, tipo: 'billetes' },
                                                { key: 'b10', valor: 10, tipo: 'billetes' },
                                                { key: 'm5', valor: 5, tipo: 'monedas' },
                                                { key: 'm2', valor: 2, tipo: 'monedas' },
                                                { key: 'm1', valor: 1, tipo: 'monedas' },
                                                { key: 'c50', valor: 0.5, tipo: 'monedas' },
                                                { key: 'c20', valor: 0.2, tipo: 'monedas' },
                                                { key: 'c10', valor: 0.1, tipo: 'monedas' }
                                            ].forEach(denominacion => {
                                                const cantidad = Math.floor(restante / denominacion.valor);
                                                if (cantidad > 0) {
                                                    nuevos[denominacion.tipo][denominacion.key] = cantidad;
                                                    restante = Math.round((restante - (cantidad * denominacion.valor)) * 100) / 100;
                                                }
                                            });

                                            setFormData(prev => ({
                                                ...prev,
                                                detallesAdicionales: {
                                                    ...prev.detallesAdicionales,
                                                    billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, ...nuevos.billetes },
                                                    monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0, ...nuevos.monedas }
                                                }
                                            }));
                                        }}
                                        className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
                                    >
                                        🎯 Auto
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalIngresoFinanzas;
