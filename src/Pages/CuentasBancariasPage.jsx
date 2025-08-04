import React, { useState, useEffect, useCallback } from 'react';
import TablaFinanciera from '../components/Finanzas/TablaFinanciera';
import ModalFinanciero from '../components/Finanzas/ModalFinanciero';
import CampoFormulario, { useFormulario } from '../components/Finanzas/CampoFormulario';
import TarjetaFinanciera from '../components/Finanzas/TarjetaFinanciera';
import { cuentasBancariasService, finanzasService } from '../services/finanzasService';

const CuentasBancariasPage = () => {
    const [cuentas, setCuentas] = useState([]);
    const [resumenCuentas, setResumenCuentas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalMovimiento, setModalMovimiento] = useState(false);
    const [cuentaEditando, setCuentaEditando] = useState(null);
    const [cuentaMovimiento, setCuentaMovimiento] = useState(null);
    const [tipoMovimiento, setTipoMovimiento] = useState('deposito');
    const [filtros, setFiltros] = useState({
        banco: '',
        tipoCuenta: '',
        moneda: '',
        activa: ''
    });
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        limite: 20
    });

    // Formulario para cuentas
    const validacionesCuenta = {
        nombre: (valor) => !valor ? 'El nombre es requerido' : '',
        banco: (valor) => !valor ? 'El banco es requerido' : '',
        tipoCuenta: (valor) => !valor ? 'El tipo de cuenta es requerido' : '',
        numeroCuenta: (valor) => !valor ? 'El número de cuenta es requerido' : '',
        moneda: (valor) => !valor ? 'La moneda es requerida' : '',
        titular: (valor) => !valor ? 'El titular es requerido' : '',
        saldoInicial: (valor) => {
            if (valor === '' || valor === null || valor === undefined) return 'El saldo inicial es requerido';
            if (isNaN(valor) || parseFloat(valor) < 0) return 'El saldo inicial debe ser un número positivo';
            return '';
        }
    };

    const formularioCuenta = useFormulario({
        nombre: '',
        banco: '',
        tipoCuenta: '',
        numeroCuenta: '',
        moneda: 'PEN',
        saldoInicial: 0,
        titular: '',
        descripcion: '',
        alertas: {
            saldoMinimo: 0,
            notificarMovimientos: true
        }
    }, validacionesCuenta);

    // Formulario para movimientos
    const validacionesMovimiento = {
        monto: (valor) => {
            if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
                return 'El monto debe ser mayor a cero';
            }
            return '';
        },
        descripcion: (valor) => !valor ? 'La descripción es requerida' : ''
    };

    const formularioMovimiento = useFormulario({
        monto: '',
        descripcion: '',
        referencia: '',
        categoria: ''
    }, validacionesMovimiento);

    const cargarCuentas = useCallback(async () => {
        try {
            setLoading(true);
            const response = await cuentasBancariasService.obtenerTodos({
                ...filtros,
                page: paginacion.paginaActual,
                limit: paginacion.limite
            });
            setCuentas(response.data.cuentas || []);
            // Solo actualizar metadatos de paginación si vienen del servidor
            if (response.data.paginacion) {
                setPaginacion(prev => ({
                    ...prev,
                    total: response.data.paginacion.total,
                    totalPaginas: response.data.paginacion.totalPaginas
                }));
            }
        } catch (error) {
            console.error('Error cargando cuentas:', error);
        } finally {
            setLoading(false);
        }
    }, [filtros, paginacion.paginaActual, paginacion.limite]);

    const cargarResumen = useCallback(async () => {
        try {
            const response = await finanzasService.obtenerResumen();
            setResumenCuentas(response.data);
        } catch (error) {
            console.error('Error cargando resumen:', error);
        }
    }, []);

    useEffect(() => {
        cargarCuentas();
    }, [cargarCuentas]);

    useEffect(() => {
        cargarResumen();
    }, [cargarResumen]);

    const abrirModalNuevaCuenta = () => {
        setCuentaEditando(null);
        formularioCuenta.resetear();
        setModalAbierto(true);
    };

    const abrirModalEditarCuenta = (cuenta) => {
        setCuentaEditando(cuenta);
        formularioCuenta.setValores({
            nombre: cuenta.nombre,
            banco: cuenta.banco,
            tipoCuenta: cuenta.tipoCuenta,
            numeroCuenta: cuenta.numeroCuenta,
            moneda: cuenta.moneda,
            saldoInicial: cuenta.saldoInicial,
            titular: cuenta.titular,
            descripcion: cuenta.descripcion || '',
            alertas: cuenta.alertas || {
                saldoMinimo: 0,
                notificarMovimientos: true
            }
        });
        setModalAbierto(true);
    };

    const abrirModalMovimiento = (cuenta, tipo) => {
        setCuentaMovimiento(cuenta);
        setTipoMovimiento(tipo);
        formularioMovimiento.resetear();
        setModalMovimiento(true);
    };

    const manejarSubmitCuenta = async (e) => {
        e.preventDefault();
        if (!formularioCuenta.validarFormulario()) return;

        try {
            if (cuentaEditando) {
                await cuentasBancariasService.actualizar(cuentaEditando._id, formularioCuenta.valores);
            } else {
                await cuentasBancariasService.crear(formularioCuenta.valores);
            }
            
            setModalAbierto(false);
            cargarCuentas();
            cargarResumen();
        } catch (error) {
            console.error('Error guardando cuenta:', error);
        }
    };

    const manejarSubmitMovimiento = async (e) => {
        e.preventDefault();
        if (!formularioMovimiento.validarFormulario()) return;

        try {
            const datos = {
                ...formularioMovimiento.valores,
                monto: parseFloat(formularioMovimiento.valores.monto)
            };

            if (tipoMovimiento === 'deposito') {
                await cuentasBancariasService.realizarDeposito(cuentaMovimiento._id, datos);
            } else {
                await cuentasBancariasService.realizarRetiro(cuentaMovimiento._id, datos);
            }
            
            setModalMovimiento(false);
            cargarCuentas();
            cargarResumen();
        } catch (error) {
            console.error('Error procesando movimiento:', error);
        }
    };

    const eliminarCuenta = async (cuenta) => {
        if (window.confirm(`¿Estás seguro de eliminar la cuenta ${cuenta.nombre}?`)) {
            try {
                await cuentasBancariasService.eliminar(cuenta._id);
                cargarCuentas();
                cargarResumen();
            } catch (error) {
                console.error('Error eliminando cuenta:', error);
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
        { key: 'nombre', titulo: 'Nombre', ordenable: true },
        { key: 'banco', titulo: 'Banco' },
        { key: 'tipoCuenta', titulo: 'Tipo' },
        { 
            key: 'numeroCuenta', 
            titulo: 'Número',
            render: (valor) => `***${valor.slice(-4)}`
        },
        { 
            key: 'saldoActual', 
            titulo: 'Saldo',
            render: (valor, fila) => (
                <span className={`font-semibold ${valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {finanzasService.formatearMoneda(valor, fila.moneda)}
                </span>
            )
        },
        { 
            key: 'moneda', 
            titulo: 'Moneda',
            render: (valor) => (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {valor}
                </span>
            )
        },
        { 
            key: 'activa', 
            titulo: 'Estado', 
            tipo: 'estado',
            render: (valor) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    valor ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {valor ? 'Activa' : 'Inactiva'}
                </span>
            )
        }
    ];

    const acciones = [
        {
            label: 'Depositar',
            icono: '💰',
            color: 'green',
            handler: (cuenta) => abrirModalMovimiento(cuenta, 'deposito')
        },
        {
            label: 'Retirar',
            icono: '💸',
            color: 'blue',
            handler: (cuenta) => abrirModalMovimiento(cuenta, 'retiro')
        },
        {
            label: 'Editar',
            icono: '✏️',
            color: 'blue',
            handler: (cuenta) => abrirModalEditarCuenta(cuenta)
        },
        {
            label: 'Eliminar',
            icono: '🗑️',
            color: 'red',
            handler: (cuenta) => eliminarCuenta(cuenta)
        }
    ];

    const tiposCuenta = finanzasService.obtenerTiposCuenta();
    const monedas = finanzasService.obtenerMonedas();

    const categoriasMovimiento = [
        { value: 'transferencia', label: 'Transferencia' },
        { value: 'deposito', label: 'Depósito' },
        { value: 'retiro', label: 'Retiro' },
        { value: 'pago', label: 'Pago' },
        { value: 'cobro', label: 'Cobro' },
        { value: 'ajuste', label: 'Ajuste' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">🏦 Cuentas Bancarias</h1>
                        <p className="mt-2 text-gray-600">
                            Gestiona tus cuentas bancarias y movimientos financieros
                        </p>
                    </div>
                    <button 
                        onClick={abrirModalNuevaCuenta}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        + Nueva Cuenta
                    </button>
                </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <TarjetaFinanciera
                    titulo="Total en Soles"
                    valor={resumenCuentas?.saldoTotalPEN || 0}
                    moneda="PEN"
                    icono="💰"
                    color="green"
                />
                
                <TarjetaFinanciera
                    titulo="Total en Dólares"
                    valor={resumenCuentas?.saldoTotalUSD || 0}
                    moneda="USD"
                    icono="💵"
                    color="blue"
                />
                
                <TarjetaFinanciera
                    titulo="Cuentas Activas"
                    valor={resumenCuentas?.cuentasActivas || 0}
                    icono="🏦"
                    color="purple"
                />
                
                <TarjetaFinanciera
                    titulo="Total Cuentas"
                    valor={resumenCuentas?.totalCuentas || 0}
                    icono="📊"
                    color="gray"
                />
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        options={[
                            { value: 'true', label: 'Activas' },
                            { value: 'false', label: 'Inactivas' }
                        ]}
                        placeholder="Todos los estados"
                    />
                </div>
            </div>

            {/* Tabla de Cuentas */}
            <TablaFinanciera
                titulo={`Cuentas Bancarias (${cuentas.length})`}
                datos={cuentas}
                columnas={columnas}
                loading={loading}
                paginacion={paginacion}
                onPaginaChange={(nuevaPagina) => setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }))}
                acciones={acciones}
            />

            {/* Modal Nueva/Editar Cuenta */}
            <ModalFinanciero
                isOpen={modalAbierto}
                onClose={() => setModalAbierto(false)}
                titulo={cuentaEditando ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
                onSubmit={manejarSubmitCuenta}
                size="lg"
                submitText={cuentaEditando ? 'Actualizar' : 'Crear'}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CampoFormulario
                        label="Nombre de la Cuenta"
                        name="nombre"
                        value={formularioCuenta.valores.nombre}
                        onChange={formularioCuenta.manejarCambio}
                        error={formularioCuenta.errores.nombre}
                        required
                        placeholder="Ej: Cuenta Principal BCP"
                    />
                    
                    <CampoFormulario
                        label="Banco"
                        name="banco"
                        value={formularioCuenta.valores.banco}
                        onChange={formularioCuenta.manejarCambio}
                        error={formularioCuenta.errores.banco}
                        required
                        placeholder="Ej: Banco de Crédito del Perú"
                    />
                    
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
                        label="Número de Cuenta"
                        name="numeroCuenta"
                        value={formularioCuenta.valores.numeroCuenta}
                        onChange={formularioCuenta.manejarCambio}
                        error={formularioCuenta.errores.numeroCuenta}
                        required
                        placeholder="Número completo de la cuenta"
                    />
                    
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
                    />
                    
                    <CampoFormulario
                        label="Titular"
                        name="titular"
                        value={formularioCuenta.valores.titular}
                        onChange={formularioCuenta.manejarCambio}
                        error={formularioCuenta.errores.titular}
                        required
                        placeholder="Nombre del titular de la cuenta"
                    />
                    
                    <CampoFormulario
                        label="Saldo Mínimo para Alerta"
                        name="saldoMinimo"
                        type="number"
                        value={formularioCuenta.valores.alertas?.saldoMinimo || 0}
                        onChange={(e) => formularioCuenta.setValores(prev => ({
                            ...prev,
                            alertas: {
                                ...prev.alertas,
                                saldoMinimo: parseFloat(e.target.value)
                            }
                        }))}
                        min="0"
                        step="0.01"
                        help="Se enviará una alerta cuando el saldo esté por debajo de este monto"
                    />
                </div>
                
                <CampoFormulario
                    label="Descripción"
                    name="descripcion"
                    type="textarea"
                    value={formularioCuenta.valores.descripcion}
                    onChange={formularioCuenta.manejarCambio}
                    placeholder="Descripción adicional de la cuenta..."
                />
                
                <CampoFormulario
                    name="notificarMovimientos"
                    type="checkbox"
                    label="Notificar movimientos automáticamente"
                    value={formularioCuenta.valores.alertas?.notificarMovimientos || false}
                    onChange={(e) => formularioCuenta.setValores(prev => ({
                        ...prev,
                        alertas: {
                            ...prev.alertas,
                            notificarMovimientos: e.target.checked
                        }
                    }))}
                />
            </ModalFinanciero>

            {/* Modal Movimientos */}
            <ModalFinanciero
                isOpen={modalMovimiento}
                onClose={() => setModalMovimiento(false)}
                titulo={`${tipoMovimiento === 'deposito' ? 'Depositar en' : 'Retirar de'} ${cuentaMovimiento?.nombre}`}
                onSubmit={manejarSubmitMovimiento}
                submitText={tipoMovimiento === 'deposito' ? 'Depositar' : 'Retirar'}
            >
                <CampoFormulario
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
                />
                
                <CampoFormulario
                    label="Descripción"
                    name="descripcion"
                    value={formularioMovimiento.valores.descripcion}
                    onChange={formularioMovimiento.manejarCambio}
                    error={formularioMovimiento.errores.descripcion}
                    required
                    placeholder={`Motivo del ${tipoMovimiento}`}
                />
                
                <CampoFormulario
                    label="Referencia"
                    name="referencia"
                    value={formularioMovimiento.valores.referencia}
                    onChange={formularioMovimiento.manejarCambio}
                    placeholder="Número de operación o referencia"
                />
                
                <CampoFormulario
                    label="Categoría"
                    name="categoria"
                    type="select"
                    value={formularioMovimiento.valores.categoria}
                    onChange={formularioMovimiento.manejarCambio}
                    options={categoriasMovimiento}
                    placeholder="Seleccionar categoría"
                />
            </ModalFinanciero>
        </div>
    );
};

export default CuentasBancariasPage;
