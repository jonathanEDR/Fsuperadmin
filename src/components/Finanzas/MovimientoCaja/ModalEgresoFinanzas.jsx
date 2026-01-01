import React, { useState, useEffect, useMemo } from 'react';
import { X, MinusCircle, Minus, Plus, ChevronDown, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { movimientosCajaService } from '../../../services/movimientosCajaService';
import FinanzasService from '../../../services/finanzasService';

const ModalEgresoFinanzas = ({ isOpen, onClose, onSuccess }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        monto: '',
        concepto: '',
        descripcion: '',
        categoria: 'gasto_operativo',
        metodoPago: 'efectivo', // 'efectivo' o 'cuenta_bancaria'
        cuentaBancariaId: '',
        proveedor: {
            nombre: '',
            ruc: '',
            contacto: ''
        },
        documento: {
            tipo: 'recibo',
            numero: '',
            serie: ''
        },
        observaciones: '',
        // Desglose de efectivo
        desglose: {
            billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
            monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
        }
    });

    const [loading, setLoading] = useState(false);
    const [cuentasBancarias, setCuentasBancarias] = useState([]);
    const [mostrarInfoAdicional, setMostrarInfoAdicional] = useState(false);

    // Estados para préstamos
    const [prestamosConCuotas, setPrestamosConCuotas] = useState([]);
    const [loadingPrestamos, setLoadingPrestamos] = useState(false);
    const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
    const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null);

    // === NUEVO: Estado para saldo de caja (arqueo) ===
    const [saldoCaja, setSaldoCaja] = useState({
        billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
        monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
    });
    const [loadingArqueo, setLoadingArqueo] = useState(false);
    const [totalDisponibleCaja, setTotalDisponibleCaja] = useState(0);

    // Categorías de egresos
    const categoriasEgresos = useMemo(() => [
        { value: 'compra_materia_prima', label: 'Compra Materia Prima', icon: '🛒' },
        { value: 'pago_proveedor', label: 'Pago a Proveedor', icon: '👥' },
        { value: 'pago_servicio', label: 'Pago de Servicios', icon: '⚡' },
        { value: 'gasto_operativo', label: 'Gasto Operativo', icon: '🔧' },
        { value: 'pago_prestamo', label: 'Pago de Préstamo', icon: '💳' },
        { value: 'gasto_personal', label: 'Gasto Personal', icon: '👤' },
        { value: 'impuestos', label: 'Impuestos', icon: '📋' },
        { value: 'otros_egresos', label: 'Otros Egresos', icon: '📦' }
    ], []);

    // Calcular total del desglose de efectivo
    const totalDesglose = useMemo(() => {
        const { billetes, monedas } = formData.desglose;
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
        return totalBilletes + totalMonedas;
    }, [formData.desglose]);

    // Cargar cuentas bancarias y arqueo al abrir
    useEffect(() => {
        if (isOpen) {
            cargarCuentasBancarias();
            cargarArqueoCaja();  // NUEVO: Cargar saldo de caja
            resetForm();
        }
    }, [isOpen]);

    // Cargar préstamos cuando se selecciona categoría pago_prestamo
    useEffect(() => {
        if (formData.categoria === 'pago_prestamo') {
            cargarPrestamosConCuotas();
        } else {
            // Limpiar selección de préstamo si cambia la categoría
            setPrestamoSeleccionado(null);
            setCuotaSeleccionada(null);
        }
    }, [formData.categoria]);

    // === NUEVO: Función para cargar arqueo de caja ===
    const cargarArqueoCaja = async () => {
        try {
            setLoadingArqueo(true);
            const response = await movimientosCajaService.obtenerArqueo();
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
                setTotalDisponibleCaja(response.data.valorCalculado || 0);
            } else {
                // Si no hay datos, inicializar en 0
                setSaldoCaja({
                    billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                    monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
                });
                setTotalDisponibleCaja(0);
            }
        } catch (error) {
            console.error('Error cargando arqueo de caja:', error);
            setSaldoCaja({
                billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
            });
            setTotalDisponibleCaja(0);
        } finally {
            setLoadingArqueo(false);
        }
    };

    const cargarCuentasBancarias = async () => {
        try {
            const response = await movimientosCajaService.obtenerCuentasDisponibles();
            if (response.success && Array.isArray(response.data)) {
                setCuentasBancarias(response.data);
            } else {
                setCuentasBancarias([]);
            }
        } catch (error) {
            console.error('Error cargando cuentas bancarias:', error);
            setCuentasBancarias([]);
        }
    };

    const cargarPrestamosConCuotas = async () => {
        try {
            setLoadingPrestamos(true);
            // Para modal de EGRESO: solo préstamos RECIBIDOS (tipoPrestatario='interno')
            // Son los préstamos donde TÚ debes pagar al banco/entidad
            const response = await FinanzasService.obtenerPrestamosConCuotasPendientes('egreso');
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

    const handlePrestamoChange = (prestamoId) => {
        const prestamo = prestamosConCuotas.find(p => p._id === prestamoId);
        setPrestamoSeleccionado(prestamo);
        setCuotaSeleccionada(null);
        // Actualizar concepto automáticamente
        if (prestamo) {
            handleInputChange('concepto', `Pago cuota préstamo ${prestamo.codigo} - ${prestamo.entidadFinanciera}`);
        }
    };

    const handleCuotaChange = (cuotaId) => {
        if (!prestamoSeleccionado) return;
        const cuota = prestamoSeleccionado.cuotasPendientes.find(c => c._id === cuotaId);
        setCuotaSeleccionada(cuota);
        // Auto-completar monto con el monto de la cuota
        if (cuota) {
            handleInputChange('monto', cuota.montoTotal.toString());
            handleInputChange('concepto', `Pago cuota ${cuota.numeroCuota} - ${prestamoSeleccionado.codigo} - ${prestamoSeleccionado.entidadFinanciera}`);
        }
    };

    const resetForm = () => {
        setFormData({
            monto: '',
            concepto: '',
            descripcion: '',
            categoria: 'gasto_operativo',
            metodoPago: 'efectivo',
            cuentaBancariaId: '',
            proveedor: { nombre: '', ruc: '', contacto: '' },
            documento: { tipo: 'recibo', numero: '', serie: '' },
            observaciones: '',
            desglose: {
                billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
            }
        });
        setMostrarInfoAdicional(false);
        setPrestamoSeleccionado(null);
        setCuotaSeleccionada(null);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (path, value) => {
        setFormData(prev => {
            const newData = { ...prev };
            const keys = path.split('.');
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    // === MODIFICADO: handleDesgloseChange ahora valida contra saldo disponible ===
    const handleDesgloseChange = (tipo, denominacion, operation) => {
        setFormData(prev => {
            const currentValue = prev.desglose[tipo][denominacion] || 0;
            const disponible = saldoCaja[tipo][denominacion] || 0;
            
            let newValue;
            if (operation === 'add') {
                // No permitir retirar más de lo disponible
                newValue = Math.min(currentValue + 1, disponible);
            } else {
                newValue = Math.max(0, currentValue - 1);
            }
            
            return {
                ...prev,
                desglose: {
                    ...prev.desglose,
                    [tipo]: {
                        ...prev.desglose[tipo],
                        [denominacion]: newValue
                    }
                }
            };
        });
    };

    const limpiarDesglose = () => {
        setFormData(prev => ({
            ...prev,
            desglose: {
                billetes: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 },
                monedas: { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 }
            }
        }));
    };

    // === MODIFICADO: autoCompletarDesglose usa solo lo disponible en caja ===
    const autoCompletarDesglose = () => {
        const monto = parseFloat(formData.monto) || 0;
        if (monto <= 0) return;

        let restante = monto;
        const billetes = { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 };
        const monedas = { m5: 0, m2: 0, m1: 0, c50: 0, c20: 0, c10: 0 };

        // Billetes - usar solo lo disponible
        const denominacionesBilletes = [
            { key: 'b200', valor: 200 },
            { key: 'b100', valor: 100 },
            { key: 'b50', valor: 50 },
            { key: 'b20', valor: 20 },
            { key: 'b10', valor: 10 }
        ];

        for (const { key, valor } of denominacionesBilletes) {
            const disponible = saldoCaja.billetes[key] || 0;
            if (restante >= valor && disponible > 0) {
                const cantidadNecesaria = Math.floor(restante / valor);
                const cantidadUsar = Math.min(cantidadNecesaria, disponible);
                billetes[key] = cantidadUsar;
                restante -= cantidadUsar * valor;
            }
        }

        // Monedas - usar solo lo disponible
        const denominacionesMonedas = [
            { key: 'm5', valor: 5 },
            { key: 'm2', valor: 2 },
            { key: 'm1', valor: 1 },
            { key: 'c50', valor: 0.5 },
            { key: 'c20', valor: 0.2 },
            { key: 'c10', valor: 0.1 }
        ];

        for (const { key, valor } of denominacionesMonedas) {
            const disponible = saldoCaja.monedas[key] || 0;
            restante = Math.round(restante * 100) / 100; // Evitar errores de punto flotante
            if (restante >= valor && disponible > 0) {
                const cantidadNecesaria = Math.floor(restante / valor);
                const cantidadUsar = Math.min(cantidadNecesaria, disponible);
                monedas[key] = cantidadUsar;
                restante -= cantidadUsar * valor;
                restante = Math.round(restante * 100) / 100;
            }
        }

        setFormData(prev => ({ ...prev, desglose: { billetes, monedas } }));

        // Alertar si no hay suficiente efectivo
        if (restante > 0.01) {
            alert(`⚠️ No hay suficiente efectivo en caja. Faltan S/ ${restante.toFixed(2)} para completar el monto.`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        const monto = parseFloat(formData.monto);
        if (!monto || monto <= 0) {
            alert('El monto debe ser mayor a 0');
            return;
        }

        if (!formData.concepto.trim()) {
            alert('El concepto es obligatorio');
            return;
        }

        if (formData.metodoPago === 'cuenta_bancaria' && !formData.cuentaBancariaId) {
            alert('Debe seleccionar una cuenta bancaria');
            return;
        }

        // Validación específica para pago de préstamo
        if (formData.categoria === 'pago_prestamo') {
            if (!prestamoSeleccionado) {
                alert('Debe seleccionar un préstamo');
                return;
            }
            if (!cuotaSeleccionada) {
                alert('Debe seleccionar una cuota a pagar');
                return;
            }
        }

        // === NUEVA VALIDACIÓN: Verificar disponibilidad por denominación ===
        if (formData.metodoPago === 'efectivo') {
            // Validar billetes
            for (const key of Object.keys(formData.desglose.billetes)) {
                const aRetirar = formData.desglose.billetes[key] || 0;
                const disponible = saldoCaja.billetes[key] || 0;
                if (aRetirar > disponible) {
                    const nombreBillete = key.replace('b', 'S/ ');
                    alert(`No hay suficientes billetes de ${nombreBillete}. Disponible: ${disponible}, Solicitado: ${aRetirar}`);
                    return;
                }
            }
            // Validar monedas
            for (const key of Object.keys(formData.desglose.monedas)) {
                const aRetirar = formData.desglose.monedas[key] || 0;
                const disponible = saldoCaja.monedas[key] || 0;
                if (aRetirar > disponible) {
                    const nombreMoneda = key.startsWith('m') ? `S/ ${key.replace('m', '')}` : `${key.replace('c', '')} ctv`;
                    alert(`No hay suficientes monedas de ${nombreMoneda}. Disponible: ${disponible}, Solicitado: ${aRetirar}`);
                    return;
                }
            }

            // Validar que el desglose coincida con el monto (si hay desglose)
            if (totalDesglose > 0) {
                const diferencia = Math.abs(monto - totalDesglose);
                if (diferencia > 0.01) {
                    alert(`El desglose de efectivo (S/ ${totalDesglose.toFixed(2)}) no coincide con el monto (S/ ${monto.toFixed(2)})`);
                    return;
                }
            }

            // Validar que haya suficiente efectivo total
            if (totalDesglose > totalDisponibleCaja) {
                alert(`No hay suficiente efectivo en caja. Disponible: S/ ${totalDisponibleCaja.toFixed(2)}, Solicitado: S/ ${totalDesglose.toFixed(2)}`);
                return;
            }
        }

        try {
            setLoading(true);

            // Preparar datos para envío - USANDO NUEVA ESTRUCTURA
            const dataToSend = {
                tipo: 'egreso',
                monto: monto,
                concepto: formData.concepto,
                descripcion: formData.descripcion,
                categoria: formData.categoria,
                tipoMovimiento: formData.metodoPago === 'efectivo' ? 'efectivo' : 'bancario',
                detallesAdicionales: formData.metodoPago === 'efectivo'
                    ? { billetes: formData.desglose.billetes, monedas: formData.desglose.monedas }
                    : { numeroOperacion: '', banco: '' },
                observaciones: formData.observaciones,
                // Solo incluir cuenta bancaria si aplica
                cuentaBancariaId: formData.metodoPago === 'cuenta_bancaria' ? formData.cuentaBancariaId : undefined,
                afectaCuentaBancaria: formData.metodoPago === 'cuenta_bancaria'
            };

            // Agregar información de préstamo y cuota si aplica
            if (formData.categoria === 'pago_prestamo' && cuotaSeleccionada && prestamoSeleccionado) {
                dataToSend.prestamoId = prestamoSeleccionado._id;
                dataToSend.cuotaId = cuotaSeleccionada._id;
                dataToSend.referenciaPrestamo = {
                    prestamoId: prestamoSeleccionado._id,
                    prestamoCodigo: prestamoSeleccionado.codigo,
                    cuotaId: cuotaSeleccionada._id,
                    numeroCuota: cuotaSeleccionada.numeroCuota,
                    entidadFinanciera: prestamoSeleccionado.entidadFinanciera
                };
            }

            // Agregar proveedor si tiene datos
            if (formData.proveedor.nombre) {
                dataToSend.proveedor = formData.proveedor;
            }

            // Agregar documento si tiene número
            if (formData.documento.numero) {
                dataToSend.documento = formData.documento;
            }

            // Si es pago de préstamo, también registrar el pago de la cuota
            if (formData.categoria === 'pago_prestamo' && cuotaSeleccionada) {
                try {
                    await FinanzasService.registrarPagoCuota(cuotaSeleccionada._id, {
                        monto: monto,
                        metodoPago: formData.metodoPago,
                        observaciones: formData.observaciones
                    });
                } catch (errorCuota) {
                    console.error('Error registrando pago de cuota:', errorCuota);
                    // Continuamos con el registro del egreso aunque falle el pago de cuota
                }
            }

            const response = await movimientosCajaService.registrarEgreso(dataToSend);

            if (response.success) {
                alert('Egreso registrado exitosamente');
                onSuccess && onSuccess();
                onClose();
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error) {
            console.error('Error registrando egreso:', error);
            alert(`Error: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Configuración de billetes y monedas
    const billetes = [
        { key: 'b200', valor: 200, label: 'S/ 200', color: 'bg-purple-500' },
        { key: 'b100', valor: 100, label: 'S/ 100', color: 'bg-blue-500' },
        { key: 'b50', valor: 50, label: 'S/ 50', color: 'bg-orange-500' },
        { key: 'b20', valor: 20, label: 'S/ 20', color: 'bg-green-500' },
        { key: 'b10', valor: 10, label: 'S/ 10', color: 'bg-red-500' }
    ];

    const monedas = [
        { key: 'm5', valor: 5, label: '5 soles', color: 'bg-yellow-500' },
        { key: 'm2', valor: 2, label: '2 soles', color: 'bg-gray-500' },
        { key: 'm1', valor: 1, label: '1 sol', color: 'bg-yellow-400' },
        { key: 'c50', valor: 0.5, label: '0.50 ctv', color: 'bg-gray-400' },
        { key: 'c20', valor: 0.2, label: '0.20 ctv', color: 'bg-gray-400' },
        { key: 'c10', valor: 0.1, label: '0.10 ctv', color: 'bg-gray-400' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <h2 className="text-xl font-bold flex items-center">
                        <MinusCircle className="w-6 h-6 mr-2" />
                        Registrar Egreso
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Columna Principal - 3/5 */}
                        <div className="lg:col-span-3 space-y-5">
                            {/* Información Principal */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                <h3 className="font-semibold text-gray-800 flex items-center">
                                    <span className="mr-2">📝</span> Información Principal
                                </h3>

                                {/* Monto y Concepto */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Monto <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">S/</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={formData.monto}
                                                onChange={(e) => handleInputChange('monto', e.target.value)}
                                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-semibold"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Concepto <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.concepto}
                                            onChange={(e) => handleInputChange('concepto', e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="Ej: Compra de insumos"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => handleInputChange('descripcion', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                        rows="2"
                                        placeholder="Descripción detallada (opcional)"
                                    />
                                </div>
                            </div>

                            {/* Método de Pago */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                <h3 className="font-semibold text-gray-800 flex items-center">
                                    <span className="mr-2">💰</span> Método de Pago
                                </h3>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Efectivo */}
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('metodoPago', 'efectivo')}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                                            formData.metodoPago === 'efectivo'
                                                ? 'border-red-500 bg-red-50 shadow-md'
                                                : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-3xl mb-2">💵</span>
                                        <span className={`font-semibold ${formData.metodoPago === 'efectivo' ? 'text-red-700' : 'text-gray-700'}`}>
                                            Efectivo
                                        </span>
                                    </button>

                                    {/* Cuenta Bancaria */}
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('metodoPago', 'cuenta_bancaria')}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                                            formData.metodoPago === 'cuenta_bancaria'
                                                ? 'border-red-500 bg-red-50 shadow-md'
                                                : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-3xl mb-2">🏦</span>
                                        <span className={`font-semibold ${formData.metodoPago === 'cuenta_bancaria' ? 'text-red-700' : 'text-gray-700'}`}>
                                            Cuenta Bancaria
                                        </span>
                                    </button>
                                </div>

                                {/* Selector de Cuenta Bancaria */}
                                {formData.metodoPago === 'cuenta_bancaria' && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Seleccionar Cuenta <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.cuentaBancariaId}
                                            onChange={(e) => handleInputChange('cuentaBancariaId', e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                                            required={formData.metodoPago === 'cuenta_bancaria'}
                                        >
                                            <option value="">-- Seleccionar cuenta --</option>
                                            {cuentasBancarias.map(cuenta => (
                                                <option key={cuenta._id} value={cuenta._id}>
                                                    {cuenta.nombre || cuenta.banco} - {cuenta.tipoCuenta} - ****{cuenta.numeroCuenta?.slice(-4)} ({cuenta.moneda || 'PEN'} {(cuenta.saldoActual || cuenta.saldo || 0).toFixed(2)})
                                                </option>
                                            ))}
                                        </select>
                                        {cuentasBancarias.length === 0 && (
                                            <p className="text-sm text-amber-600 mt-1 flex items-center">
                                                <span className="mr-1">⚠️</span>
                                                No hay cuentas bancarias registradas
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Categoría */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-gray-800 flex items-center">
                                    <span className="mr-2">📂</span> Categoría
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {categoriasEgresos.map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => handleInputChange('categoria', cat.value)}
                                            className={`p-2.5 rounded-lg border-2 transition-all text-sm ${
                                                formData.categoria === cat.value
                                                    ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                                                    : 'border-gray-200 hover:border-red-300 text-gray-600'
                                            }`}
                                        >
                                            <span className="mr-1">{cat.icon}</span>
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sección de Préstamos y Cuotas - Solo visible cuando se selecciona pago_prestamo */}
                            {formData.categoria === 'pago_prestamo' && (
                                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200 space-y-4">
                                    <h3 className="font-bold text-gray-800 flex items-center">
                                        <CreditCard className="w-5 h-5 mr-2 text-yellow-600" />
                                        Seleccionar Préstamo y Cuota
                                    </h3>

                                    {loadingPrestamos ? (
                                        <div className="flex items-center justify-center py-6">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                                            <span className="ml-3 text-gray-600">Cargando préstamos...</span>
                                        </div>
                                    ) : prestamosConCuotas.length === 0 ? (
                                        <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 flex items-start">
                                            <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-amber-800 font-medium">No hay préstamos con cuotas pendientes</p>
                                                <p className="text-amber-700 text-sm mt-1">
                                                    No tienes préstamos activos con cuotas por pagar en este momento.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Selector de Préstamo */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Préstamo <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={prestamoSeleccionado?._id || ''}
                                                    onChange={(e) => handlePrestamoChange(e.target.value)}
                                                    className="w-full px-3 py-2.5 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white font-medium"
                                                >
                                                    <option value="">-- Seleccionar préstamo --</option>
                                                    {prestamosConCuotas.map(prestamo => (
                                                        <option key={prestamo._id} value={prestamo._id}>
                                                            {prestamo.codigo} - {prestamo.entidadFinanciera} - {prestamo.totalCuotasPendientes} cuota(s) pendiente(s) - S/ {prestamo.saldoPendiente?.toFixed(2)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Info del Préstamo Seleccionado */}
                                            {prestamoSeleccionado && (
                                                <div className="bg-white rounded-lg p-3 border border-yellow-200">
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">Entidad:</span>
                                                            <span className="ml-2 font-medium">{prestamoSeleccionado.entidadFinanciera}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Tipo:</span>
                                                            <span className="ml-2 font-medium capitalize">{prestamoSeleccionado.tipoPrestatario}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Monto Total:</span>
                                                            <span className="ml-2 font-medium">S/ {prestamoSeleccionado.montoTotal?.toFixed(2)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Saldo Pendiente:</span>
                                                            <span className="ml-2 font-medium text-red-600">S/ {prestamoSeleccionado.saldoPendiente?.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Selector de Cuota */}
                                            {prestamoSeleccionado && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Cuota a Pagar <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        {prestamoSeleccionado.cuotasPendientes.map(cuota => {
                                                            const isSelected = cuotaSeleccionada?._id === cuota._id;
                                                            const fechaVenc = cuota.fechaVencimiento ? new Date(cuota.fechaVencimiento) : null;
                                                            const isVencida = fechaVenc && fechaVenc < new Date();

                                                            return (
                                                                <button
                                                                    key={cuota._id}
                                                                    type="button"
                                                                    onClick={() => handleCuotaChange(cuota._id)}
                                                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                                                        isSelected
                                                                            ? 'border-yellow-500 bg-yellow-100 shadow-md'
                                                                            : isVencida
                                                                            ? 'border-red-200 bg-red-50 hover:border-red-300'
                                                                            : 'border-gray-200 bg-white hover:border-yellow-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center">
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                                                                isSelected ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                                                                            }`}>
                                                                                {cuota.numeroCuota}
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-semibold text-gray-800">
                                                                                    Cuota {cuota.numeroCuota}
                                                                                    {isVencida && (
                                                                                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                                                                                            VENCIDA
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500 flex items-center">
                                                                                    <Calendar className="w-3 h-3 mr-1" />
                                                                                    Vence: {fechaVenc ? fechaVenc.toLocaleDateString('es-PE') : 'No definida'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="font-bold text-lg text-gray-800">
                                                                                S/ {cuota.montoTotal?.toFixed(2)}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                Capital: S/ {(cuota.montoCapital || 0).toFixed(2)} + Int: S/ {(cuota.montoInteres || 0).toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Resumen de Cuota Seleccionada */}
                                            {cuotaSeleccionada && (
                                                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
                                                    <p className="text-sm text-green-800 font-medium flex items-center">
                                                        <span className="mr-2">✅</span>
                                                        Cuota {cuotaSeleccionada.numeroCuota} seleccionada - Monto: S/ {cuotaSeleccionada.montoTotal?.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-green-700 mt-1">
                                                        El monto se ha auto-completado en el campo correspondiente
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Información Adicional (Colapsable) */}
                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setMostrarInfoAdicional(!mostrarInfoAdicional)}
                                    className="w-full px-4 py-3 flex items-center justify-between text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <span className="font-semibold flex items-center">
                                        <span className="mr-2">📋</span> Información Adicional (Opcional)
                                    </span>
                                    <span className={`transform transition-transform ${mostrarInfoAdicional ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>

                                {mostrarInfoAdicional && (
                                    <div className="p-4 border-t border-gray-200 space-y-4">
                                        {/* Proveedor */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                            <input
                                                type="text"
                                                value={formData.proveedor.nombre}
                                                onChange={(e) => handleNestedChange('proveedor.nombre', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                placeholder="Nombre del proveedor"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                                                <input
                                                    type="text"
                                                    value={formData.proveedor.ruc}
                                                    onChange={(e) => handleNestedChange('proveedor.ruc', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    placeholder="RUC"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                                                <select
                                                    value={formData.documento.tipo}
                                                    onChange={(e) => handleNestedChange('documento.tipo', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                >
                                                    <option value="recibo">Recibo</option>
                                                    <option value="factura">Factura</option>
                                                    <option value="boleta">Boleta</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">N° Documento</label>
                                                <input
                                                    type="text"
                                                    value={formData.documento.numero}
                                                    onChange={(e) => handleNestedChange('documento.numero', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    placeholder="Número"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
                                                <input
                                                    type="text"
                                                    value={formData.documento.serie}
                                                    onChange={(e) => handleNestedChange('documento.serie', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                    placeholder="Serie"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                                <textarea
                                    value={formData.observaciones}
                                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                                    rows="2"
                                    placeholder="Observaciones adicionales (opcional)"
                                />
                            </div>
                        </div>

                        {/* Columna Desglose - 2/5 (Solo si es efectivo) */}
                        {formData.metodoPago === 'efectivo' && (
                            <div className="lg:col-span-2">
                                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 sticky top-0 border-2 border-red-200">
                                    {/* Header con totales */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-gray-800 flex items-center">
                                            <span className="mr-2">💸</span> Retiro de Efectivo
                                        </h3>
                                        {loadingArqueo ? (
                                            <span className="text-xs text-gray-500">Cargando...</span>
                                        ) : (
                                            <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow">
                                                Retirar: S/ {totalDesglose.toFixed(2)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Resumen de caja */}
                                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                        <div className="bg-blue-100 rounded-lg p-2">
                                            <span className="text-xs text-blue-600 font-medium">Disponible</span>
                                            <p className="text-sm font-bold text-blue-800">S/ {totalDisponibleCaja.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-red-100 rounded-lg p-2">
                                            <span className="text-xs text-red-600 font-medium">A Retirar</span>
                                            <p className="text-sm font-bold text-red-800">S/ {totalDesglose.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-green-100 rounded-lg p-2">
                                            <span className="text-xs text-green-600 font-medium">Quedará</span>
                                            <p className="text-sm font-bold text-green-800">S/ {(totalDisponibleCaja - totalDesglose).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Billetes */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">📄 Billetes</span>
                                            <div className="flex gap-2 text-xs">
                                                <span className="text-blue-600">Disp: {Object.values(saldoCaja.billetes).reduce((a, b) => a + b, 0)}</span>
                                                <span className="text-red-600">Ret: {Object.values(formData.desglose.billetes).reduce((a, b) => a + b, 0)}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            {billetes.map(billete => {
                                                const disponible = saldoCaja.billetes[billete.key] || 0;
                                                const aRetirar = formData.desglose.billetes[billete.key] || 0;
                                                const quedara = disponible - aRetirar;
                                                const sinStock = disponible === 0;
                                                
                                                return (
                                                    <div key={billete.key} className={`flex items-center justify-between bg-white p-2 rounded-lg shadow-sm ${sinStock ? 'opacity-50' : ''}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`${billete.color} text-white px-2 py-0.5 rounded text-xs font-bold min-w-[50px] text-center`}>
                                                                {billete.label}
                                                            </span>
                                                            <span className="text-xs text-blue-600 font-medium" title="Disponible">
                                                                📦{disponible}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDesgloseChange('billetes', billete.key, 'subtract')}
                                                                className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-40"
                                                                disabled={aRetirar === 0}
                                                            >
                                                                <Plus size={12} />
                                                            </button>
                                                            <span className={`w-8 text-center font-bold text-sm ${aRetirar > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                                {aRetirar > 0 ? `-${aRetirar}` : '0'}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDesgloseChange('billetes', billete.key, 'add')}
                                                                className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-40"
                                                                disabled={sinStock || aRetirar >= disponible}
                                                            >
                                                                <Minus size={12} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2 min-w-[70px] justify-end">
                                                            <span className={`text-xs font-semibold ${quedara >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                →{quedara}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                S/{(aRetirar * billete.valor).toFixed(0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Monedas */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">🪙 Monedas</span>
                                            <div className="flex gap-2 text-xs">
                                                <span className="text-blue-600">Disp: {Object.values(saldoCaja.monedas).reduce((a, b) => a + b, 0)}</span>
                                                <span className="text-red-600">Ret: {Object.values(formData.desglose.monedas).reduce((a, b) => a + b, 0)}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            {monedas.map(moneda => {
                                                const disponible = saldoCaja.monedas[moneda.key] || 0;
                                                const aRetirar = formData.desglose.monedas[moneda.key] || 0;
                                                const quedara = disponible - aRetirar;
                                                const sinStock = disponible === 0;
                                                
                                                return (
                                                    <div key={moneda.key} className={`flex items-center justify-between bg-white p-1.5 rounded-lg shadow-sm ${sinStock ? 'opacity-50' : ''}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`${moneda.color} text-white px-2 py-0.5 rounded text-xs font-bold min-w-[50px] text-center`}>
                                                                {moneda.label}
                                                            </span>
                                                            <span className="text-xs text-blue-600 font-medium" title="Disponible">
                                                                📦{disponible}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDesgloseChange('monedas', moneda.key, 'subtract')}
                                                                className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-40"
                                                                disabled={aRetirar === 0}
                                                            >
                                                                <Plus size={10} />
                                                            </button>
                                                            <span className={`w-6 text-center font-bold text-xs ${aRetirar > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                                {aRetirar > 0 ? `-${aRetirar}` : '0'}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDesgloseChange('monedas', moneda.key, 'add')}
                                                                className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-40"
                                                                disabled={sinStock || aRetirar >= disponible}
                                                            >
                                                                <Minus size={10} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2 min-w-[65px] justify-end">
                                                            <span className={`text-xs font-semibold ${quedara >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                →{quedara}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                S/{(aRetirar * moneda.valor).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={limpiarDesglose}
                                            className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                                        >
                                            🗑️ Limpiar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={autoCompletarDesglose}
                                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                                        >
                                            🎯 Auto
                                        </button>
                                    </div>

                                    {/* Alerta de diferencia */}
                                    {formData.monto && parseFloat(formData.monto) > 0 && totalDesglose > 0 && Math.abs(parseFloat(formData.monto) - totalDesglose) > 0.01 && (
                                        <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded-lg">
                                            <p className="text-xs text-amber-800 flex items-center">
                                                <span className="mr-1">⚠️</span>
                                                Diferencia: S/ {Math.abs(parseFloat(formData.monto) - totalDesglose).toFixed(2)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Mensaje cuando coincide */}
                                    {formData.monto && parseFloat(formData.monto) > 0 && totalDesglose > 0 && Math.abs(parseFloat(formData.monto) - totalDesglose) <= 0.01 && (
                                        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg">
                                            <p className="text-xs text-green-800 flex items-center">
                                                <span className="mr-1">✅</span>
                                                Desglose correcto
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer con botones */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Registrando...
                            </>
                        ) : (
                            <>
                                <MinusCircle className="w-4 h-4 mr-2" />
                                Registrar Egreso
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalEgresoFinanzas;
