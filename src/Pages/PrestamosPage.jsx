import React, { useState, useEffect, useCallback } from 'react';
import TablaFinanciera from '../components/Finanzas/TablaFinanciera';
import ModalFinanciero from '../components/Finanzas/ModalFinanciero';
import CampoFormulario, { useFormulario } from '../components/Finanzas/CampoFormulario';
import TarjetaFinanciera from '../components/Finanzas/TarjetaFinanciera';
import { prestamosService, finanzasService } from '../services/finanzasService';

const PrestamosPage = () => {
    const [prestamos, setPrestamos] = useState([]);
    const [resumenPrestamos, setResumenPrestamos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalCalculadora, setModalCalculadora] = useState(false);
    const [modalTablaAmortizacion, setModalTablaAmortizacion] = useState(false);
    const [prestamoEditando, setPrestamoEditando] = useState(null);
    const [tablaAmortizacion, setTablaAmortizacion] = useState([]);
    const [calculoCuota, setCalculoCuota] = useState(null);
    const [filtros, setFiltros] = useState({
        estado: '',
        tipoCredito: '',
        entidad: '',
        fechaInicio: '',
        fechaFin: ''
    });
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        limite: 20
    });

    // Formulario para préstamos
    const validacionesPrestamo = {
        'entidadFinanciera.nombre': (valor) => !valor ? 'El nombre de la entidad financiera es requerido' : '',
        'prestatario.nombre': (valor) => !valor ? 'El nombre del prestatario es requerido' : '',
        'prestatario.documento.numero': (valor) => !valor ? 'El documento del prestatario es requerido' : '',
        tipoCredito: (valor) => !valor ? 'El tipo de crédito es requerido' : '',
        montoSolicitado: (valor) => {
            if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
                return 'El monto solicitado debe ser mayor a cero';
            }
            return '';
        },
        'tasaInteres.porcentaje': (valor) => {
            if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
                return 'La tasa de interés debe ser mayor a cero';
            }
            return '';
        },
        'plazo.cantidad': (valor) => {
            if (!valor || isNaN(valor) || parseInt(valor) <= 0) {
                return 'El plazo debe ser mayor a cero';
            }
            return '';
        }
    };

    const formularioPrestamo = useFormulario({
        entidadFinanciera: {
            nombre: '',
            codigo: '',
            tipo: 'banco'
        },
        prestatario: {
            nombre: '',
            documento: {
                tipo: 'DNI',
                numero: ''
            },
            telefono: '',
            email: ''
        },
        tipoCredito: '',
        montoSolicitado: '',
        tasaInteres: {
            porcentaje: '',
            tipo: 'fija',
            periodo: 'anual'
        },
        plazo: {
            cantidad: '',
            unidad: 'meses'
        },
        proposito: '',
        observaciones: ''
    }, validacionesPrestamo);

    // Formulario para calculadora
    const formularioCalculadora = useFormulario({
        monto: '',
        tasaInteres: '',
        plazoMeses: ''
    }, {
        monto: (valor) => {
            if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
                return 'El monto debe ser mayor a cero';
            }
            return '';
        },
        tasaInteres: (valor) => {
            if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
                return 'La tasa de interés debe ser mayor a cero';
            }
            return '';
        },
        plazoMeses: (valor) => {
            if (!valor || isNaN(valor) || parseInt(valor) <= 0) {
                return 'El plazo debe ser mayor a cero';
            }
            return '';
        }
    });

    const cargarPrestamos = useCallback(async () => {
        try {
            setLoading(true);
            const response = await prestamosService.obtenerTodos({
                ...filtros,
                page: paginacion.paginaActual,
                limit: paginacion.limite
            });
            setPrestamos(response.data || []);
            // Solo actualizar metadatos de paginación para evitar loops
            if (response.paginacion) {
                setPaginacion(prev => ({
                    ...prev,
                    total: response.paginacion.total,
                    totalPaginas: response.paginacion.totalPaginas
                }));
            }
        } catch (error) {
            console.error('Error cargando préstamos:', error);
        } finally {
            setLoading(false);
        }
    }, [filtros, paginacion.paginaActual, paginacion.limite]);

    const cargarResumen = useCallback(async () => {
        try {
            const response = await finanzasService.obtenerResumen();
            setResumenPrestamos(response.data);
        } catch (error) {
            console.error('Error cargando resumen:', error);
        }
    }, []);

    useEffect(() => {
        cargarPrestamos();
    }, [cargarPrestamos]);

    useEffect(() => {
        cargarResumen();
    }, [cargarResumen]);

    const abrirModalNuevoPrestamo = () => {
        setPrestamoEditando(null);
        formularioPrestamo.resetear();
        setModalAbierto(true);
    };

    const abrirModalEditarPrestamo = (prestamo) => {
        setPrestamoEditando(prestamo);
        formularioPrestamo.setValores({
            entidadFinanciera: prestamo.entidadFinanciera,
            prestatario: prestamo.prestatario,
            tipoCredito: prestamo.tipoCredito,
            montoSolicitado: prestamo.montoSolicitado,
            tasaInteres: prestamo.tasaInteres,
            plazo: prestamo.plazo,
            proposito: prestamo.proposito || '',
            observaciones: prestamo.observaciones || ''
        });
        setModalAbierto(true);
    };

    const manejarSubmitPrestamo = async (e) => {
        e.preventDefault();
        if (!formularioPrestamo.validarFormulario()) return;

        try {
            if (prestamoEditando) {
                await prestamosService.actualizar(prestamoEditando._id, formularioPrestamo.valores);
            } else {
                await prestamosService.crear(formularioPrestamo.valores);
            }
            
            setModalAbierto(false);
            cargarPrestamos();
            cargarResumen();
        } catch (error) {
            console.error('Error guardando préstamo:', error);
        }
    };

    const calcularCuota = async () => {
        if (!formularioCalculadora.validarFormulario()) return;

        try {
            const response = await finanzasService.calcularCuota(formularioCalculadora.valores);
            setCalculoCuota(response.data);
        } catch (error) {
            console.error('Error calculando cuota:', error);
        }
    };

    const verTablaAmortizacion = async (prestamo) => {
        try {
            const response = await finanzasService.obtenerTablaAmortizacion(prestamo._id);
            setTablaAmortizacion(response.data);
            setModalTablaAmortizacion(true);
        } catch (error) {
            console.error('Error obteniendo tabla de amortización:', error);
        }
    };

    const aprobarPrestamo = async (prestamo) => {
        const montoAprobado = prompt('Monto aprobado:', prestamo.montoSolicitado);
        if (montoAprobado) {
            try {
                await finanzasService.aprobarPrestamo(prestamo._id, {
                    montoAprobado: parseFloat(montoAprobado),
                    observaciones: 'Aprobado desde el sistema'
                });
                cargarPrestamos();
            } catch (error) {
                console.error('Error aprobando préstamo:', error);
            }
        }
    };

    const eliminarPrestamo = async (prestamo) => {
        if (window.confirm(`¿Estás seguro de eliminar el préstamo ${prestamo.codigo}?`)) {
            try {
                await prestamosService.eliminar(prestamo._id);
                cargarPrestamos();
                cargarResumen();
            } catch (error) {
                console.error('Error eliminando préstamo:', error);
            }
        }
    };

    const columnas = [
        { 
            key: 'codigo', 
            titulo: 'Código', 
            ordenable: true,
            render: (valor) => (
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {valor}
                </span>
            )
        },
        { key: 'entidadFinanciera.nombre', titulo: 'Entidad' },
        { key: 'prestatario.nombre', titulo: 'Prestatario' },
        { key: 'tipoCredito', titulo: 'Tipo' },
        { 
            key: 'montoAprobado', 
            titulo: 'Monto Aprobado',
            render: (valor, fila) => valor 
                ? finanzasService.formatearMoneda(valor)
                : finanzasService.formatearMoneda(fila.montoSolicitado)
        },
        { 
            key: 'tasaInteres.porcentaje', 
            titulo: 'Tasa',
            render: (valor) => finanzasService.formatearPorcentaje(valor)
        },
        { 
            key: 'fechaVencimiento', 
            titulo: 'Vencimiento', 
            tipo: 'fecha'
        },
        { 
            key: 'estado', 
            titulo: 'Estado', 
            render: (valor) => {
                const colores = finanzasService.obtenerEstadosPrestamo().find(e => e.value === valor);
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${colores?.color || 'gray'}-100 text-${colores?.color || 'gray'}-800`}>
                        {colores?.label || valor}
                    </span>
                );
            }
        }
    ];

    const acciones = [
        {
            label: 'Tabla',
            icono: '📊',
            color: 'blue',
            handler: (prestamo) => verTablaAmortizacion(prestamo)
        },
        {
            label: 'Aprobar',
            icono: '✅',
            color: 'green',
            handler: (prestamo) => aprobarPrestamo(prestamo),
            mostrar: (prestamo) => prestamo.estado === 'solicitado' || prestamo.estado === 'en_evaluacion'
        },
        {
            label: 'Editar',
            icono: '✏️',
            color: 'blue',
            handler: (prestamo) => abrirModalEditarPrestamo(prestamo)
        },
        {
            label: 'Eliminar',
            icono: '🗑️',
            color: 'red',
            handler: (prestamo) => eliminarPrestamo(prestamo)
        }
    ];

    const tiposPrestamo = finanzasService.obtenerTiposPrestamo();
    const estadosPrestamo = finanzasService.obtenerEstadosPrestamo();

    const columnasAmortizacion = [
        { key: 'cuota', titulo: 'Cuota' },
        { key: 'fechaPago', titulo: 'Fecha', tipo: 'fecha' },
        { key: 'capital', titulo: 'Capital', tipo: 'moneda' },
        { key: 'interes', titulo: 'Interés', tipo: 'moneda' },
        { key: 'cuotaMensual', titulo: 'Cuota Total', tipo: 'moneda' },
        { key: 'saldoPendiente', titulo: 'Saldo Pendiente', tipo: 'moneda' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">💰 Gestión de Préstamos</h1>
                        <p className="mt-2 text-gray-600">
                            Administra solicitudes, préstamos activos y pagos
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => setModalCalculadora(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            🧮 Calculadora
                        </button>
                        <button 
                            onClick={abrirModalNuevoPrestamo}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            + Nuevo Préstamo
                        </button>
                    </div>
                </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <TarjetaFinanciera
                    titulo="Préstamos Activos"
                    valor={resumenPrestamos?.prestamosActivos || 0}
                    icono="💼"
                    color="green"
                />
                
                <TarjetaFinanciera
                    titulo="Monto Total"
                    valor={resumenPrestamos?.montoTotalPrestamos || 0}
                    moneda="PEN"
                    icono="💰"
                    color="blue"
                />
                
                <TarjetaFinanciera
                    titulo="Pendientes Aprobación"
                    valor={resumenPrestamos?.pendientesAprobacion || 0}
                    icono="⏳"
                    color="yellow"
                />
                
                <TarjetaFinanciera
                    titulo="Vencidos"
                    valor={resumenPrestamos?.prestamosVencidos || 0}
                    icono="⚠️"
                    color="red"
                />
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <CampoFormulario
                        label="Estado"
                        name="estado"
                        type="select"
                        value={filtros.estado}
                        onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                        options={estadosPrestamo}
                        placeholder="Todos los estados"
                    />
                    
                    <CampoFormulario
                        label="Tipo de Crédito"
                        name="tipoCredito"
                        type="select"
                        value={filtros.tipoCredito}
                        onChange={(e) => setFiltros(prev => ({ ...prev, tipoCredito: e.target.value }))}
                        options={tiposPrestamo}
                        placeholder="Todos los tipos"
                    />
                    
                    <CampoFormulario
                        label="Entidad"
                        name="entidad"
                        value={filtros.entidad}
                        onChange={(e) => setFiltros(prev => ({ ...prev, entidad: e.target.value }))}
                        placeholder="Buscar por entidad..."
                    />
                    
                    <CampoFormulario
                        label="Fecha Inicio"
                        name="fechaInicio"
                        type="date"
                        value={filtros.fechaInicio}
                        onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    />
                    
                    <CampoFormulario
                        label="Fecha Fin"
                        name="fechaFin"
                        type="date"
                        value={filtros.fechaFin}
                        onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                    />
                </div>
            </div>

            {/* Tabla de Préstamos */}
            <TablaFinanciera
                titulo={`Préstamos (${prestamos.length})`}
                datos={prestamos}
                columnas={columnas}
                loading={loading}
                paginacion={paginacion}
                onPaginaChange={(nuevaPagina) => setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }))}
                acciones={acciones.filter(accion => 
                    !accion.mostrar || prestamos.some(prestamo => accion.mostrar(prestamo))
                )}
            />

            {/* Modal Nuevo/Editar Préstamo */}
            <ModalFinanciero
                isOpen={modalAbierto}
                onClose={() => setModalAbierto(false)}
                titulo={prestamoEditando ? 'Editar Préstamo' : 'Nuevo Préstamo'}
                onSubmit={manejarSubmitPrestamo}
                size="xl"
                submitText={prestamoEditando ? 'Actualizar' : 'Crear'}
            >
                <div className="space-y-6">
                    {/* Datos de la Entidad Financiera */}
                    <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Entidad Financiera</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CampoFormulario
                                label="Nombre de la Entidad"
                                name="entidadFinanciera.nombre"
                                value={formularioPrestamo.valores.entidadFinanciera?.nombre || ''}
                                onChange={(e) => formularioPrestamo.setValores(prev => ({
                                    ...prev,
                                    entidadFinanciera: {
                                        ...prev.entidadFinanciera,
                                        nombre: e.target.value
                                    }
                                }))}
                                error={formularioPrestamo.errores['entidadFinanciera.nombre']}
                                required
                                placeholder="Ej: Banco de Crédito del Perú"
                            />
                            
                            <CampoFormulario
                                label="Tipo de Entidad"
                                name="entidadFinanciera.tipo"
                                type="select"
                                value={formularioPrestamo.valores.entidadFinanciera?.tipo || 'banco'}
                                onChange={(e) => formularioPrestamo.setValores(prev => ({
                                    ...prev,
                                    entidadFinanciera: {
                                        ...prev.entidadFinanciera,
                                        tipo: e.target.value
                                    }
                                }))}
                                options={[
                                    { value: 'banco', label: 'Banco' },
                                    { value: 'cooperativa', label: 'Cooperativa' },
                                    { value: 'financiera', label: 'Financiera' },
                                    { value: 'prestamista', label: 'Prestamista Individual' }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Datos del Prestatario */}
                    <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Prestatario</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CampoFormulario
                                label="Nombre Completo"
                                name="prestatario.nombre"
                                value={formularioPrestamo.valores.prestatario?.nombre || ''}
                                onChange={(e) => formularioPrestamo.setValores(prev => ({
                                    ...prev,
                                    prestatario: {
                                        ...prev.prestatario,
                                        nombre: e.target.value
                                    }
                                }))}
                                error={formularioPrestamo.errores['prestatario.nombre']}
                                required
                            />
                            
                            <CampoFormulario
                                label="Número de Documento"
                                name="prestatario.documento.numero"
                                value={formularioPrestamo.valores.prestatario?.documento?.numero || ''}
                                onChange={(e) => formularioPrestamo.setValores(prev => ({
                                    ...prev,
                                    prestatario: {
                                        ...prev.prestatario,
                                        documento: {
                                            ...prev.prestatario?.documento,
                                            numero: e.target.value
                                        }
                                    }
                                }))}
                                error={formularioPrestamo.errores['prestatario.documento.numero']}
                                required
                            />
                            
                            <CampoFormulario
                                label="Teléfono"
                                name="prestatario.telefono"
                                value={formularioPrestamo.valores.prestatario?.telefono || ''}
                                onChange={(e) => formularioPrestamo.setValores(prev => ({
                                    ...prev,
                                    prestatario: {
                                        ...prev.prestatario,
                                        telefono: e.target.value
                                    }
                                }))}
                            />
                            
                            <CampoFormulario
                                label="Email"
                                name="prestatario.email"
                                type="email"
                                value={formularioPrestamo.valores.prestatario?.email || ''}
                                onChange={(e) => formularioPrestamo.setValores(prev => ({
                                    ...prev,
                                    prestatario: {
                                        ...prev.prestatario,
                                        email: e.target.value
                                    }
                                }))}
                            />
                        </div>
                    </div>

                    {/* Datos del Préstamo */}
                    <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Detalles del Préstamo</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CampoFormulario
                                label="Tipo de Crédito"
                                name="tipoCredito"
                                type="select"
                                value={formularioPrestamo.valores.tipoCredito}
                                onChange={formularioPrestamo.manejarCambio}
                                error={formularioPrestamo.errores.tipoCredito}
                                options={tiposPrestamo}
                                required
                            />
                            
                            <CampoFormulario
                                label="Monto Solicitado"
                                name="montoSolicitado"
                                type="number"
                                value={formularioPrestamo.valores.montoSolicitado}
                                onChange={formularioPrestamo.manejarCambio}
                                error={formularioPrestamo.errores.montoSolicitado}
                                required
                                min="1"
                                step="0.01"
                                prefix="S/"
                            />
                            
                            <CampoFormulario
                                label="Tasa de Interés (%)"
                                name="tasaInteres.porcentaje"
                                type="number"
                                value={formularioPrestamo.valores.tasaInteres?.porcentaje || ''}
                                onChange={(e) => formularioPrestamo.setValores(prev => ({
                                    ...prev,
                                    tasaInteres: {
                                        ...prev.tasaInteres,
                                        porcentaje: e.target.value
                                    }
                                }))}
                                error={formularioPrestamo.errores['tasaInteres.porcentaje']}
                                required
                                min="0.01"
                                step="0.01"
                                suffix="%"
                            />
                            
                            <CampoFormulario
                                label="Plazo"
                                name="plazo.cantidad"
                                type="number"
                                value={formularioPrestamo.valores.plazo?.cantidad || ''}
                                onChange={(e) => formularioPrestamo.setValores(prev => ({
                                    ...prev,
                                    plazo: {
                                        ...prev.plazo,
                                        cantidad: e.target.value
                                    }
                                }))}
                                error={formularioPrestamo.errores['plazo.cantidad']}
                                required
                                min="1"
                                suffix="meses"
                            />
                        </div>
                    </div>

                    <CampoFormulario
                        label="Propósito del Préstamo"
                        name="proposito"
                        type="textarea"
                        value={formularioPrestamo.valores.proposito}
                        onChange={formularioPrestamo.manejarCambio}
                        placeholder="Describe el propósito o uso del préstamo..."
                    />
                    
                    <CampoFormulario
                        label="Observaciones"
                        name="observaciones"
                        type="textarea"
                        value={formularioPrestamo.valores.observaciones}
                        onChange={formularioPrestamo.manejarCambio}
                        placeholder="Observaciones adicionales..."
                    />
                </div>
            </ModalFinanciero>

            {/* Modal Calculadora de Cuotas */}
            <ModalFinanciero
                isOpen={modalCalculadora}
                onClose={() => {
                    setModalCalculadora(false);
                    setCalculoCuota(null);
                }}
                titulo="🧮 Calculadora de Cuotas"
                onSubmit={(e) => {
                    e.preventDefault();
                    calcularCuota();
                }}
                submitText="Calcular"
            >
                <div className="space-y-4">
                    <CampoFormulario
                        label="Monto del Préstamo"
                        name="monto"
                        type="number"
                        value={formularioCalculadora.valores.monto}
                        onChange={formularioCalculadora.manejarCambio}
                        error={formularioCalculadora.errores.monto}
                        required
                        min="1"
                        step="0.01"
                        prefix="S/"
                    />
                    
                    <CampoFormulario
                        label="Tasa de Interés Anual (%)"
                        name="tasaInteres"
                        type="number"
                        value={formularioCalculadora.valores.tasaInteres}
                        onChange={formularioCalculadora.manejarCambio}
                        error={formularioCalculadora.errores.tasaInteres}
                        required
                        min="0.01"
                        step="0.01"
                        suffix="%"
                    />
                    
                    <CampoFormulario
                        label="Plazo (meses)"
                        name="plazoMeses"
                        type="number"
                        value={formularioCalculadora.valores.plazoMeses}
                        onChange={formularioCalculadora.manejarCambio}
                        error={formularioCalculadora.errores.plazoMeses}
                        required
                        min="1"
                        suffix="meses"
                    />

                    {calculoCuota && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-3">Resultado del Cálculo</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Cuota Mensual:</span>
                                    <span className="font-bold text-blue-600">
                                        {finanzasService.formatearMoneda(calculoCuota.cuotaMensual)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total a Pagar:</span>
                                    <span className="font-semibold">
                                        {finanzasService.formatearMoneda(calculoCuota.totalAPagar)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Intereses:</span>
                                    <span className="text-orange-600">
                                        {finanzasService.formatearMoneda(calculoCuota.totalIntereses)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ModalFinanciero>

            {/* Modal Tabla de Amortización */}
            <ModalFinanciero
                isOpen={modalTablaAmortizacion}
                onClose={() => setModalTablaAmortizacion(false)}
                titulo="📊 Tabla de Amortización"
                size="xl"
            >
                <TablaFinanciera
                    datos={tablaAmortizacion}
                    columnas={columnasAmortizacion}
                />
            </ModalFinanciero>
        </div>
    );
};

export default PrestamosPage;
